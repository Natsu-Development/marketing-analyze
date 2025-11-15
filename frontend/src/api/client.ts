import { config } from '@/config/env'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown>
  timeout?: number
}

async function request<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  const { body, timeout = 90000, ...fetchOptions } = options || {}

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(`${config.apiBaseUrl}${endpoint}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      }))

      throw new ApiError(
        response.status,
        errorData.error || 'UNKNOWN_ERROR',
        errorData.message || `HTTP ${response.status} error`
      )
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof ApiError) {
      throw error
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(0, 'TIMEOUT_ERROR', 'Request timeout after 30 seconds')
    }

    throw new ApiError(0, 'NETWORK_ERROR', 'Unable to connect to server. Please check your internet connection.')
  }
}

export async function get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  return request<T>(endpoint, { ...options, method: 'GET' })
}

export async function post<T>(endpoint: string, body?: Record<string, unknown>, options?: RequestOptions): Promise<T> {
  return request<T>(endpoint, { ...options, method: 'POST', body })
}

export async function put<T>(endpoint: string, body?: Record<string, unknown>, options?: RequestOptions): Promise<T> {
  return request<T>(endpoint, { ...options, method: 'PUT', body })
}

export const apiClient = { get, post, put }
