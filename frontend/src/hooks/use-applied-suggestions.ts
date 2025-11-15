import { useState, useEffect, useRef } from 'react'
import { getSuggestions } from '@/api/suggestions'
import type { Suggestion } from '@/api/types'

export function useAppliedSuggestions() {
  const [data, setData] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)
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
      const response = await getSuggestions('applied')
      setData(response.suggestions)
      hasFetched.current = true
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, don't update state
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to load applied suggestions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only fetch if we haven't already fetched
    if (!hasFetched.current) {
      fetchData()
    }

    // Cleanup function to abort request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const refetch = () => {
    hasFetched.current = false
    fetchData()
  }

  return {
    suggestions: data,
    loading,
    error,
    refetch,
  }
}
