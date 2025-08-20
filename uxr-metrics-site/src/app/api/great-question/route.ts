import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GreatQuestionAPI } from '@/lib/api/great-question'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Great Question API token
    const apiToken = await prisma.apiToken.findFirst({
      where: {
        service: 'GREAT_QUESTION',
        isActive: true
      }
    })

    if (!apiToken) {
      return NextResponse.json({ error: 'Great Question API token not configured' }, { status: 400 })
    }

    const greatQuestionAPI = new GreatQuestionAPI(apiToken.token)
    const projects = await greatQuestionAPI.getProjects()

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching Great Question projects:', error)
    return NextResponse.json({ error: 'Failed to fetch Great Question projects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectIds } = await request.json()

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json({ error: 'Project IDs are required' }, { status: 400 })
    }

    // Get Great Question API token
    const apiToken = await prisma.apiToken.findFirst({
      where: {
        service: 'GREAT_QUESTION',
        isActive: true
      }
    })

    if (!apiToken) {
      return NextResponse.json({ error: 'Great Question API token not configured' }, { status: 400 })
    }

    const greatQuestionAPI = new GreatQuestionAPI(apiToken.token)
    const importedProjects = []

    for (const projectId of projectIds) {
      try {
        const gqProject = await greatQuestionAPI.getProject(projectId)
        const metrics = await greatQuestionAPI.getProjectMetrics(projectId)
        const participants = await greatQuestionAPI.getParticipants(projectId)

        // Check if project already exists
        const existingProject = await prisma.project.findFirst({
          where: {
            source: 'GREAT_QUESTION',
            externalId: projectId
          }
        })

        if (existingProject) {
          // Update existing project
          const updatedProject = await prisma.project.update({
            where: { id: existingProject.id },
            data: {
              title: gqProject.name,
              description: gqProject.description,
              participantCount: participants.length,
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
              title: gqProject.name,
              description: gqProject.description,
              source: 'GREAT_QUESTION',
              externalId: projectId,
              participantCount: participants.length,
              startDate: new Date(gqProject.created_at),
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
        console.error(`Error importing project ${projectId}:`, error)
      }
    }

    return NextResponse.json({ imported: importedProjects }, { status: 201 })
  } catch (error) {
    console.error('Error importing Great Question projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}