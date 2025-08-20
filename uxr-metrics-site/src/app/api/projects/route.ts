import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProjectFormData } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const categories = searchParams.get('categories')?.split(',').filter(Boolean)
    const status = searchParams.get('status')?.split(',').filter(Boolean)
    const source = searchParams.get('source')?.split(',').filter(Boolean)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = {}

    // Text search
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    }

    // Filter by status
    if (status && status.length > 0) {
      where.status = { in: status }
    }

    // Filter by source
    if (source && source.length > 0) {
      where.source = { in: source }
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    // Tag and category filters
    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          tagId: { in: tags }
        }
      }
    }

    if (categories && categories.length > 0) {
      where.tags = {
        some: {
          tag: {
            categoryId: { in: categories }
          }
        }
      }
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        tags: {
          include: {
            tag: {
              include: {
                category: true
              }
            }
          }
        },
        files: true,
        metrics: true,
        _count: {
          select: {
            files: true,
            metrics: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data: ProjectFormData = await request.json()

    const project = await prisma.project.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        source: data.source,
        externalId: data.externalId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        participantCount: data.participantCount,
        budget: data.budget,
        createdById: session.user.id,
        tags: {
          create: data.tagIds.map(tagId => ({
            tagId
          }))
        }
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        tags: {
          include: {
            tag: {
              include: {
                category: true
              }
            }
          }
        },
        files: true,
        metrics: true
      }
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}