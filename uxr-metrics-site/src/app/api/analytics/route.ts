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
    const timeRange = searchParams.get('timeRange') || '6months'

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (timeRange) {
      case '3months':
        startDate.setMonth(now.getMonth() - 3)
        break
      case '6months':
        startDate.setMonth(now.getMonth() - 6)
        break
      case '12months':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case 'all':
        startDate = new Date('2020-01-01')
        break
      default:
        startDate.setMonth(now.getMonth() - 6)
    }

    // Fetch projects within date range
    const projects = await prisma.project.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      include: {
        tags: {
          include: {
            tag: {
              include: {
                category: true
              }
            }
          }
        },
        metrics: true
      }
    })

    // Generate project trends data
    const projectTrends = []
    const months = timeRange === '3months' ? 3 : timeRange === '6months' ? 6 : 12
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      
      const monthProjects = projects.filter(p => {
        const projectDate = new Date(p.createdAt)
        return projectDate.getMonth() === date.getMonth() && 
               projectDate.getFullYear() === date.getFullYear()
      })
      
      projectTrends.push({
        month: monthName,
        completed: monthProjects.filter(p => p.status === 'COMPLETED').length,
        active: monthProjects.filter(p => p.status === 'ACTIVE').length,
        total: monthProjects.length
      })
    }

    // Generate participant metrics
    const participantMetrics = projectTrends.map(trend => {
      const monthProjects = projects.filter(p => {
        const projectDate = new Date(p.createdAt)
        const trendDate = new Date(trend.month + ' 01, 2024')
        return projectDate.getMonth() === trendDate.getMonth()
      })
      
      const totalParticipants = monthProjects.reduce((sum, p) => sum + (p.participantCount || 0), 0)
      const avgPerProject = monthProjects.length > 0 ? totalParticipants / monthProjects.length : 0
      
      return {
        month: trend.month,
        participants: totalParticipants,
        avgPerProject: Math.round(avgPerProject)
      }
    })

    // Source distribution
    const sourceCounts = projects.reduce((acc, p) => {
      acc[p.source] = (acc[p.source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const sourceDistribution = Object.entries(sourceCounts).map(([source, count]) => ({
      source: source.replace('_', ' '),
      count,
      percentage: Math.round((count / projects.length) * 100)
    }))

    // Completion rates
    const completionRates = projectTrends.map(trend => ({
      month: trend.month,
      rate: trend.total > 0 ? Math.round((trend.completed / trend.total) * 100) : 0
    }))

    // Time to completion analysis
    const completedProjects = projects.filter(p => p.status === 'COMPLETED')
    const timeToCompletion = [
      { range: '< 1 week', count: 0 },
      { range: '1-2 weeks', count: 0 },
      { range: '2-4 weeks', count: 0 },
      { range: '1-2 months', count: 0 },
      { range: '> 2 months', count: 0 }
    ]

    completedProjects.forEach(project => {
      if (project.startDate && project.endDate) {
        const duration = new Date(project.endDate).getTime() - new Date(project.startDate).getTime()
        const days = duration / (1000 * 60 * 60 * 24)
        
        if (days < 7) timeToCompletion[0].count++
        else if (days < 14) timeToCompletion[1].count++
        else if (days < 28) timeToCompletion[2].count++
        else if (days < 60) timeToCompletion[3].count++
        else timeToCompletion[4].count++
      }
    })

    // Top categories
    const categoryCounts = projects.reduce((acc, p) => {
      p.tags.forEach(({ tag }) => {
        const categoryName = tag.category.name
        acc[categoryName] = (acc[categoryName] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)

    const topCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category,
        count,
        growth: Math.floor(Math.random() * 30) - 10 // Mock growth data
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Budget analysis (mock data for now)
    const budgetAnalysis = [
      { category: 'Usability Testing', amount: 45000, projects: 12 },
      { category: 'User Interviews', amount: 32000, projects: 8 },
      { category: 'Surveys', amount: 18000, projects: 15 },
      { category: 'A/B Testing', amount: 25000, projects: 6 },
      { category: 'Card Sorting', amount: 12000, projects: 4 }
    ]

    const analyticsData = {
      projectTrends,
      participantMetrics,
      budgetAnalysis,
      sourceDistribution,
      completionRates,
      timeToCompletion,
      topCategories
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}