import client from './client'
import type {
  TwoFactorBackupCodesResponse,
  TwoFactorDeliveryRequest,
  TwoFactorDisableRequest,
  TwoFactorEnableResponse,
  TwoFactorVerifyRequest,
  TwoFactorVerifyResponse,
} from './types'

export const twoFactorApi = {
  enable: async (): Promise<TwoFactorEnableResponse> => {
    const res = await client.post<TwoFactorEnableResponse>('/auth/2fa/enable', {}, { baseURL: '/api' })
    return res.data
  },

  verify: async (data: TwoFactorVerifyRequest): Promise<TwoFactorVerifyResponse> => {
    const res = await client.post<TwoFactorVerifyResponse>('/auth/2fa/verify', data, { baseURL: '/api' })
    return res.data
  },

  disable: async (data: TwoFactorDisableRequest): Promise<TwoFactorVerifyResponse> => {
    const res = await client.post<TwoFactorVerifyResponse>('/auth/2fa/disable', data, { baseURL: '/api' })
    return res.data
  },

  backupCodes: async (): Promise<TwoFactorBackupCodesResponse> => {
    const res = await client.get<TwoFactorBackupCodesResponse>('/auth/2fa/backup-codes', { baseURL: '/api' })
    return res.data
  },

  sendSms: async (data: TwoFactorDeliveryRequest): Promise<{ sent: boolean; delivery_method: 'sms' }> => {
    const res = await client.post<{ sent: boolean; delivery_method: 'sms' }>('/auth/2fa/send-sms', data, { baseURL: '/api' })
    return res.data
  },

  sendEmail: async (data: TwoFactorDeliveryRequest): Promise<{ sent: boolean; delivery_method: 'email' }> => {
    const res = await client.post<{ sent: boolean; delivery_method: 'email' }>('/auth/2fa/send-email', data, { baseURL: '/api' })
    return res.data
  },
}
