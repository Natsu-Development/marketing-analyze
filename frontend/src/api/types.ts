export type AccountStatus = 'connected' | 'disconnected' | 'needs_reconnect'
export type SuggestionStatus = 'pending' | 'applied' | 'rejected'

export interface ApiResponse<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: string
  message: string
}

export interface AdAccount {
  adAccountId: string
  name: string
  currency: string
  isActive: boolean
  lastSyncInsight: string | null
  lastSyncAdSet: string | null
}

export interface Account {
  id: string
  accountId: string
  status: AccountStatus
  connectedAt: string | null
  expiresAt: string | null
  lastErrorCode: string | null
  adAccounts: AdAccount[]
  createdAt: string
  updatedAt: string
}

export interface AdAccountSetting {
  adAccountId: string
  scalePercent: number | null
  initScaleDay: number | null
  recurScaleDay: number | null
  cpm: number | null
  ctr: number | null
  frequency: number | null
  inlineLinkCtr: number | null
  costPerInlineLinkClick: number | null
  purchaseRoas: number | null
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface SettingsFormData {
  scalePercent?: number
  initScaleDay?: number
  recurScaleDay?: number
  cpm?: number
  ctr?: number
  frequency?: number
  inlineLinkCtr?: number
  costPerInlineLinkClick?: number
  purchaseRoas?: number
  note?: string
}

export interface MetricExceeded {
  metricName: string
  value: number
}

export interface Suggestion {
  id: string
  accountId: string
  adAccountId: string
  adAccountName: string
  campaignName: string
  adsetId: string
  adsetName: string
  adsetLink: string
  currency: string
  dailyBudget: number
  budgetScaled: number
  scalePercent?: number
  note?: string
  metrics: MetricExceeded[]
  metricsExceededCount: number
  status: SuggestionStatus
  createdAt: string
  updatedAt: string
}

export interface AnalysisStep {
  step: number
  total: number
  name: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  result?: {
    insightsExported?: number
    adsetsSynced?: number
    suggestionsCreated?: number
  }
  error?: string
}

export interface AnalysisProgress {
  steps: AnalysisStep[]
  currentStep: number
  canCancel: boolean
}

export interface AnalysisResult {
  success: boolean
  completedSteps: number
  totalSteps: number
  results: {
    insightsExported: number
    adsetsSynced: number
    suggestionsCreated: number
  }
  errors: string[]
}
