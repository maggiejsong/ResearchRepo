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

    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
    const includeMetrics = searchParams.get('includeMetrics') === 'true'
    const includeFiles = searchParams.get('includeFiles') === 'true'
    const includeTags = searchParams.get('includeTags') === 'true'
    const projectIds = searchParams.get('projectIds')?.split(',').filter(Boolean)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build query filters
    const where: any = {}
    
    if (projectIds && projectIds.length > 0) {
      where.id = { in: projectIds }
    }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    // Fetch projects with related data
    const projects = await prisma.project.findMany({
      where,
      include: {
        createdBy: {
          select: { name: true, email: true }
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

    if (format === 'json') {
      return NextResponse.json(projects, {
        headers: {
          'Content-Disposition': `attachment; filename="uxr-projects-${new Date().toISOString().split('T')[0]}.json"`,
          'Content-Type': 'application/json'
        }
      })
    }

    if (format === 'csv') {
      const csvHeaders = [
        'ID',
        'Title',
        'Description',
        'Status',
        'Source',
        'Participant Count',
        'Budget',
        'Start Date',
        'End Date',
        'Created By',
        'Created At',
        'Updated At'
      ]

      if (includeTags) {
        csvHeaders.push('Tags', 'Categories')
      }

      if (includeMetrics) {
        csvHeaders.push('Metrics')
      }

      if (includeFiles) {
        csvHeaders.push('Files Count', 'Files')
      }

      const csvRows = projects.map(project => {
        const row = [
          project.id,
          `"${project.title}"`,
          `"${project.description || ''}"`,
          project.status,
          project.source,
          project.participantCount || 0,
          project.budget || 0,
          project.startDate?.toISOString().split('T')[0] || '',
          project.endDate?.toISOString().split('T')[0] || '',
          project.createdBy.name,
          project.createdAt.toISOString().split('T')[0],
          project.updatedAt.toISOString().split('T')[0]
        ]

        if (includeTags && project.tags) {
          const tags = project.tags.map(pt => pt.tag.name).join('; ')
          const categories = [...new Set(project.tags.map(pt => pt.tag.category.name))].join('; ')
          row.push(`"${tags}"`, `"${categories}"`)
        }

        if (includeMetrics && project.metrics) {
          const metrics = project.metrics.map(m => `${m.metricKey}: ${m.value}`).join('; ')
          row.push(`"${metrics}"`)
        }

        if (includeFiles && project.files) {
          const filesCount = project.files.length
          const files = project.files.map(f => f.originalName).join('; ')
          row.push(filesCount.toString(), `"${files}"`)
        }

        return row.join(',')
      })

      const csvContent = [csvHeaders.join(','), ...csvRows].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Disposition': `attachment; filename="uxr-projects-${new Date().toISOString().split('T')[0]}.csv"`,
          'Content-Type': 'text/csv'
        }
      })
    }

    if (format === 'pdf') {
      // For PDF export, we'll return a simplified HTML that can be converted to PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>UXR Projects Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { background-color: #f9f9f9; padding: 15px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>UXR Projects Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="summary">
            <h2>Summary</h2>
            <p><strong>Total Projects:</strong> ${projects.length}</p>
            <p><strong>Active Projects:</strong> ${projects.filter(p => p.status === 'ACTIVE').length}</p>
            <p><strong>Completed Projects:</strong> ${projects.filter(p => p.status === 'COMPLETED').length}</p>
            <p><strong>Total Participants:</strong> ${projects.reduce((sum, p) => sum + (p.participantCount || 0), 0)}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Source</th>
                <th>Participants</th>
                <th>Created</th>
                ${includeTags ? '<th>Tags</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${projects.map(project => `
                <tr>
                  <td>${project.title}</td>
                  <td>${project.status}</td>
                  <td>${project.source}</td>
                  <td>${project.participantCount || 0}</td>
                  <td>${project.createdAt.toLocaleDateString()}</td>
                  ${includeTags ? `<td>${project.tags?.map(pt => pt.tag.name).join(', ') || ''}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `

      return new NextResponse(htmlContent, {
        headers: {
          'Content-Disposition': `attachment; filename="uxr-projects-${new Date().toISOString().split('T')[0]}.html"`,
          'Content-Type': 'text/html'
        }
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}