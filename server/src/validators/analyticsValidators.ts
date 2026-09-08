import { z } from 'zod'

export const ANALYTICS_RANGES = ['7d', '30d', '90d', 'all'] as const
export const analyticsRangeEnum = z.enum(ANALYTICS_RANGES)

export const analyticsQuerySchema = z.object({
  range: analyticsRangeEnum.optional().default('30d'),
})

export type AnalyticsRange = z.infer<typeof analyticsRangeEnum>
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>
