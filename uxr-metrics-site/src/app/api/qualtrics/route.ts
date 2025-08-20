import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { QualtricsAPI } from '@/lib/api/qualtrics'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Qualtrics API token
    const apiToken = await prisma.apiToken.findFirst({
      where: {
        service: 'QUALTRICS',
        isActive: true
      }
    })

    if (!apiToken) {
      return NextResponse.json({ error: 'Qualtrics API token not configured' }, { status: 400 })
    }

    const qualtricsAPI = new QualtricsAPI(apiToken.token)
    const projects = await qualtricsAPI.getProjects()

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching Qualtrics projects:', error)
    return NextResponse.json({ error: 'Failed to fetch Qualtrics projects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { surveyIds } = await request.json()

    if (!Array.isArray(surveyIds) || surveyIds.length === 0) {
      return NextResponse.json({ error: 'Survey IDs are required' }, { status: 400 })
    }

    // Get Qualtrics API token
    const apiToken = await prisma.apiToken.findFirst({
      where: {
        service: 'QUALTRICS',
        isActive: true
      }
    })

    if (!apiToken) {
      return NextResponse.json({ error: 'Qualtrics API token not configured' }, { status: 400 })
    }

    const qualtricsAPI = new QualtricsAPI(apiToken.token)
    const importedProjects = []

    for (const surveyId of surveyIds) {
      try {
        const qualtricsProject = await qualtricsAPI.getProject(surveyId)
        const metrics = await qualtricsAPI.getProjectMetrics(surveyId)
        const responseCount = await qualtricsAPI.getResponseCount(surveyId)

        // Check if project already exists
        const existingProject = await prisma.project.findFirst({
          where: {
            source: 'QUALTRICS',
            externalId: surveyId
          }
        })

        if (existingProject) {
          // Update existing project
          const updatedProject = await prisma.project.update({
            where: { id: existingProject.id },
            data: {
              title: qualtricsProject.name,
              participantCount: responseCount,
              metrics: {
                deleteMany: {},
                create: Object.entries(metrics).map(([key, value]) => ({
                  metricKey: key,
                  value: String(value)
                }))
              }
            },
            include: {
              createdBy: { select: { id: true, name: true, email: true } },
              tags: { include: { tag: { include: { category: true } } } },
              files: true,
              metrics: true
            }
          })
          importedProjects.push(updatedProject)
        } else {
          // Create new project
          const newProject = await prisma.project.create({
            data: {
              title: qualtricsProject.name,
              source: 'QUALTRICS',
              externalId: surveyId,
              participantCount: responseCount,
              createdById: session.user.id,
              metrics: {
                create: Object.entries(metrics).map(([key, value]) => ({
                  metricKey: key,
                  value: String(value)
                }))
              }
            },
            include: {
              createdBy: { select: { id: true, name: true, email: true } },
              tags: { include: { tag: { include: { category: true } } } },
              files: true,
              metrics: true
            }
          })
          importedProjects.push(newProject)
        }
      } catch (error) {
        console.error(`Error importing survey ${surveyId}:`, error)
      }
    }

    return NextResponse.json({ imported: importedProjects }, { status: 201 })
  } catch (error) {
    console.error('Error importing Qualtrics projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}