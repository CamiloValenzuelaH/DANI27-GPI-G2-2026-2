# Frontend API Configuration Guide

## Problem Solved
✅ Fixed URL concatenation issues where the frontend domain was being prepended to API calls.

## How It Works

### Configuration Pattern
The frontend now uses **only** `import.meta.env.VITE_API_URL` as the base URL for all API requests:

```typescript
// frontend/src/api/client.ts
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
```

### Environment Variables

**`VITE_API_URL`** (Required)
- The complete base URL of your backend API
- **Must include** the protocol (http/https) and port
- **May include** the path prefix (e.g., `/api/v1`)
- **No manipulation** - used as-is

Examples:
```
VITE_API_URL=http://localhost:8000            # Local, no path
VITE_API_URL=http://localhost:8000/api/v1     # Local, with path
VITE_API_URL=https://api.example.com          # Production
VITE_API_URL=https://api.example.com/api/v1   # Production with path
```

**`VITE_VALIDATION_API_URL`** (Optional)
- For external validation worker if used
- Default: `http://localhost:8000/api/validate`

## Setup

### Development

1. Create `.env.local` in the frontend directory:
```bash
cd frontend
touch .env.local
```

2. Add the configuration:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

3. During development with Vite proxy:
   - `/api/*` requests are automatically proxied to the URL specified in `vite.config.ts`
   - The proxy target is set by `VITE_BACKEND_PROXY_TARGET` environment variable
   - Default: `http://127.0.0.1:8000`

### Production

Set the environment variable before building:
```bash
export VITE_API_URL=https://api.example.com/api/v1
npm run build
```

Or configure in `.env.production`:
```env
VITE_API_URL=https://api.example.com/api/v1
```

## Key Changes Made

### 1. **frontend/src/api/client.ts**
   - Simplified base URL to use only `VITE_API_URL`
   - No manipulation or concatenation with `window.location.origin`
   - Falls back to `http://localhost:8000/api/v1` if env var not set

### 2. **frontend/src/app/components/uploader/UploadModal.tsx**
   - Removed regex manipulation of API URLs
   - Direct construction: `${API_BASE_URL}/api/evidences`
   - Clean endpoint URL building

### 3. **frontend/src/api/chat.ts**
   - Removed unused `BASE_URL` constant
   - Uses inline `import.meta.env.VITE_API_URL` where needed
   - Consistent with main client configuration

## Testing URL Configuration

To verify your API URLs are correct:

1. Check the Network tab in browser DevTools
2. Look for API requests (should start with your configured `VITE_API_URL`)
3. Verify no doubling or prepending of frontend domain

Expected:
```
✅ POST http://localhost:8000/api/v1/documents/generate
✅ POST https://api.example.com/api/v1/auth/login
```

Not expected:
```
❌ POST http://localhost:3000http://localhost:8000/api/v1/documents
❌ POST http://localhost:3000/api/v1/documents  (when API is separate)
```

## Troubleshooting

**Issue**: URLs show double domain (e.g., `http://localhost:3000http://localhost:8000`)

**Solution**: 
- Ensure `VITE_API_URL` is a complete URL with protocol
- Don't set it to a relative path like `/api/v1`
- Restart the dev server after changing `.env.local`

**Issue**: CORS errors when calling API

**Solution**:
- In production, ensure `VITE_API_URL` points to the actual backend domain
- In development, the proxy in `vite.config.ts` should handle this
- Check that `VITE_BACKEND_PROXY_TARGET` is set correctly

## References

- `.env.example` - Template for environment variables
- `vite.config.ts` - Proxy configuration for development
- `frontend/src/api/client.ts` - Axios client setup
