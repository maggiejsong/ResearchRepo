export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'VIEWER'
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  description?: string
  color?: string
  createdAt: Date
  updatedAt: Date
  tags: Tag[]
}

export interface Tag {
  id: string
  name: string
  categoryId: string
  category: Category
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  title: string
  description?: string
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED'
  source: 'MANUAL' | 'QUALTRICS' | 'GREAT_QUESTION'
  externalId?: string
  startDate?: Date
  endDate?: Date
  participantCount?: number
  budget?: number
  createdById: string
  createdBy: User
  createdAt: Date
  updatedAt: Date
  tags: ProjectTag[]
  files: ProjectFile[]
  metrics: ProjectMetric[]
}

export interface ProjectTag {
  id: string
  projectId: string
  tagId: string
  project: Project
  tag: Tag
}

export interface ProjectFile {
  id: string
  projectId: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  uploadedAt: Date
}

export interface ProjectMetric {
  id: string
  projectId: string
  metricKey: string
  value: string
  createdAt: Date
}

export interface ApiToken {
  id: string
  service: 'QUALTRICS' | 'GREAT_QUESTION'
  token: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SearchFilters {
  query?: string
  tags?: string[]
  categories?: string[]
  status?: string[]
  source?: string[]
  startDate?: Date
  endDate?: Date
}

export interface ProjectFormData {
  title: string
  description?: string
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED'
  source: 'MANUAL' | 'QUALTRICS' | 'GREAT_QUESTION'
  externalId?: string
  startDate?: string
  endDate?: string
  participantCount?: number
  budget?: number
  tagIds: string[]
}