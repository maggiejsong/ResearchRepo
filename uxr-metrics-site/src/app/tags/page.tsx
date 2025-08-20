'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  Edit, 
  Tag as TagIcon,
  Folder,
  Save,
  X
} from 'lucide-react'

interface Tag {
  id: string
  name: string
  category: {
    id: string
    name: string
    color?: string
  }
  _count: {
    projects: number
  }
}

interface Category {
  id: string
  name: string
  description?: string
  color?: string
  tags: Tag[]
  _count: {
    tags: number
  }
}

export default function TagsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [showNewTag, setShowNewTag] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', description: '', color: '#3B82F6' })
  const [newTag, setNewTag] = useState({ name: '', categoryId: '' })

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

    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      const categoriesRes = await fetch('/api/categories')
      const categoriesData = await categoriesRes.json()
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCategory = async () => {
    if (!newCategory.name.trim()) return

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      })

      if (response.ok) {
        setNewCategory({ name: '', description: '', color: '#3B82F6' })
        setShowNewCategory(false)
        fetchData()
      }
    } catch (error) {
      console.error('Error creating category:', error)
    }
  }

  const createTag = async () => {
    if (!newTag.name.trim() || !newTag.categoryId) return

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTag)
      })

      if (response.ok) {
        setNewTag({ name: '', categoryId: '' })
        setShowNewTag(false)
        fetchData()
      }
    } catch (error) {
      console.error('Error creating tag:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
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
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Tags & Categories</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={() => setShowNewCategory(true)} variant="outline">
                <Folder className="h-4 w-4 mr-2" />
                New Category
              </Button>
              <Button onClick={() => setShowNewTag(true)}>
                <TagIcon className="h-4 w-4 mr-2" />
                New Tag
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Category Form */}
        {showNewCategory && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Create New Category</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowNewCategory(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Category name"
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="Description (optional)"
                value={newCategory.description}
                onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
              />
              <div className="flex space-x-2">
                <Input
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                  className="w-16"
                />
                <Button onClick={createCategory} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* New Tag Form */}
        {showNewTag && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Create New Tag</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowNewTag(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Tag name"
                value={newTag.name}
                onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
              />
              <select
                value={newTag.categoryId}
                onChange={(e) => setNewTag(prev => ({ ...prev, categoryId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Button onClick={createTag}>
                <Save className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div>
          </div>
        )}

        {/* Categories and Tags */}
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color || '#6B7280' }}
                    />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {category._count.tags} tags
                    </span>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {category.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {category.tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center space-x-2 px-3 py-1 rounded-full border"
                        style={{
                          backgroundColor: category.color + '20',
                          borderColor: category.color + '40'
                        }}
                      >
                        <span className="text-sm">{tag.name}</span>
                        <span className="text-xs text-gray-500">
                          ({tag._count.projects})
                        </span>
                        <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No tags in this category yet.</p>
                )}
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                <Folder className="h-full w-full" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-600 mb-6">
                Create your first category to start organizing your project tags.
              </p>
              <Button onClick={() => setShowNewCategory(true)}>
                <Folder className="h-4 w-4 mr-2" />
                Create Category
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}