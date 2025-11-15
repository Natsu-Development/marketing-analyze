import { get, post } from './client'
import { Suggestion, SuggestionStatus } from './types'

export interface SuggestionsResponse {
  success: true
  status: SuggestionStatus
  suggestions: Suggestion[]
  count: number
  total: number
  limit?: number
  offset?: number
}

interface ActionResponse {
  success: true
  message: string
}

export async function getSuggestions(
  status: SuggestionStatus,
  limit?: number,
  offset?: number
): Promise<SuggestionsResponse> {
  let url = `/api/v1/suggestions?status=${status}`

  if (limit !== undefined) {
    url += `&limit=${limit}`
  }
  if (offset !== undefined) {
    url += `&offset=${offset}`
  }

  const response = await get<SuggestionsResponse>(url)

  return response
}

export async function approveSuggestion(suggestionId: string): Promise<string> {
  const response = await post<ActionResponse>(
    `/api/v1/suggestions/${suggestionId}/approve`
  )

  return response.message
}

export async function rejectSuggestion(suggestionId: string): Promise<string> {
  const response = await post<ActionResponse>(
    `/api/v1/suggestions/${suggestionId}/reject`
  )

  return response.message
}
