import client from './client'
import type {
  DashboardActivityItem,
  DashboardMetricsResponse,
  DashboardUpcomingTaskItem,
} from './types'

export const dashboardApi = {
  metrics: async (): Promise<DashboardMetricsResponse> => {
    const res = await client.get<DashboardMetricsResponse>('/dashboard/metrics')
    return res.data
  },

  recentActivity: async (): Promise<DashboardActivityItem[]> => {
    const res = await client.get<DashboardActivityItem[]>('/dashboard/recent-activity')
    return res.data
  },

  upcomingTasks: async (): Promise<DashboardUpcomingTaskItem[]> => {
    const res = await client.get<DashboardUpcomingTaskItem[]>('/dashboard/upcoming-tasks')
    return res.data
  },
}
