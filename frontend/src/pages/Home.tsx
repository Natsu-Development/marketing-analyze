import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Target, Calendar, ExternalLink, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getSuggestions } from '@/api/suggestions'
import type { Suggestion } from '@/api/types'
import { formatCurrency } from '@/lib/currency'

export default function Home() {
  const { t } = useTranslation()
  const [appliedSuggestions, setAppliedSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAppliedSuggestions()
  }, [])

  async function fetchAppliedSuggestions() {
    try {
      setLoading(true)
      setError(null)
      const response = await getSuggestions('applied')
      setAppliedSuggestions(response.suggestions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applied suggestions')
    } finally {
      setLoading(false)
    }
  }

  const totalApplied = appliedSuggestions.length
  const totalScaleBudget = appliedSuggestions.reduce(
    (sum, suggestion) => sum + (suggestion.budgetScaled - suggestion.dailyBudget),
    0
  )

  if (loading) {
    return (
      <main className="bg-background min-h-screen">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="bg-background min-h-screen">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="space-y-4 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button onClick={fetchAppliedSuggestions} variant="outline">
              {t('home.retry') || 'Retry'}
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-foreground text-4xl font-semibold tracking-tight">{t('home.title')}</h1>
            <p className="text-muted-foreground text-lg">{t('home.subtitle')}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">{t('home.appliedSuggestions')}</p>
                  <p className="text-foreground text-2xl font-semibold">{totalApplied}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-purple-500/10 p-3">
                  <Target className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">{t('home.totalBudgetIncreased')}</p>
                  <p className="text-foreground text-2xl font-semibold">
                    ${totalScaleBudget.toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="bg-card">
            <div className="border-border border-b p-6">
              <h2 className="text-foreground text-xl font-semibold">{t('home.appliedScaling')}</h2>
              <p className="text-muted-foreground text-sm">{t('home.appliedScalingSubtitle')}</p>
            </div>
            {appliedSuggestions.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">{t('home.noAppliedSuggestions')}</p>
                <Link to="/suggestions">
                  <Button variant="outline" className="mt-4">
                    {t('home.viewSuggestions')}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-border divide-y">
                {appliedSuggestions.map((suggestion) => {
                  const budgetIncrease = suggestion.budgetScaled - suggestion.dailyBudget
                  const appliedDate = new Date(suggestion.updatedAt).toLocaleString()

                  return (
                    <div key={suggestion.id} className="hover:bg-accent/50 p-6 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <h3 className="text-foreground text-lg font-semibold">{suggestion.campaignName}</h3>
                                <Badge variant="secondary" className="bg-green-500/20 text-green-600 dark:text-green-400">
                                  {t('home.status.applied')}
                                </Badge>
                              </div>
                              <div className="text-muted-foreground flex items-center gap-3 text-sm">
                                <span>{suggestion.adsetName}</span>
                              </div>
                            </div>
                            <a
                              href={`https://business.facebook.com/adsmanager/manage/adsets?act=${suggestion.adAccountId}&selected_adset_ids=${suggestion.adsetId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="sm" className="gap-2">
                                {t('home.viewInFacebook')}
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </a>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="text-muted-foreground h-3 w-3" />
                                <p className="text-muted-foreground text-xs">{t('home.appliedAt')}</p>
                              </div>
                              <p className="text-foreground text-sm font-medium">{appliedDate}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-muted-foreground text-xs">{t('home.currentBudget')}</p>
                              <p className="text-sm font-medium text-foreground">
                                {formatCurrency(suggestion.dailyBudget, suggestion.currency)}/day
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-muted-foreground text-xs">{t('home.newBudget')}</p>
                              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(suggestion.budgetScaled, suggestion.currency)}/day
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-muted-foreground text-xs">{t('home.budgetIncrease')}</p>
                              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                +{formatCurrency(budgetIncrease, suggestion.currency)}
                                {suggestion.scalePercent && ` (${suggestion.scalePercent}%)`}
                              </p>
                            </div>
                          </div>

                          {suggestion.metrics.length > 0 && (
                            <div className="bg-muted/30 rounded-md p-3">
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                {t('home.metricsExceeded')}:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {suggestion.metrics.map((metric, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {metric.metricName}: {metric.value.toFixed(2)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  )
}
