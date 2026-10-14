export interface Business {
  id: string
  name: string
  slug: string
  category: string | null
  phone: string | null
  location: string | null
  logoUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  // Display-side only — see User model comment in schema.prisma. Never
  // reflects whether the backend scheduler is creating reminders.
  inAppNotificationsEnabled: boolean
  browserNotificationsEnabled: boolean
  business: Business
}
