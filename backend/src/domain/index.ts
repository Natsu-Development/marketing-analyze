/**
 * Domain Layer
 * Central export point for all domain entities, services, and repositories
 */

// Entities
export * from './entities/Account'
export * from './entities/AdSetInsight'
export * from './entities/ExportResult'

// Types
export * from './types/FacebookAdAccount'

// Repositories
export * from './repositories/IAccountRepository'
export * from './repositories/IInsightRepository'
export * from './repositories/IExportResultRepository'

// Services - re-export specific interfaces
export {
    IFacebookOAuthService,
    OAuthTokenResponse,
    DebugTokenResponse,
    AdAccountsResponse,
    AuthUrlResponse,
} from './services/IFacebookOAuthService'
export {
    IAdInsightsService,
    AsyncReportStatus,
    AsyncReportRequest,
    AsyncReportResponse,
    CSVExportResult,
    AdInsightsTimeRange,
} from './services/IAdInsightsService'
export { ADSET_INSIGHT_FIELDS, normalizeInsightDate, mapRecordToAdSetInsight } from './services/AdSetInsightSpec'

// Exceptions
export * from './exceptions/DomainException'
