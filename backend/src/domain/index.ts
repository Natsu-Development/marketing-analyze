/**
 * Domain Layer - Facebook Marketing Analytics Bounded Context
 * Central export point for core domain objects following Domain-Driven Design principles
 * Contains only core business logic and concepts
 * Implemented using functional programming style and KISS principle
 */


// ========== AGGREGATES (Core Business Objects with Identity) ==========
export * from './aggregates/account'
export * from './aggregates/adset-insights'
export * from './aggregates/adset'
export * from './aggregates/ad-account-setting'
export * from './aggregates/suggestion'

// ========== VALUE OBJECTS (Immutable Objects without Identity) ==========
export * from './value-objects/AdAccount'

// ========== DOMAIN SERVICES (Core Business Logic) ==========
export * from './services/SuggestionAnalyzer'

// ========== REPOSITORIES (Persistence Interfaces for Core Entities) ==========
export * from './repositories/IAccountRepository'
export * from './repositories/IAdSetRepository'
export * from './repositories/IAdAccountSettingRepository'
export * from './repositories/ISuggestionRepository'

// ========== DOMAIN OBJECTS (Grouped Business Logic) ==========
export { AccountDomain } from './aggregates/account'
export { AdSetDomain } from './aggregates/adset'
export { AdSetInsightDomain } from './aggregates/adset-insights'
export { ExportResultDomain } from './aggregates/adset-insights'
export { AdAccountSettingDomain } from './aggregates/ad-account-setting'
export { SuggestionDomain } from './aggregates/suggestion'
export { SuggestionAnalyzer } from './services/SuggestionAnalyzer'
