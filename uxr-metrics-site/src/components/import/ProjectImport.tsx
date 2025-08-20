'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Download, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ExternalLink
} from 'lucide-react'

interface ExternalProject {
  id: string
  name: string
  description?: string
  participantCount?: number
  status?: string
  lastModified?: string
}

interface ProjectImportProps {
  service: 'qualtrics' | 'great-question'
  onImportComplete: () => void
}

export function ProjectImport({ service, onImportComplete }: ProjectImportProps) {
  const [availableProjects, setAvailableProjects] = useState<ExternalProject[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/${service}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${service} projects`)
      }
      
      const projects = await response.json()
      setAvailableProjects(projects)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }

  const importSelected = async () => {
    if (selectedProjects.length === 0) return

    try {
      setImporting(true)
      const endpoint = service === 'qualtrics' ? '/api/qualtrics' : '/api/great-question'
      const payload = service === 'qualtrics' 
        ? { surveyIds: selectedProjects }
        : { projectIds: selectedProjects }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to import projects')
      }

      setSelectedProjects([])
      setAvailableProjects([])
      onImportComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import projects')
    } finally {
      setImporting(false)
    }
  }

  const toggleProject = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const serviceName = service === 'qualtrics' ? 'Qualtrics' : 'Great Question'

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            service === 'qualtrics' ? 'bg-blue-100' : 'bg-green-100'
          }`}>
            <ExternalLink className={`h-4 w-4 ${
              service === 'qualtrics' ? 'text-blue-600' : 'text-green-600'
            }`} />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Import from {serviceName}</h3>
            <p className="text-sm text-gray-600">
              {service === 'qualtrics' 
                ? 'Import surveys and response data' 
                : 'Import research projects and participant data'}
            </p>
          </div>
        </div>
        <Button onClick={fetchProjects} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Loading...' : 'Fetch Projects'}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {availableProjects.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {availableProjects.length} projects found • {selectedProjects.length} selected
            </p>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedProjects(availableProjects.map(p => p.id))}
              >
                Select All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedProjects([])}
              >
                Clear All
              </Button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto border rounded-lg">
            {availableProjects.map((project) => (
              <div 
                key={project.id}
                className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                  selectedProjects.includes(project.id) ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => toggleProject(project.id)}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedProjects.includes(project.id)}
                    onChange={() => toggleProject(project.id)}
                    className="rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{project.name}</h4>
                    {project.description && (
                      <p className="text-sm text-gray-600">{project.description}</p>
                    )}
                    <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500">
                      {project.participantCount && (
                        <span>{project.participantCount} participants</span>
                      )}
                      {project.status && (
                        <span className="capitalize">{project.status.toLowerCase()}</span>
                      )}
                      {project.lastModified && (
                        <span>Modified {new Date(project.lastModified).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={importSelected}
              disabled={selectedProjects.length === 0 || importing}
            >
              {importing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {importing ? 'Importing...' : `Import ${selectedProjects.length} Projects`}
            </Button>
          </div>
        </div>
      )}

      {availableProjects.length === 0 && !loading && !error && (
        <div className="text-center py-8 text-gray-500">
          <p>Click "Fetch Projects" to load available {serviceName.toLowerCase()} projects</p>
        </div>
      )}
    </div>
  )
}