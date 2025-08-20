'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DashboardCharts } from '@/components/charts/DashboardCharts'
import { 
  Plus, 
  Search, 
  Filter, 
  BarChart3, 
  Users, 
  Calendar,
  FileText,
  Tag,
  Settings
} from 'lucide-react'

interface Project {
  id: string
  title: string
  description?: string
  status: string
  source: string
  participantCount?: number
  createdAt: string
}

interface DashboardStats {
  totalProjects: number
  activeProjects: number
  totalParticipants: number
  recentProjects: Project[]
  projectStatusData: Array<{ name: string; value: number; color: string }>
  projectTimelineData: Array<{ month: string; projects: number }>
  projectsBySourceData: Array<{ source: string; count: number }>
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalParticipants: 0,
    recentProjects: [],
    projectStatusData: [],
    projectTimelineData: [],
    projectsBySourceData: []
  })
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    if (session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }

    fetchDashboardStats()
  }, [session, status, router])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/projects')
      const projects = await response.json()
      
      const totalProjects = projects.length
      const activeProjects = projects.filter((p: Project) => p.status === 'ACTIVE').length
      const totalParticipants = projects.reduce((sum: number, p: Project) => sum + (p.participantCount || 0), 0)
      const recentProjects = projects.slice(0, 5)

      // Process data for charts
      const statusCounts = projects.reduce((acc: Record<string, number>, p: Project) => {
        acc[p.status] = (acc[p.status] || 0) + 1
        return acc
      }, {})

      const projectStatusData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        value: count,
        color: status === 'ACTIVE' ? '#10B981' : 
               status === 'COMPLETED' ? '#3B82F6' : 
               status === 'PAUSED' ? '#F59E0B' : '#EF4444'
      }))

      // Timeline data for the last 6 months
      const timelineData = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        const projectsInMonth = projects.filter((p: Project) => {
          const projectDate = new Date(p.createdAt)
          return projectDate.getMonth() === date.getMonth() && 
                 projectDate.getFullYear() === date.getFullYear()
        }).length
        timelineData.push({ month: monthName, projects: projectsInMonth })
      }

      // Projects by source
      const sourceCounts = projects.reduce((acc: Record<string, number>, p: Project) => {
        acc[p.source] = (acc[p.source] || 0) + 1
        return acc
      }, {})

      const projectsBySourceData = Object.entries(sourceCounts).map(([source, count]) => ({
        source: source.replace('_', ' '),
        count
      }))

      setStats({
        totalProjects,
        activeProjects,
        totalParticipants,
        recentProjects,
        projectStatusData,
        projectTimelineData: timelineData,
        projectsBySourceData
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/projects?query=${encodeURIComponent(searchQuery)}`)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your UX research projects and metrics</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Link href="/projects?filter=true">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filter
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Participants</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalParticipants}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.recentProjects.filter(p => 
                    new Date(p.createdAt).getMonth() === new Date().getMonth()
                  ).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/projects/new">
            <Button className="w-full h-16 text-left justify-start">
              <Plus className="h-5 w-5 mr-3" />
              <div>
                <div className="font-medium">New Project</div>
                <div className="text-sm opacity-80">Create manual project</div>
              </div>
            </Button>
          </Link>

          <Link href="/projects">
            <Button variant="outline" className="w-full h-16 text-left justify-start">
              <BarChart3 className="h-5 w-5 mr-3" />
              <div>
                <div className="font-medium">View Projects</div>
                <div className="text-sm opacity-80">Browse all projects</div>
              </div>
            </Button>
          </Link>

          <Link href="/tags">
            <Button variant="outline" className="w-full h-16 text-left justify-start">
              <Tag className="h-5 w-5 mr-3" />
              <div>
                <div className="font-medium">Manage Tags</div>
                <div className="text-sm opacity-80">Organize categories</div>
              </div>
            </Button>
          </Link>

          <Link href="/settings">
            <Button variant="outline" className="w-full h-16 text-left justify-start">
              <Settings className="h-5 w-5 mr-3" />
              <div>
                <div className="font-medium">API Settings</div>
                <div className="text-sm opacity-80">Configure integrations</div>
              </div>
            </Button>
          </Link>
        </div>

        {/* Data Visualization */}
        <DashboardCharts 
          projectStatusData={stats.projectStatusData}
          projectTimelineData={stats.projectTimelineData}
          projectsBySourceData={stats.projectsBySourceData}
        />

        {/* Recent Projects */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Projects</h3>
          </div>
          <div className="p-6">
            {stats.recentProjects.length > 0 ? (
              <div className="space-y-4">
                {stats.recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{project.title}</h4>
                      <p className="text-sm text-gray-600">{project.description}</p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                          project.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {project.source}
                        </span>
                        {project.participantCount && (
                          <span className="text-xs text-gray-500">
                            {project.participantCount} participants
                          </span>
                        )}
                      </div>
                    </div>
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No projects yet. Create your first project to get started!</p>
                <Link href="/projects/new">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}