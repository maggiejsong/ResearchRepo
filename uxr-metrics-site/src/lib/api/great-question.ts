import axios from 'axios'

export interface GreatQuestionProject {
  id: string
  name: string
  description?: string
  status: string
  created_at: string
  updated_at: string
  participant_count?: number
  owner: {
    id: string
    name: string
    email: string
  }
}

export interface GreatQuestionResponse {
  data: GreatQuestionProject[]
  meta: {
    total: number
    page: number
    per_page: number
  }
}

export class GreatQuestionAPI {
  private apiToken: string
  private baseUrl: string

  constructor(apiToken: string, baseUrl: string = 'https://api.greatquestion.co') {
    this.apiToken = apiToken
    this.baseUrl = baseUrl
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json'
    }
  }

  async getProjects(): Promise<GreatQuestionProject[]> {
    try {
      const response = await axios.get<GreatQuestionResponse>(
        `${this.baseUrl}/v1/projects`,
        { headers: this.getHeaders() }
      )
      return response.data.data
    } catch (error) {
      console.error('Error fetching Great Question projects:', error)
      throw new Error('Failed to fetch Great Question projects')
    }
  }

  async getProject(projectId: string): Promise<GreatQuestionProject> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/projects/${projectId}`,
        { headers: this.getHeaders() }
      )
      return response.data.data
    } catch (error) {
      console.error('Error fetching Great Question project:', error)
      throw new Error('Failed to fetch Great Question project')
    }
  }

  async getProjectMetrics(projectId: string): Promise<Record<string, unknown>> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/projects/${projectId}/analytics`,
        { headers: this.getHeaders() }
      )
      return response.data.data
    } catch (error) {
      console.error('Error fetching Great Question metrics:', error)
      return {}
    }
  }

  async getParticipants(projectId: string): Promise<unknown[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/projects/${projectId}/participants`,
        { headers: this.getHeaders() }
      )
      return response.data.data
    } catch (error) {
      console.error('Error fetching participants:', error)
      return []
    }
  }
}