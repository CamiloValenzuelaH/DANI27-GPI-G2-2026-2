import client from './client'
import type { PolicyAcknowledgmentResponse, PolicyOut } from './types'

export const portalApi = {
  listPolicies: async (): Promise<PolicyOut[]> => {
    const res = await client.get<PolicyOut[]>('/portal/policies')
    return res.data
  },

  getPolicy: async (policyId: string): Promise<PolicyOut> => {
    const res = await client.get<PolicyOut>(`/portal/policies/${policyId}`)
    return res.data
  },

  acknowledgePolicy: async (
    policyId: string,
    documentVersion: string,
  ): Promise<PolicyAcknowledgmentResponse> => {
    const res = await client.post<PolicyAcknowledgmentResponse>(
      `/portal/policies/${policyId}/acknowledge`,
      {
        document_version: documentVersion,
      },
    )
    return res.data
  },
}
