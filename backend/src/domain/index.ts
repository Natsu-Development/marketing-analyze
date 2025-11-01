/**
 * Domain Layer - Facebook Marketing Analytics Bounded Context
 * Central export point for core domain objects following Domain-Driven Design principles
 * Contains only core business logic and concepts
 * Implemented using functional programming style and KISS principle
 */


// ========== ENTITIES (Core Business Objects with Identity) ==========
export * from './entities/Account'

// ========== VALUE OBJECTS (Immutable Objects without Identity) ==========
export * from './value-objects/AdAccount'

// ========== DOMAIN SERVICES (Core Business Logic) ==========
export * from './services/AccountService'

// ========== REPOSITORIES (Persistence Interfaces for Core Entities) ==========
export * from './repositories/IAccountRepository'

// ========== DOMAIN OBJECTS (Grouped Business Logic) ==========
export { AccountDomain } from './entities/Account'

// ========== EXCEPTIONS ==========
export * from './exceptions/DomainException'
