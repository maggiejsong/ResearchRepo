'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Filter, 
  X, 
  Calendar,
  Tag as TagIcon,
  Search,
  RotateCcw
} from 'lucide-react'

interface Tag {
  id: string
  name: string
  category: {
    id: string
    name: string
    color?: string
  }
}

interface Category {
  id: string
  name: string
  color?: string
  tags: Tag[]
}

interface FilterState {
  query: string
  tags: string[]
  categories: string[]
  status: string[]
  source: string[]
  startDate: string
  endDate: string
}

interface ProjectFiltersProps {
  onFiltersChange: (filters: FilterState) => void
  initialFilters?: Partial<FilterState>
  className?: string
}

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', color: '#10B981' },
  { value: 'COMPLETED', label: 'Completed', color: '#3B82F6' },
  { value: 'PAUSED', label: 'Paused', color: '#F59E0B' },
  { value: 'CANCELLED', label: 'Cancelled', color: '#EF4444' }
]

const SOURCE_OPTIONS = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'QUALTRICS', label: 'Qualtrics' },
  { value: 'GREAT_QUESTION', label: 'Great Question' }
]

export function ProjectFilters({ onFiltersChange, initialFilters, className }: ProjectFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState<FilterState>({
    query: initialFilters?.query || '',
    tags: initialFilters?.tags || [],
    categories: initialFilters?.categories || [],
    status: initialFilters?.status || [],
    source: initialFilters?.source || [],
    startDate: initialFilters?.startDate || '',
    endDate: initialFilters?.endDate || ''
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const updateFilter = (key: keyof FilterState, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleArrayFilter = (key: 'tags' | 'categories' | 'status' | 'source', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value) 
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }))
  }

  const clearFilters = () => {
    setFilters({
      query: '',
      tags: [],
      categories: [],
      status: [],
      source: [],
      startDate: '',
      endDate: ''
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    Array.isArray(value) ? value.length > 0 : value !== ''
  )

  return (
    <div className={className}>
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search projects..."
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant="outline" 
          onClick={() => setIsOpen(!isOpen)}
          className={hasActiveFilters ? 'border-blue-500 text-blue-600' : ''}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters {hasActiveFilters && `(${Object.values(filters).flat().filter(v => v).length})`}
        </Button>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="bg-white border rounded-lg p-6 mb-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date Range
              </label>
              <div className="space-y-2">
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => updateFilter('startDate', e.target.value)}
                  placeholder="Start date"
                />
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => updateFilter('endDate', e.target.value)}
                  placeholder="End date"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Status
              </label>
              <div className="space-y-2">
                {STATUS_OPTIONS.map((status) => (
                  <label key={status.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status.value)}
                      onChange={() => toggleArrayFilter('status', status.value)}
                      className="rounded border-gray-300 mr-2"
                    />
                    <span className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: status.color }}
                      />
                      {status.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Source
              </label>
              <div className="space-y-2">
                {SOURCE_OPTIONS.map((source) => (
                  <label key={source.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.source.includes(source.value)}
                      onChange={() => toggleArrayFilter('source', source.value)}
                      className="rounded border-gray-300 mr-2"
                    />
                    {source.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Categories and Tags */}
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <TagIcon className="h-4 w-4 inline mr-1" />
                Categories & Tags
              </label>
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category.id} className="border rounded-lg p-4">
                    <label className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category.id)}
                        onChange={() => toggleArrayFilter('categories', category.id)}
                        className="rounded border-gray-300 mr-2"
                      />
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: category.color || '#6B7280' }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </label>
                    
                    {category.tags.length > 0 && (
                      <div className="ml-6 space-y-1">
                        {category.tags.map((tag) => (
                          <label key={tag.id} className="flex items-center text-sm">
                            <input
                              type="checkbox"
                              checked={filters.tags.includes(tag.id)}
                              onChange={() => toggleArrayFilter('tags', tag.id)}
                              className="rounded border-gray-300 mr-2"
                            />
                            {tag.name}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}