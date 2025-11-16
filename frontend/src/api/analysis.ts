import { post } from './client'
import { AnalysisProgress, AnalysisResult, AnalysisStep } from './types'

interface SyncInsightsResponse {
  success: true
  message: string
  exportsCreated: number
  adAccountIds: string[]
}

interface SyncMetadataResponse {
  success: true
  message: string
  adAccountsSynced: number
  adsetsSynced: number
}

interface AnalyzeSuggestionsResponse {
  success: true
  message: string
  suggestionsCreated: number
  adsetsProcessed: number
}

export async function syncAdsetInsights(): Promise<{ insightsExported: number }> {
  const response = await post<SyncInsightsResponse>('/api/v1/adset-insights/sync')

  return { insightsExported: response.exportsCreated }
}

export async function syncAdsetMetadata(): Promise<{ adsetsSynced: number }> {
  const response = await post<SyncMetadataResponse>('/api/v1/adset-sync/sync')

  return { adsetsSynced: response.adsetsSynced }
}

export async function analyzeSuggestions(): Promise<{ suggestionsCreated: number }> {
  const response = await post<AnalyzeSuggestionsResponse>('/api/v1/suggestions/analyze')

  return { suggestionsCreated: response.suggestionsCreated }
}

export async function runOrchestratedAnalysis(
  onProgress?: (progress: AnalysisProgress) => void,
  abortSignal?: AbortSignal
): Promise<AnalysisResult> {
  const steps: AnalysisStep[] = [
    {
      step: 1,
      total: 3,
      name: 'Syncing AdSet Insights',
      status: 'pending',
    },
    {
      step: 2,
      total: 3,
      name: 'Syncing AdSet Metadata',
      status: 'pending',
    },
    {
      step: 3,
      total: 3,
      name: 'Analyzing Suggestions',
      status: 'pending',
    },
  ]

  const result: AnalysisResult = {
    success: true,
    completedSteps: 0,
    totalSteps: 3,
    results: {
      insightsExported: 0,
      adsetsSynced: 0,
      suggestionsCreated: 0,
    },
    errors: [],
  }

  const updateProgress = () => {
    if (onProgress) {
      onProgress({
        steps: [...steps],
        currentStep: result.completedSteps + 1,
        canCancel: result.completedSteps < 3,
      })
    }
  }

  try {
    if (abortSignal?.aborted) {
      throw new Error('Analysis cancelled')
    }

    steps[0].status = 'in_progress'
    updateProgress()

    const insightsResult = await syncAdsetInsights()
    steps[0].status = 'completed'
    steps[0].result = { insightsExported: insightsResult.insightsExported }
    result.results.insightsExported = insightsResult.insightsExported
    result.completedSteps = 1
    updateProgress()

    if (abortSignal?.aborted) {
      throw new Error('Analysis cancelled')
    }

    steps[1].status = 'in_progress'
    updateProgress()

    const metadataResult = await syncAdsetMetadata()
    steps[1].status = 'completed'
    steps[1].result = { adsetsSynced: metadataResult.adsetsSynced }
    result.results.adsetsSynced = metadataResult.adsetsSynced
    result.completedSteps = 2
    updateProgress()

    if (abortSignal?.aborted) {
      throw new Error('Analysis cancelled')
    }

    steps[2].status = 'in_progress'
    updateProgress()

    const analysisResult = await analyzeSuggestions()
    steps[2].status = 'completed'
    steps[2].result = { suggestionsCreated: analysisResult.suggestionsCreated }
    result.results.suggestionsCreated = analysisResult.suggestionsCreated
    result.completedSteps = 3
    updateProgress()

    return result
  } catch (error) {
    result.success = false
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    result.errors.push(errorMessage)

    const currentStepIndex = steps.findIndex((s) => s.status === 'in_progress')
    if (currentStepIndex !== -1) {
      steps[currentStepIndex].status = 'failed'
      steps[currentStepIndex].error = errorMessage
      updateProgress()
    }

    return result
  }
}
