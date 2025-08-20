import axios from 'axios'

export interface QualtricsProject {
  id: string
  name: string
  ownerId: string
  organizationId: string
  isActive: boolean
  creationDate: string
  lastModified: string
  projectType: string
}

export interface QualtricsResponse {
  result: {
    elements: QualtricsProject[]
    nextPage?: string
  }
  meta: {
    httpStatus: string
    requestId: string
  }
}

export class QualtricsAPI {
  private apiToken: string
  private baseUrl: string

  constructor(apiToken: string, baseUrl: string = 'https://survey-platform.qualtrics.com') {
    this.apiToken = apiToken
    this.baseUrl = baseUrl
  }

  private getHeaders() {
    return {
      'X-API-TOKEN': this.apiToken,
      'Content-Type': 'application/json'
    }
  }

  async getProjects(): Promise<QualtricsProject[]> {
    try {
      const response = await axios.get<QualtricsResponse>(
        `${this.baseUrl}/API/v3/surveys`,
        { headers: this.getHeaders() }
      )
      return response.data.result.elements
    } catch (error) {
      console.error('Error fetching Qualtrics projects:', error)
      throw new Error('Failed to fetch Qualtrics projects')
    }
  }

  async getProject(surveyId: string): Promise<QualtricsProject> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/API/v3/surveys/${surveyId}`,
        { headers: this.getHeaders() }
      )
      return response.data.result
    } catch (error) {
      console.error('Error fetching Qualtrics project:', error)
      throw new Error('Failed to fetch Qualtrics project')
    }
  }

  async getProjectMetrics(surveyId: string): Promise<Record<string, unknown>> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/API/v3/surveys/${surveyId}/metrics`,
        { headers: this.getHeaders() }
      )
      return response.data.result
    } catch (error) {
      console.error('Error fetching Qualtrics metrics:', error)
      return {}
    }
  }

  async getResponseCount(surveyId: string): Promise<number> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/API/v3/surveys/${surveyId}/response-counts`,
        { headers: this.getHeaders() }
      )
      return response.data.result.auditable || 0
    } catch (error) {
      console.error('Error fetching response count:', error)
      return 0
    }
  }
}