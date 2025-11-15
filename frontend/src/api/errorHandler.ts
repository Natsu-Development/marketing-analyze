import { ApiError } from './client'

export interface ErrorMessage {
  title: string
  description: string
  actionable: boolean
}

export function mapErrorToMessage(error: ApiError): ErrorMessage {
  switch (error.errorCode) {
    case 'VALIDATION_ERROR':
      return {
        title: 'Invalid Input',
        description: error.message || 'Please check your data and try again.',
        actionable: true,
      }

    case 'TOKEN_EXPIRED':
      return {
        title: 'Session Expired',
        description: 'Your session has expired. Please reconnect your Facebook account.',
        actionable: true,
      }

    case 'SCOPE_MISMATCH':
      return {
        title: 'Missing Permissions',
        description: 'Missing required permissions. Please reconnect and grant access.',
        actionable: true,
      }

    case 'NO_CONNECTION':
      return {
        title: 'Not Connected',
        description: 'No Facebook connection found. Please connect your account first.',
        actionable: true,
      }

    case 'NEEDS_RECONNECT':
      return {
        title: 'Connection Lost',
        description: 'Connection lost. Please reconnect your Facebook account.',
        actionable: true,
      }

    case 'INTERNAL_ERROR':
      return {
        title: 'Server Error',
        description: 'An unexpected error occurred. Please try again later.',
        actionable: false,
      }

    case 'NETWORK_ERROR':
      return {
        title: 'Connection Error',
        description: 'Unable to connect to server. Please check your internet connection.',
        actionable: true,
      }

    case 'TIMEOUT_ERROR':
      return {
        title: 'Request Timeout',
        description: 'The request took too long. Please try again.',
        actionable: true,
      }

    default:
      return {
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        actionable: false,
      }
  }
}

export function logError(error: ApiError, context: string): void {
  console.error(`[API Error] ${context}:`, {
    errorCode: error.errorCode,
    statusCode: error.statusCode,
    message: error.message,
    stack: error.stack,
  })
}

export function isRetryableError(error: ApiError): boolean {
  return ['NETWORK_ERROR', 'TIMEOUT_ERROR'].includes(error.errorCode)
}
