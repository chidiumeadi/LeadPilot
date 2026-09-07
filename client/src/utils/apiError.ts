import { isAxiosError } from 'axios'

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string' && message.length > 0) {
      return message
    }
  }
  return fallback
}
