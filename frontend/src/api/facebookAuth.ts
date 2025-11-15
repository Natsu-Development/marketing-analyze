import { post } from './client'

interface ConnectResponse {
  success: true
  redirectUrl: string
  state: string
}

interface DisconnectResponse {
  success: true
  message: string
}

export async function connectFacebook(): Promise<void> {
  const response = await post<ConnectResponse>(
    '/api/v1/auth/facebook/session',
    { action: 'connect' }
  )

  if (response.redirectUrl) {
    window.location.href = response.redirectUrl
  }
}

export async function disconnectFacebook(accountId: string): Promise<void> {
  await post<DisconnectResponse>(
    '/api/v1/auth/facebook/session',
    { action: 'disconnect', accountId }
  )
}

export function handleOAuthCallback(): {
  status: 'success' | 'error' | null
  message?: string
} {
  const params = new URLSearchParams(window.location.search)
  const oauth = params.get('oauth')

  if (!oauth) {
    return { status: null }
  }

  if (oauth === 'success') {
    return { status: 'success' }
  }

  return {
    status: 'error',
    message: params.get('message') || 'Authentication failed',
  }
}
