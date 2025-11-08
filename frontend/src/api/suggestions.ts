import { get, post } from './client'
import { Suggestion, SuggestionStatus } from './types'

interface SuggestionsResponse {
  success: true
  status: SuggestionStatus
  suggestions: Suggestion[]
  count: number
}

interface ActionResponse {
  success: true
  message: string
}

export async function getSuggestions(
  status: SuggestionStatus
): Promise<SuggestionsResponse> {
  const response = await get<SuggestionsResponse>(
    `/api/v1/suggestions?status=${status}`
  )

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
