const ACCESS_TOKEN_KEY = 'access_token';

type TokenClaims = {
  sub?: string;
  organization_id?: string;
};

function decodeTokenClaims(token: string | null): TokenClaims | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const normalized = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const json = atob(normalized);
    const parsed = JSON.parse(json);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeSegment(value: string | undefined, fallback: string): string {
  const trimmed = String(value || '').trim();
  return trimmed || fallback;
}

export function buildTenantStorageKey(baseKey: string): string {
  const claims = decodeTokenClaims(localStorage.getItem(ACCESS_TOKEN_KEY));
  const organizationId = normalizeSegment(claims?.organization_id, 'org_unknown');
  const userId = normalizeSegment(claims?.sub, 'user_unknown');
  return `${baseKey}:${organizationId}:${userId}`;
}
