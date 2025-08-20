'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  EyeOff,
  Key,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface ApiToken {
  id: string
  service: 'QUALTRICS' | 'GREAT_QUESTION'
  token: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({})
  const [formData, setFormData] = useState({
    qualtricsToken: '',
    qualtricsBaseUrl: 'https://survey-platform.qualtrics.com',
    greatQuestionToken: '',
    greatQuestionBaseUrl: 'https://api.greatquestion.co'
  })
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | null>>({
    qualtrics: null,
    greatQuestion: null
  })

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

    fetchTokens()
  }, [session, status, router])

  const fetchTokens = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tokens')
      if (response.ok) {
        const data = await response.json()
        setTokens(data)
        
        // Populate form with existing tokens
        const qualtricsToken = data.find((t: ApiToken) => t.service === 'QUALTRICS')
        const greatQuestionToken = data.find((t: ApiToken) => t.service === 'GREAT_QUESTION')
        
        setFormData(prev => ({
          ...prev,
          qualtricsToken: qualtricsToken?.token || '',
          greatQuestionToken: greatQuestionToken?.token || ''
        }))
      }
    } catch (error) {
      console.error('Error fetching tokens:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveTokens = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        fetchTokens()
        alert('API tokens saved successfully!')
      }
    } catch (error) {
      console.error('Error saving tokens:', error)
      alert('Error saving tokens')
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async (service: 'qualtrics' | 'greatQuestion') => {
    try {
      setTestResults(prev => ({ ...prev, [service]: null }))
      
      const endpoint = service === 'qualtrics' ? '/api/qualtrics' : '/api/great-question'
      const response = await fetch(endpoint)
      
      if (response.ok) {
        setTestResults(prev => ({ ...prev, [service]: 'success' }))
      } else {
        setTestResults(prev => ({ ...prev, [service]: 'error' }))
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [service]: 'error' }))
    }
  }

  const toggleTokenVisibility = (service: string) => {
    setShowTokens(prev => ({ ...prev, [service]: !prev[service] }))
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
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* API Integrations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">API Integrations</h2>
            
            {/* Qualtrics */}
            <div className="border rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Key className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Qualtrics</h3>
                    <p className="text-sm text-gray-600">Connect to sync survey data</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {testResults.qualtrics === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {testResults.qualtrics === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => testConnection('qualtrics')}
                    disabled={!formData.qualtricsToken}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Token
                  </label>
                  <div className="relative">
                    <Input
                      type={showTokens.qualtrics ? 'text' : 'password'}
                      value={formData.qualtricsToken}
                      onChange={(e) => setFormData(prev => ({ ...prev, qualtricsToken: e.target.value }))}
                      placeholder="Enter your Qualtrics API token"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleTokenVisibility('qualtrics')}
                    >
                      {showTokens.qualtrics ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base URL
                  </label>
                  <Input
                    value={formData.qualtricsBaseUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, qualtricsBaseUrl: e.target.value }))}
                    placeholder="https://survey-platform.qualtrics.com"
                  />
                </div>
              </div>
            </div>

            {/* Great Question */}
            <div className="border rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Key className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Great Question</h3>
                    <p className="text-sm text-gray-600">Connect to sync research projects</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {testResults.greatQuestion === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {testResults.greatQuestion === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => testConnection('greatQuestion')}
                    disabled={!formData.greatQuestionToken}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Token
                  </label>
                  <div className="relative">
                    <Input
                      type={showTokens.greatQuestion ? 'text' : 'password'}
                      value={formData.greatQuestionToken}
                      onChange={(e) => setFormData(prev => ({ ...prev, greatQuestionToken: e.target.value }))}
                      placeholder="Enter your Great Question API token"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleTokenVisibility('greatQuestion')}
                    >
                      {showTokens.greatQuestion ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base URL
                  </label>
                  <Input
                    value={formData.greatQuestionBaseUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, greatQuestionBaseUrl: e.target.value }))}
                    placeholder="https://api.greatquestion.co"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={saveTokens} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>

          {/* Import Projects */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Import Projects</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Qualtrics Projects</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Import surveys and their response data from Qualtrics
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={!formData.qualtricsToken}
                >
                  Import from Qualtrics
                </Button>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Great Question Projects</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Import research projects and participant data
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={!formData.greatQuestionToken}
                >
                  Import from Great Question
                </Button>
              </div>
            </div>
          </div>

          {/* Database Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Database Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{tokens.length}</div>
                <div className="text-sm text-gray-600">API Tokens</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">SQLite</div>
                <div className="text-sm text-gray-600">Database Type</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">Local</div>
                <div className="text-sm text-gray-600">Storage</div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> All data is stored locally in SQLite. For production use, 
                consider migrating to PostgreSQL or another production database.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}