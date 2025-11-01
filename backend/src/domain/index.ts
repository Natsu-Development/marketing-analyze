/**
 * Domain Layer - Facebook Marketing Analytics Bounded Context
 * Central export point for core domain objects following Domain-Driven Design principles
 * Contains only core business logic and concepts
 * Implemented using functional programming style and KISS principle
 */


// ========== AGGREGATES (Core Business Objects with Identity) ==========
export * from './aggregates/account'
export * from './aggregates/ad-insights'

// ========== VALUE OBJECTS (Immutable Objects without Identity) ==========
export * from './value-objects/AdAccount'

// ========== DOMAIN SERVICES (Core Business Logic) ==========
export * from './services/AccountService'

// ========== REPOSITORIES (Persistence Interfaces for Core Entities) ==========
export * from './repositories/IAccountRepository'

// ========== DOMAIN OBJECTS (Grouped Business Logic) ==========
export { AccountDomain } from './aggregates/account'
export { AdSetInsightDomain } from './aggregates/ad-insights'
export { ExportResultDomain } from './aggregates/ad-insights'

// ========== EXCEPTIONS ==========
export * from './exceptions/DomainException'
