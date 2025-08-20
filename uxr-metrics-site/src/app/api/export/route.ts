import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const includeMetrics = searchParams.get('includeMetrics') === 'true'
    const includeFiles = searchParams.get('includeFiles') === 'true'
    const includeTags = searchParams.get('includeTags') === 'true'
    const projectIds = searchParams.get('projectIds')?.split(',').filter(Boolean)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = {}

    // Filter by specific project IDs
    if (projectIds && projectIds.length > 0) {
      where.id = { in: projectIds }
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        tags: includeTags ? {
          include: {
            tag: {
              include: {
                category: true
              }
            }
          }
        } : false,
        files: includeFiles,
        metrics: includeMetrics
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data for export
    const exportData = projects.map(project => {
      const baseData = {
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        source: project.source,
        externalId: project.externalId,
        startDate: project.startDate?.toISOString(),
        endDate: project.endDate?.toISOString(),
        participantCount: project.participantCount,
        budget: project.budget,
        createdBy: project.createdBy.name,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString()
      }

      if (includeTags && project.tags) {
        Object.assign(baseData, {
          tags: project.tags.map(pt => pt.tag.name).join(', '),
          categories: [...new Set(project.tags.map(pt => pt.tag.category.name))].join(', ')
        })
      }

      if (includeMetrics && project.metrics) {
        project.metrics.forEach(metric => {
          Object.assign(baseData, { [`metric_${metric.metricKey}`]: metric.value })
        })
      }

      if (includeFiles && project.files) {
        Object.assign(baseData, {
          fileCount: project.files.length,
          totalFileSize: project.files.reduce((sum, file) => sum + file.size, 0)
        })
      }

      return baseData
    })

    if (format === 'csv') {
      const csv = convertToCSV(exportData)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="uxr-projects-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else if (format === 'json') {
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="uxr-projects-${new Date().toISOString().split('T')[0]}.json"`
        }
      })
    } else if (format === 'pdf') {
      // For PDF, we'll return a simple text format for now
      // In a real implementation, you'd use a PDF library like jsPDF
      const text = generatePDFContent(exportData)
      return new NextResponse(text, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="uxr-projects-${new Date().toISOString().split('T')[0]}.txt"`
        }
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        const stringValue = value?.toString() || ''
        // Escape quotes and wrap in quotes if contains comma or quote
        return stringValue.includes(',') || stringValue.includes('"') 
          ? `"${stringValue.replace(/"/g, '""')}"` 
          : stringValue
      }).join(',')
    )
  ].join('\n')

  return csvContent
}

function generatePDFContent(data: Record<string, unknown>[]): string {
  let content = 'UXR METRICS DASHBOARD - PROJECT EXPORT\n'
  content += '=' .repeat(50) + '\n\n'
  content += `Generated: ${new Date().toLocaleString()}\n`
  content += `Total Projects: ${data.length}\n\n`

  data.forEach((project, index) => {
    content += `${index + 1}. ${project.title}\n`
    content += `-`.repeat(20) + '\n'
    content += `Status: ${project.status}\n`
    content += `Source: ${project.source}\n`
    if (project.description) content += `Description: ${project.description}\n`
    if (project.participantCount) content += `Participants: ${project.participantCount}\n`
    if (project.budget) content += `Budget: $${project.budget}\n`
    content += `Created: ${new Date(project.createdAt as string).toLocaleDateString()}\n`
    content += '\n'
  })

  return content
}