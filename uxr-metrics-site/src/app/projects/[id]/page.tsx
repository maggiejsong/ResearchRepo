'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Upload,
  Download,
  Calendar,
  Users,
  DollarSign,
  FileText,
  BarChart3,
  ExternalLink
} from 'lucide-react'
import { formatDate, formatFileSize } from '@/lib/utils'

interface Project {
  id: string
  title: string
  description?: string
  status: string
  source: string
  externalId?: string
  startDate?: string
  endDate?: string
  participantCount?: number
  budget?: number
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name: string
    email: string
  }
  tags: Array<{
    tag: {
      id: string
      name: string
      category: {
        id: string
        name: string
        color?: string
      }
    }
  }>
  files: Array<{
    id: string
    filename: string
    originalName: string
    mimeType: string
    size: number
    url: string
    uploadedAt: string
  }>
  metrics: Array<{
    id: string
    metricKey: string
    value: string
    createdAt: string
  }>
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingFile, setUploadingFile] = useState(false)

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

    fetchProject()
  }, [session, status, router, params.id, fetchProject])

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else {
        router.push('/projects')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      router.push('/projects')
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', params.id)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        fetchProject() // Refresh to show new file
      }
    } catch (error) {
      console.error('Error uploading file:', error)
    } finally {
      setUploadingFile(false)
    }
  }

  const deleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/projects/${params.id}`, { method: 'DELETE' })
      if (response.ok) {
        router.push('/projects')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2>
          <Link href="/projects">
            <Button>Back to Projects</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Projects
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                    project.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status}
                  </span>
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                    {project.source}
                  </span>
                  {project.externalId && (
                    <span className="text-xs text-gray-500">
                      ID: {project.externalId}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link href={`/projects/${project.id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button variant="destructive" onClick={deleteProject}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {project.description && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700">{project.description}</p>
              </div>
            )}

            {/* Metrics */}
            {project.metrics.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.metrics.map((metric) => (
                    <div key={metric.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          {metric.metricKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <BarChart3 className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">
                        {metric.value}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Updated {formatDate(metric.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Files</h2>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" disabled={uploadingFile} asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingFile ? 'Uploading...' : 'Upload File'}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              {project.files.length > 0 ? (
                <div className="space-y-3">
                  {project.files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{file.originalName}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(file.size)} • Uploaded {formatDate(file.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No files uploaded yet</p>
                  <label htmlFor="file-upload">
                    <Button variant="outline" className="mt-2" asChild>
                      <span>Upload First File</span>
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Project Details</h3>
              <div className="space-y-4">
                {project.startDate && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Start Date</p>
                      <p className="text-gray-900">{formatDate(project.startDate)}</p>
                    </div>
                  </div>
                )}

                {project.endDate && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">End Date</p>
                      <p className="text-gray-900">{formatDate(project.endDate)}</p>
                    </div>
                  </div>
                )}

                {project.participantCount && (
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Participants</p>
                      <p className="text-gray-900">{project.participantCount}</p>
                    </div>
                  </div>
                )}

                {project.budget && (
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Budget</p>
                      <p className="text-gray-900">${project.budget.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Created By</p>
                    <p className="text-gray-900">{project.createdBy.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Created</p>
                    <p className="text-gray-900">{formatDate(project.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Last Updated</p>
                    <p className="text-gray-900">{formatDate(project.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {project.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                <div className="space-y-3">
                  {project.tags.reduce((acc, projectTag) => {
                    const categoryName = projectTag.tag.category.name
                    if (!acc[categoryName]) {
                      acc[categoryName] = []
                    }
                    acc[categoryName].push(projectTag.tag)
                    return acc
                  }, {} as Record<string, Array<{ id: string; name: string }>>)}
                  {Object.entries(
                    project.tags.reduce((acc, projectTag) => {
                      const categoryName = projectTag.tag.category.name
                      if (!acc[categoryName]) {
                        acc[categoryName] = []
                      }
                      acc[categoryName].push(projectTag.tag)
                      return acc
                    }, {} as Record<string, Array<{ id: string; name: string }>>)
                  ).map(([categoryName, categoryTags]) => (
                    <div key={categoryName}>
                      <p className="text-sm font-medium text-gray-600 mb-2">{categoryName}</p>
                      <div className="flex flex-wrap gap-2">
                        {categoryTags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-1 text-sm rounded-full"
                            style={{
                              backgroundColor: tag.category.color + '20',
                              color: tag.category.color || '#6B7280'
                            }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href={`/projects/${project.id}/edit`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Project
                  </Button>
                </Link>
                
                {project.source !== 'MANUAL' && project.externalId && (
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View in {project.source}
                  </Button>
                )}

                <label htmlFor="file-upload-sidebar">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </span>
                  </Button>
                </label>
                <input
                  type="file"
                  id="file-upload-sidebar"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}