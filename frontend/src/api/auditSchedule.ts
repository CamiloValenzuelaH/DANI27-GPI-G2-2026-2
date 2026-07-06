import client from './client'

// Use the axios `client` baseURL by default so environment-specific mapping
// (like Docker mapping to host port 8001) is respected. Avoid hardcoding
// localhost:8000 here which caused net::ERR_EMPTY_RESPONSE in some setups.
const apiPath = '/audit-schedule'

export const auditScheduleApi = {
  get: async () => {
    const res = await client.get(`${apiPath}`)
    return res.data
  },
  update: async (payload: any) => {
    const res = await client.put(`${apiPath}`, payload)
    return res.data
  },
  markCompleted: async (payload: any = {}) => {
    const res = await client.post(`${apiPath}/mark-completed`, payload)
    return res.data
  },
}

export default auditScheduleApi
