import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { getSuggestions, approveSuggestion, rejectSuggestion } from '@/api/suggestions'
import type { Suggestion } from '@/api/types'

const PAGE_SIZE = 20

export function useSuggestions(currentPage: number) {
  const { t } = useTranslation()
  const [data, setData] = useState<Suggestion[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const fetchedPages = useRef<Set<number>>(new Set())
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = async () => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()

    try {
      setLoading(true)
      setError(null)
      const offset = (currentPage - 1) * PAGE_SIZE
      const response = await getSuggestions('pending', PAGE_SIZE, offset)
      setData(response.suggestions)
      setTotal(response.total)
      fetchedPages.current.add(currentPage)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, don't update state
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to load suggestions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only fetch if we haven't already fetched this page
    if (!fetchedPages.current.has(currentPage)) {
      fetchData()
    } else {
      setLoading(false)
    }

    // Cleanup function to abort request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [currentPage])

  const refetch = () => {
    fetchedPages.current.clear()
    fetchData()
  }

  const updateSuggestion = (id: string, updates: Partial<Suggestion>) => {
    setData((prev) =>
      prev.map((suggestion) =>
        suggestion.id === id ? { ...suggestion, ...updates } : suggestion
      )
    )
  }

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id)
      await approveSuggestion(id)
      // Update local state to reflect the change
      updateSuggestion(id, { status: 'applied' as const })
    } catch (err) {
      console.error('Failed to approve suggestion:', err)
      setError(t('suggestions.approveFailed') || 'Failed to approve suggestion')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id)
      await rejectSuggestion(id)
      // Update local state to reflect the change
      updateSuggestion(id, { status: 'rejected' as const })
    } catch (err) {
      console.error('Failed to reject suggestion:', err)
      setError(t('suggestions.rejectFailed') || 'Failed to reject suggestion')
    } finally {
      setActionLoading(null)
    }
  }

  return {
    suggestions: data,
    total,
    loading,
    error,
    actionLoading,
    refetch,
    updateSuggestion,
    handleApprove,
    handleReject,
  }
}
