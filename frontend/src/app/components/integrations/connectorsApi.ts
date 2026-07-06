import client, { storage } from '../../../api/client'

export type ConnectorInfo = {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error' | 'upcoming';
  lastSync?: string | null;
  scheduleHours?: number;
  backendAvailable?: boolean;
};

const defaultHeaders = { 'Content-Type': 'application/json' };

const API_BASE = '/api/v1/connectors';

async function _getStatus(provider: string) {
  try {
    const { data } = await client.get(`/connectors/${provider}/status`)
    return data
  } catch (e) {
    throw new Error('status-failed')
  }
}

export async function fetchConnectors(): Promise<ConnectorInfo[]> {
  const providers = [
    { id: 'google', name: 'Google Workspace', type: 'google' },
    { id: 'microsoft', name: 'Microsoft 365', type: 'microsoft' },
    { id: 'aws', name: 'AWS', type: 'aws' },
    { id: 'github', name: 'GitHub', type: 'github' },
  ];

  const results = await Promise.all(
    providers.map(async (p) => {
      try {
        const status = await _getStatus(p.type);
        return {
          id: p.type,
          name: p.name,
          status: status.status || (status.is_connected ? 'connected' : 'disconnected'),
          lastSync: status.last_sync_at || null,
          scheduleHours: status.auto_sync_enabled ? 24 : undefined,
          backendAvailable: true,
        } as ConnectorInfo;
      } catch (e) {
        return { id: p.type, name: p.name, status: 'upcoming', backendAvailable: false } as ConnectorInfo;
      }
    })
  );

  return results;
}

export function authUrlFor(connectorId: string) {
  return `${API_BASE}/${connectorId}/auth`;
}

export async function startOAuth(connectorId: string) {
  try {
    const { data } = await client.post(`/connectors/${connectorId}/start`)
    return data // { url }
  } catch (e) {
    throw new Error('oauth-start-failed')
  }
}

export async function disconnectConnector(connectorId: string) {
  try {
    await client.delete(`/connectors/${connectorId}`)
    return true
  } catch (e) {
    throw new Error('disconnect-failed')
  }
}

export async function updateSchedule(connectorId: string, hours: number) {
  try {
    const { data } = await client.post(`/connectors/${connectorId}/schedule`, { hours })
    return data
  } catch (e) {
    throw new Error('update-schedule-failed')
  }
}
