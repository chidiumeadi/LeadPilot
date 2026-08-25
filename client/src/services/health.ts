import { api } from './api'

export interface HealthResponse {
  success: boolean
  message: string
}

export async function checkHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>('/health')
  return data
}
