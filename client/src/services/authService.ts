import type { AuthUser } from '../types/auth'
import { api } from './api'

export interface RegisterPayload {
  name: string
  email: string
  password: string
  businessName: string
}

export interface LoginPayload {
  email: string
  password: string
}

interface UserResponse {
  success: true
  data: { user: AuthUser }
}

interface MessageResponse {
  success: true
  message: string
}

export async function registerRequest(payload: RegisterPayload): Promise<AuthUser> {
  const { data } = await api.post<UserResponse>('/auth/register', payload)
  return data.data.user
}

export async function loginRequest(payload: LoginPayload): Promise<AuthUser> {
  const { data } = await api.post<UserResponse>('/auth/login', payload)
  return data.data.user
}

export async function logoutRequest(): Promise<void> {
  await api.post('/auth/logout')
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await api.get<UserResponse>('/auth/me')
  return data.data.user
}

export async function forgotPasswordRequest(email: string): Promise<string> {
  const { data } = await api.post<MessageResponse>('/auth/forgot-password', { email })
  return data.message
}

export async function resetPasswordRequest(token: string, password: string): Promise<string> {
  const { data } = await api.post<MessageResponse>('/auth/reset-password', { token, password })
  return data.message
}
