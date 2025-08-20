'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Download, 
  FileText, 
  Table, 
  BarChart3,
  Loader2,
  CheckCircle
} from 'lucide-react'

interface ExportOptions {
  format: 'csv' | 'json' | 'pdf'
  includeMetrics: boolean
  includeFiles: boolean
  includeTags: boolean
  dateRange?: {
    start: string
    end: string
  }
}

interface DataExportProps {
  projectIds?: string[]
  allProjects?: boolean
}

export function DataExport({ projectIds, allProjects = false }: DataExportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    includeMetrics: true,
    includeFiles: false,
    includeTags: true
  })

  const handleExport = async () => {
    try {
      setExporting(true)
      
      const params = new URLSearchParams({
        format: options.format,
        includeMetrics: options.includeMetrics.toString(),
        includeFiles: options.includeFiles.toString(),
        includeTags: options.includeTags.toString()
      })

      if (projectIds && !allProjects) {
        params.append('projectIds', projectIds.join(','))
      }

      if (options.dateRange?.start) {
        params.append('startDate', options.dateRange.start)
      }
      if (options.dateRange?.end) {
        params.append('endDate', options.dateRange.end)
      }

      const response = await fetch(`/api/export?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `uxr-projects-${new Date().toISOString().split('T')[0]}.${options.format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setExportSuccess(true)
      setTimeout(() => {
        setExportSuccess(false)
        setIsOpen(false)
      }, 2000)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setExporting(false)
    }
  }

  const projectCount = allProjects ? 'all' : projectIds?.length || 0

  return (
    <div className="relative">
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(!isOpen)}
        disabled={!allProjects && (!projectIds || projectIds.length === 0)}
      >
        <Download className="h-4 w-4 mr-2" />
        Export {typeof projectCount === 'number' && projectCount > 0 ? `(${projectCount})` : ''}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border rounded-lg shadow-lg p-4 z-50">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Export Options</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={options.format === 'csv' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOptions(prev => ({ ...prev, format: 'csv' }))}
                >
                  <Table className="h-4 w-4 mr-1" />
                  CSV
                </Button>
                <Button
                  variant={options.format === 'json' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOptions(prev => ({ ...prev, format: 'json' }))}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  JSON
                </Button>
                <Button
                  variant={options.format === 'pdf' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOptions(prev => ({ ...prev, format: 'pdf' }))}
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              </div>
            </div>

            {/* Include Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Include</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.includeMetrics}
                    onChange={(e) => setOptions(prev => ({ ...prev, includeMetrics: e.target.checked }))}
                    className="rounded border-gray-300 mr-2"
                  />
                  Project metrics
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.includeTags}
                    onChange={(e) => setOptions(prev => ({ ...prev, includeTags: e.target.checked }))}
                    className="rounded border-gray-300 mr-2"
                  />
                  Tags and categories
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.includeFiles}
                    onChange={(e) => setOptions(prev => ({ ...prev, includeFiles: e.target.checked }))}
                    className="rounded border-gray-300 mr-2"
                  />
                  File attachments info
                </label>
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Date</label>
              <div className="space-y-2">
                <Input
                  type="date"
                  value={options.dateRange?.start || ''}
                  onChange={(e) => setOptions(prev => ({ 
                    ...prev, 
                    dateRange: { ...prev.dateRange, start: e.target.value } as { start: string; end: string }
                  }))}
                  placeholder="Start date"
                />
                <Input
                  type="date"
                  value={options.dateRange?.end || ''}
                  onChange={(e) => setOptions(prev => ({ 
                    ...prev, 
                    dateRange: { ...prev.dateRange, end: e.target.value } as { start: string; end: string }
                  }))}
                  placeholder="End date"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : exportSuccess ? (
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {exporting ? 'Exporting...' : exportSuccess ? 'Exported!' : 'Export'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}