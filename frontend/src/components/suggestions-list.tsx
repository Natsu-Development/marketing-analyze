import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getSuggestions, approveSuggestion, rejectSuggestion } from '@/api/suggestions'
import type { Suggestion } from '@/api/types'
import { formatCurrency } from '@/lib/currency'

export function SuggestionsList() {
  const { t } = useTranslation()

  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchSuggestions()
  }, [])

  async function fetchSuggestions() {
    try {
      setLoading(true)
      setError(null)
      const response = await getSuggestions('pending')
      setSuggestions(response.suggestions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suggestions')
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(id: string) {
    try {
      setActionLoading(id)
      await approveSuggestion(id)
      // Update local state to reflect the change
      setSuggestions(suggestions.map((s) => (s.id === id ? { ...s, status: 'applied' as const } : s)))
    } catch (err) {
      console.error('Failed to approve suggestion:', err)
      alert(t('suggestions.approveFailed') || 'Failed to approve suggestion')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(id: string) {
    try {
      setActionLoading(id)
      await rejectSuggestion(id)
      // Update local state to reflect the change
      setSuggestions(suggestions.map((s) => (s.id === id ? { ...s, status: 'rejected' as const } : s)))
    } catch (err) {
      console.error('Failed to reject suggestion:', err)
      alert(t('suggestions.rejectFailed') || 'Failed to reject suggestion')
    } finally {
      setActionLoading(null)
    }
  }

  const getMetricImpact = (metricsCount: number) => {
    if (metricsCount >= 3) return { label: 'high', color: 'bg-red-500/20 text-red-600 dark:text-red-400' }
    if (metricsCount >= 2) return { label: 'medium', color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' }
    return { label: 'low', color: 'bg-gray-500/20 text-gray-600 dark:text-gray-400' }
  }

  const pendingSuggestions = suggestions.filter((s) => s.status === 'pending')
  const reviewedSuggestions = suggestions.filter((s) => s.status !== 'pending')

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-card p-6">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="bg-card p-6">
          <div className="space-y-4 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button onClick={fetchSuggestions} variant="outline">
              {t('suggestions.retry') || 'Retry'}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-sm">
              {pendingSuggestions.length} {t('suggestions.pending')}
            </Badge>
          </div>

          {pendingSuggestions.length === 0 ? (
            <div className="border-border rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground text-sm">{t('suggestions.noPendingSuggestions')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSuggestions.map((suggestion) => {
                const impact = getMetricImpact(suggestion.metrics.length)
                const isProcessing = actionLoading === suggestion.id

                return (
                  <div
                    key={suggestion.id}
                    className="border-border bg-secondary/30 hover:bg-secondary/50 rounded-lg border p-4 transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-card-foreground font-medium">{suggestion.campaignName}</h3>
                            <Badge variant="secondary" className={impact.color}>
                              {t(`suggestions.impactLevels.${impact.label}`)} {t('suggestions.impact')}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground text-sm space-y-1">
                            <p>
                              <strong>{t('suggestions.adSet')}:</strong> {suggestion.adsetName}
                            </p>
                            {suggestion.metrics.length > 0 && (
                              <div className="mt-2">
                                <p className="font-medium">{t('suggestions.metricsExceeded')}:</p>
                                <ul className="list-disc list-inside ml-2">
                                  {suggestion.metrics.map((metric, idx) => (
                                    <li key={idx}>
                                      {metric.metricName}: {metric.value.toFixed(2)}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-background/50 space-y-2 rounded-md p-3">
                        <div className="grid gap-4 text-sm sm:grid-cols-3">
                          <div className="space-y-0.5">
                            <span className="text-muted-foreground text-xs">{t('suggestions.currentBudget')}</span>
                            <p className="text-foreground text-sm font-medium">
                              {formatCurrency(suggestion.dailyBudget, suggestion.currency)}/day
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-muted-foreground text-xs">{t('suggestions.suggestedBudget')}</span>
                            <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                              {formatCurrency(suggestion.budgetScaled, suggestion.currency)}/day
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-muted-foreground text-xs">{t('suggestions.scalePercent')}</span>
                            <p className="text-foreground text-sm font-medium">{suggestion.scalePercent}%</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(suggestion.id)}
                          disabled={isProcessing}
                          className="border-border gap-1.5 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                        >
                          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                          {t('suggestions.reject')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(suggestion.id)}
                          disabled={isProcessing}
                          className="gap-1.5 bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                        >
                          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          {t('suggestions.approve')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>

      {reviewedSuggestions.length > 0 && (
        <Card className="bg-card p-6">
          <div className="space-y-4">
            <h3 className="text-card-foreground text-lg font-semibold">{t('suggestions.recentlyReviewed')}</h3>
            <div className="space-y-2">
              {reviewedSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="border-border bg-secondary/30 flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${
                        suggestion.status === 'applied' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}
                    >
                      {suggestion.status === 'applied' ? (
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{suggestion.campaignName}</span>
                      <span className="text-xs text-muted-foreground">{suggestion.adsetName}</span>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      suggestion.status === 'applied'
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                        : 'bg-red-500/20 text-red-600 dark:text-red-400'
                    }
                  >
                    {t(`suggestions.status.${suggestion.status}`)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
