import client from './client'
import type { DashboardMetricsResponse } from './types'

export const dashboardApi = {
  metrics: async (): Promise<DashboardMetricsResponse> => {
    const res = await client.get<DashboardMetricsResponse>('/dashboard/metrics')
    return res.data
  },
}
