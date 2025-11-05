# Marketing Analytics Backend

Backend service for Facebook OAuth authentication with ad account management, built with **Domain-Driven Design (DDD)** and functional programming principles.

## Architecture

This implementation follows **Domain-Driven Design (DDD)** with a functional approach and clean architecture principles:

```
src/
├── domain/              # Business entities and rules (innermost layer)
│   ├── aggregates/      # Core business objects with identity
│   │   ├── account/     # Account aggregate (Facebook connection)
│   │   ├── adset-insights/ # AdSet insights aggregates (AdSetInsight, ExportResult)
│   │   ├── ad-set/      # AdSet aggregate (metadata, status, budget)
│   │   ├── ad-account-setting/ # Ad account threshold settings
│   │   └── suggestion/  # Performance improvement suggestions
│   ├── value-objects/   # Immutable objects without identity
│   │   ├── AdAccount.ts
│   │   └── TimeRange.ts
│   ├── services/        # Core business logic
│   │   ├── AccountService.ts
│   │   └── SuggestionAnalyzer.ts
│   └── repositories/    # Repository interfaces
├── application/         # Application business rules
│   ├── entities/        # Application-layer entities
│   ├── factories/       # Entity creation logic
│   ├── ports/           # Service interfaces
│   ├── services/        # Application services
│   │   ├── AdInsightsService.ts
│   │   ├── CsvService.ts
│   │   └── csvProcessor.ts
│   ├── schedulers/      # Cron job schedulers
│   └── use-cases/       # Use case implementations
│       ├── facebookAuth.ts
│       ├── adInsight.ts
│       └── sync-ad-insights/
├── infrastructure/      # External concerns (outermost layer)
│   ├── database/
│   │   └── mongodb/     # MongoDB schemas and repositories
│   │       ├── repositories/
│   │       └── schemas/
│   ├── external-services/
│   │   └── facebook/    # Facebook API clients
│   │       ├── AuthClient.ts
│   │       └── InsightClient.ts
│   └── shared/
│       └── logger.ts    # Logging infrastructure
├── interfaces/          # Interface adapters
│   └── http/            # Express controllers, routes, middleware
│       ├── controllers/
│       ├── routes/
│       ├── helpers/
│       ├── middleware/
│       └── types/
└── config/              # Application configuration
    ├── env.ts
    ├── database.ts
    └── dependencies.ts  # Singleton dependency exports
```

## Architecture Benefits

✅ **Domain-Driven Design**
- Clear separation of business logic in domain layer
- Aggregates encapsulate business invariants
- Value objects ensure immutability
- Domain services contain pure business logic
- **Mapping logic lives in domain** (not in factories)

✅ **Functional Programming**
- Plain data objects instead of complex factory patterns
- Pure functions operating on data
- Immutable operations
- Functional composition
- **No unnecessary abstraction layers**

✅ **Clean Architecture**
- Dependency inversion (domain doesn't depend on infrastructure)
- Clear layering (domain → application → infrastructure → interfaces)
- Testable business logic
- Easy to swap implementations

✅ **KISS Principle (Keep It Simple, Stupid)**
- **Removed factory pattern** - Use domain functions directly
- **Removed duplicate entities** - Single source of truth in domain
- **Reuse domain mappers** - No duplication in application layer
- Flat folder structure where possible
- Each layer has clear, focused responsibility

## Tech Stack

- **Express.js** (Functional approach) - HTTP server
- **TypeScript** - Type safety
- **MongoDB** + **Mongoose** - Database and ODM
- **Zod** - Runtime validation
- **Pino** - Structured logging
- **Axios** - HTTP client for Facebook API

## Features

✅ **Facebook OAuth 2.0 Flow**
- Authorization URL generation with state parameter
- OAuth callback handling
- Token exchange and validation
- Scope validation

✅ **Ad Account Management**
- Fetch user's Facebook ad accounts
- Toggle ad account active status
- Refresh ad accounts list
- Track active/inactive accounts

✅ **Token Management**
- Long-lived token exchange
- Token expiration checking
- Automatic token refresh
- Graceful error handling for expired tokens

✅ **Security**
- State parameter for CSRF protection
- Scope validation
- Clean document mapping (no Mongoose pollution)
- Input validation with Zod
- Structured logging (no secrets in logs)

## Setup

### Prerequisites

- Node.js 18+
- MongoDB 5+
- Facebook App credentials

### Installation

```bash
# Install dependencies
yarn install
```

### Configuration

Create a `.env` file in the backend directory based on `env.template`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/marketing-analyze

# Facebook OAuth Configuration
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:3001/api/v1/auth/facebook/callback
FACEBOOK_API_VERSION=v18.0

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=info
```

### Facebook App Setup

1. Create a Facebook App at [Facebook Developers](https://developers.facebook.com/)
2. Add "Facebook Login" product
3. Configure OAuth Redirect URIs: `http://localhost:3001/api/v1/auth/facebook/callback`
4. Request required permissions: `ads_read`, `ads_management`, `public_profile`

## Running the Server

```bash
# Development with hot reload
yarn dev

# Production build
yarn build
yarn start

# Type checking
yarn type-check
```

## API Endpoints

All endpoints follow the pattern: `/api/v1/auth/facebook/*`

### Session Management

**Connect Facebook Account**
```http
POST /api/v1/auth/facebook/session
Content-Type: application/json

{
  "action": "connect"
}

Response:
{
  "success": true,
  "redirectUrl": "https://www.facebook.com/v18.0/dialog/oauth?...",
  "state": "random-state-string"
}
```

**Disconnect Facebook Account**
```http
POST /api/v1/auth/facebook/session
Content-Type: application/json

{
  "action": "disconnect",
  "fbUserId": "123456789"
}

Response:
{
  "success": true,
  "message": "Facebook account disconnected successfully"
}
```

### OAuth Flow

**OAuth Callback (handled by Facebook)**
```http
GET /api/v1/auth/facebook/callback?code=...&state=...
```
Redirects to frontend with status: `success` or `error`

### Status & Token

**Get Connection Status**
```http
GET /api/v1/auth/facebook/status?fbUserId=123456789

Response:
{
  "success": true,
  "status": "CONNECTED",
  "fbUserId": "123456789",
  "expiresAt": "2024-01-15T10:30:00.000Z",
  "needsRefresh": false,
  "adAccountsCount": 3
}
```

**Get Valid Access Token**
```http
GET /api/v1/auth/facebook/token?fbUserId=123456789

Response:
{
  "success": true,
  "accessToken": "EAABwzLixnjYBO...",
  "expiresAt": "2024-01-15T10:30:00.000Z"
}
```

### Ad Account Management

**Refresh Ad Accounts**
```http
POST /api/v1/auth/facebook/123456789/refresh-ad-accounts

Response:
{
  "success": true,
  "message": "Ad accounts refreshed successfully",
  "adAccountsCount": 3,
  "connection": {
    "fbUserId": "123456789",
    "status": "CONNECTED",
    "adAccounts": [...]
  }
}
```

**Update Ad Account Active Status**
```http
PUT /api/v1/auth/facebook/123456789/ad-accounts/act_123456789/active
Content-Type: application/json

{
  "isActive": true
}

Response:
{
  "success": true,
  "message": "Ad account activated successfully",
  "connection": {...}
}
```

### AdSet Insights Sync

**Manually Trigger AdSet Insights Sync**
```http
POST /api/v1/adset-insights/sync

Response:
{
  "success": true,
  "message": "AdSet insights sync completed successfully",
  "exportsCreated": 2,
  "adAccountIds": ["act_123456789", "act_987654321"]
}
```

### AdSet Metadata Sync

**Manually Trigger AdSet Metadata Sync**
```http
POST /api/v1/adset-sync/sync

Response:
{
  "success": true,
  "message": "AdSet metadata sync completed successfully",
  "adAccountsSynced": 2,
  "adsetsSynced": 45
}
```

### Suggestion Analysis

**Manually Trigger Suggestion Analysis**
```http
POST /api/v1/suggestions/analyze

Response:
{
  "success": true,
  "message": "Suggestion analysis completed successfully",
  "suggestionsCreated": 5,
  "adsetsProcessed": 20
}
```

**Approve Suggestion**
```http
POST /api/v1/suggestions/:suggestionId/approve

Response:
{
  "success": true,
  "message": "Suggestion approved and budget updated successfully",
  "suggestion": {...}
}

Note: When a suggestion is approved:
1. Updates Facebook adset budget via API
2. Marks adset as scaled by setting lastScaledAt to current time
3. Enables recurring scale eligibility after recurScaleDay period
```

**Reject Suggestion**
```http
POST /api/v1/suggestions/:suggestionId/reject

Response:
{
  "success": true,
  "message": "Suggestion rejected successfully",
  "suggestion": {...}
}
```

**Get Exports for Ad Account**
```http
GET /api/v1/ad-insights/exports/:adAccountId

Response:
{
  "success": true,
  "exports": [
    {
      "id": "...",
      "adAccountId": "act_123456789",
      "reportRunId": "...",
      "fileUrl": "https://...",
      "recordCount": 1500,
      "timeRange": {
        "since": "2024-01-01",
        "until": "2024-01-08"
      },
      "status": "completed",
      "createdAt": "2024-01-08T10:00:00.000Z",
      "completedAt": "2024-01-08T10:05:00.000Z"
    }
  ]
}
```

**Get Latest Export for Ad Account**
```http
GET /api/v1/ad-insights/exports/:adAccountId/latest

Response:
{
  "success": true,
  "export": {
    "id": "...",
    "adAccountId": "act_123456789",
    "reportRunId": "...",
    "fileUrl": "https://...",
    "recordCount": 1500,
    "status": "completed"
  }
}
```

**Get Ad-Level Insight Data**
```http
GET /api/v1/ad-insights/data/:adAccountId/ad

Response:
{
  "success": true,
  "count": 1500,
  "data": [
    {
      "id": "...",
      "adAccountId": "act_123456789",
      "reportRunId": "...",
      "date": "2024-01-01",
      "accountId": "act_123456789",
      "accountName": "My Business",
      "campaignId": "123456789",
      "campaignName": "Summer Sale",
      "adsetId": "987654321",
      "adsetName": "Lookalike Audience",
      "adId": "111222333",
      "adName": "Ad Creative 1",
      "impressions": 10000,
      "clicks": 500,
      "spend": 50.00,
      "cpm": 5.00,
      "cpc": 0.10,
      "ctr": 5.00,
      "reach": 8000,
      "actions": "[{\"action_type\":\"link_click\",\"value\":500}]",
      "actionValues": "[{\"action_type\":\"link_click\",\"value\":\"100\"}]",
      "costPerActionType": "[{\"action_type\":\"link_click\",\"value\":0.10}]"
    }
  ]
}
```

**Get Adset-Level Insight Data**
```http
GET /api/v1/ad-insights/data/:adAccountId/adset

Response:
{
  "success": true,
  "count": 800,
  "data": [
    {
      "id": "...",
      "adAccountId": "act_123456789",
      "reportRunId": "...",
      "date": "2024-01-01",
      "accountId": "act_123456789",
      "accountName": "My Business",
      "campaignId": "123456789",
      "campaignName": "Summer Sale",
      "adsetId": "987654321",
      "adsetName": "Lookalike Audience",
      "adsetObjective": "OUTCOME_ENGAGEMENT",
      "impressions": 10000,
      "clicks": 500,
      "spend": 50.00,
      "cpm": 5.00,
      "cpc": 0.10,
      "ctr": 5.00,
      "reach": 8000,
      "actions": "[{\"action_type\":\"link_click\",\"value\":500}]",
      "actionValues": "[{\"action_type\":\"link_click\",\"value\":\"100\"}]",
      "costPerActionType": "[{\"action_type\":\"link_click\",\"value\":0.10}]"
    }
  ]
}
```

## Automated Cron Jobs

The system automatically executes three scheduled tasks using cron jobs:

### 1. AdSet Insights Sync
Exports performance metrics for all active adsets.

**Configuration:**
```bash
ADSET_INSIGHTS_CRON_SCHEDULE=0 2 * * *  # Every day at 2 AM (default)
```

### 2. AdSet Metadata Sync
Syncs adset metadata (name, status, budget, targeting) from Facebook.

**Configuration:**
```bash
ADSET_SYNC_CRON_SCHEDULE=0 1 * * 1  # Every Monday at 1 AM (default)
```

### 3. Suggestion Analysis
Analyzes adset performance against thresholds and generates budget increase suggestions.

**Scale Timing Logic:**
- **Initial Scale**: Adset must be at least `initScaleDay` days old (from `startTime`) AND never scaled before
- **Recurring Scale**: At least `recurScaleDay` days must pass since last scale (from `lastScaledAt`)
- When a suggestion is approved, the adset's `lastScaledAt` is updated to track recurring scales

**Configuration:**
```bash
SUGGESTION_ANALYSIS_CRON_SCHEDULE=0 3 * * *  # Every day at 3 AM (default)
```

**Cron Format:** `minute hour day month weekday` (node-cron format)

**Examples:**
- `0 2 * * *` - Every day at 2 AM
- `0 0 * * 0` - Every Sunday at midnight
- `0 */6 * * *` - Every 6 hours
- `*/30 * * * *` - Every 30 minutes

### Manual Triggers

All cron jobs can be manually triggered via API endpoints:
- `POST /api/v1/adset-insights/sync` - Trigger adset insights sync
- `POST /api/v1/adset-sync/sync` - Trigger adset metadata sync
- `POST /api/v1/suggestions/analyze` - Trigger suggestion analysis

### How It Works

1. **Scheduled Execution**: Cron job runs according to schedule
2. **Find Active Connections**: Discovers all connections with `status = 'connected'`
3. **Filter Active Ad Accounts**: Only processes ad accounts where `isActive = true`
4. **Determine Time Range**: 
   - If `lastSyncAt` exists: sync from `lastSyncAt` to now
   - If `lastSyncAt` is null/undefined: sync last 365 days from now
5. **Create Reports**: Creates two async reports per ad account:
   - **Adset-level report**: Contains ABO (Ad Based Optimization) data and adset information
   - **Ad-level report**: Contains individual ad performance data
6. **Polling**: Polls report status until completion (max 20 minutes per report)
7. **CSV Export**: Downloads CSV files from Facebook
8. **Data Processing**: Parses CSV data and stores in MongoDB
   - **Ad insights**: Stored in `ad_insights` collection
   - **Adset insights**: Stored in `adset_insights` collection
9. **Storage**: Saves export results metadata to database
10. **Update Sync Time**: Updates `lastSyncAt` for the connection after successful exports

### Export Data

The system exports **two separate reports** for each ad account:

#### 1. **Adset-Level Report** (ABO & AdSet Data)
- Account information: `account_id`, `account_name`
- Campaign information: `campaign_id`, `campaign_name`
- AdSet information: `adset_id`, `adset_name`, `adset_objective`
- Metrics: `impressions`, `clicks`, `spend`, `cpm`, `cpc`, `ctr`, `reach`
- Actions: `actions`, `action_values`, `cost_per_action_type`

#### 2. **Ad-Level Report** (Individual Ad Performance)
- Account information: `account_id`, `account_name`
- Campaign information: `campaign_id`, `campaign_name`
- AdSet information: `adset_id`, `adset_name`
- Ad information: `ad_id`, `ad_name`
- Metrics: `impressions`, `clicks`, `spend`, `cpm`, `cpc`, `ctr`, `reach`
- Actions: `actions`, `action_values`, `cost_per_action_type`

### Time Range Logic

The time range is determined by the `lastSyncAt` field on each connection:

- **First Sync** (no `lastSyncAt`): Syncs last **365 days** from now
- **Subsequent Syncs**: Syncs from `lastSyncAt` to now (incremental sync)
- **Manual Override**: You can pass a custom time range via the request parameter

This ensures efficient incremental syncing while preventing data gaps.

### Data Storage

The system stores **two types of insight data** in separate MongoDB collections:

1. **`ad_insights` Collection**: Individual ad performance data
   - Includes ad-level metrics (impressions, clicks, spend, CPM, CPC, CTR, reach)
   - Contains ad details (ad ID, ad name)
   - Links to parent adset and campaign
   
2. **`adset_insights` Collection**: Adset (ABO) performance data
   - Includes adset-level metrics
   - Contains adset details (adset ID, adset name, adset objective)
   - Links to parent campaign

Both collections are indexed by:
- `adAccountId` and `date` for efficient querying
- `reportRunId` for tracking data from specific exports

### Duplicate Prevention

The system prevents duplicate data using **composite unique indexes**:

**For Ad Insights:**
- Unique key: `(adAccountId, date, campaignId, adsetId, adId)`
- Ensures each ad can only have one record per day

**For Adset Insights:**
- Unique key: `(adAccountId, date, campaignId, adsetId)`
- Ensures each adset can only have one record per day

The repository uses **bulkWrite with upsert operations** to:
- Update existing records if they exist (based on the unique key)
- Insert new records if they don't exist
- Automatically handle duplicate prevention at the database level

## DDD Architecture Pattern

### Domain Layer (Aggregates & Value Objects)

```typescript
// Account Aggregate (domain/aggregates/account/Account.ts)
export interface Account {
  readonly id?: string
  readonly accountId: string
  readonly accessToken: string
  readonly status: AccountStatus
  readonly adAccounts: AdAccount[]
  // ... other properties
}

// Domain functions (pure business logic)
export const AccountDomain = {
  createAccount: (props) => ({ ...props, /* defaults */ }),
  updateAccountAdAccounts: (account, adAccounts) => ({
    ...account,
    adAccounts,
    updatedAt: new Date()
  }),
  canAccountExport: (account) => {
    // Business rules for export scheduling
  },
  // ... other domain operations
}

// Value Objects (domain/value-objects/TimeRange.ts)
export interface AdInsightsTimeRange {
  since: string // YYYY-MM-DD format
  until: string // YYYY-MM-DD format
}
```

### Application Layer (Use Cases & Services)

```typescript
// Use Case (application/use-cases/adInsight.ts)
export async function startImportAsync(
  request?: AdInsightExportRequest
): Promise<AdInsightExportResponse> {
  // Find all accounts
  const allAccounts = await findAllAccounts()

  for (const account of allAccounts) {
    // Use domain logic for business rules
    const schedulingDecision = AccountDomain.canAccountExport(account)

    if (!schedulingDecision.canExport) {
      continue
    }

    // Process export...
  }
}
```

### Infrastructure Layer (Repository Implementation)

```typescript
// Repository (infrastructure/database/mongodb/repositories/AccountRepository.ts)
const toDomain = (doc: any): Account => {
  // Convert Mongoose document to domain entity
  const plainDoc = doc.toObject ? doc.toObject() : doc

  return {
    id: plainDoc._id.toString(),
    accountId: plainDoc.accountId,
    accessToken: plainDoc.accessToken,
    // ... map all fields to domain entity
  }
}
```

## Database Schema

### Account Collection

```typescript
{
  accountId: string          // Unique account identifier
  accessToken: string        // Facebook access token
  scopes: string[]          // OAuth scopes granted
  status: AccountStatus     // connected | disconnected | needs_reconnect
  connectedAt: Date         // Initial connection timestamp
  expiresAt: Date          // Token expiration
  lastErrorCode?: string   // Last error encountered
  adAccounts: AdAccount[]  // User's ad accounts (with per-account sync timestamps)
  createdAt: Date
  updatedAt: Date
}
```

### AdAccount (embedded value object)

```typescript
{
  name: string              // Ad account name
  status: number           // Facebook account status
  currency: string         // Account currency
  timezone: string         // Account timezone
  spendCap?: string       // Spending cap
  adAccountId: string     // Facebook ad account ID
  isActive: boolean       // Whether account is active in our system
  lastSyncAdSet?: Date    // Last adset metadata sync timestamp
  lastSyncInsight?: Date  // Last adset insights sync timestamp
}
```

### AdSet Collection

```typescript
{
  accountId: string        // Our internal account ID
  adAccountId: string      // Facebook ad account ID
  adsetId: string          // Facebook adset ID (unique)
  adsetName: string        // AdSet name
  campaignId: string       // Facebook campaign ID
  campaignName: string     // Campaign name
  status: string           // ACTIVE | PAUSED | ARCHIVED
  currency: string         // Currency code
  dailyBudget?: number     // Daily budget in cents (raw from Facebook API)
  lifetimeBudget?: number  // Lifetime budget in cents (raw from Facebook API)
  startTime?: Date         // Adset start time
  endTime?: Date           // Adset end time
  lastScaledAt?: Date      // Last time budget was scaled (for recurring scale threshold)
  updatedTime: Date        // Last updated from Facebook
  syncedAt: Date           // Last sync timestamp
}
```

### AdAccountSetting Collection

```typescript
{
  adAccountId: string      // Facebook ad account ID (unique)
  scalePercent?: number    // Budget increase percentage (e.g., 20 for 20%)
  initScaleDay?: number    // Minimum adset age (from startTime) before first budget scale
  recurScaleDay?: number   // Days since last scale (from lastScaledAt) before recurring scale
  note?: string           // Optional notes
  // Threshold settings (6 configurable metrics)
  cpm?: number            // Cost per 1000 impressions threshold
  ctr?: number            // Click-through rate threshold (%)
  frequency?: number      // Frequency threshold
  inlineLinkCtr?: number  // Inline link CTR threshold (%)
  costPerInlineLinkClick?: number  // Cost per inline link click threshold
  purchaseRoas?: number   // Purchase ROAS threshold
  createdAt: Date
  updatedAt: Date
}
```

### Suggestion Collection

```typescript
{
  accountId: string        // Our internal account ID
  adAccountId: string      // Facebook ad account ID
  adAccountName: string    // Ad account name
  campaignName: string     // Campaign name
  adsetId: string          // Facebook adset ID
  adsetName: string        // AdSet name
  dailyBudget: number      // Current daily budget in cents
  suggestedBudget: number  // Suggested daily budget in cents
  scalePercent: number     // Budget increase percentage applied
  note?: string           // Optional notes from settings
  metrics: Array<{        // Metrics that exceeded thresholds
    name: string          // Metric name (e.g., "cpm", "ctr")
    actual: number        // Actual metric value
    threshold: number     // Threshold value that was exceeded
  }>
  status: string          // pending | approved | rejected
  createdAt: Date
  approvedAt?: Date       // When suggestion was approved
  rejectedAt?: Date       // When suggestion was rejected
}
```

### ExportResult Collection

```typescript
{
  adAccountId: string      // Facebook ad account ID
  reportRunId: string      // Facebook report run ID (unique)
  fileUrl: string          // URL to CSV file
  recordCount: number      // Number of records stored in database
  timeRange: {
    since: string          // Start date (YYYY-MM-DD)
    until: string          // End date (YYYY-MM-DD)
  }
  status: string           // pending | completed | failed
  error?: string          // Error message if failed
  completedAt?: Date     // Completion timestamp
  createdAt: Date         // Creation timestamp
  updatedAt: Date         // Last update timestamp
}
```

### Ad Insights Collections

The CSV data is parsed and stored in two collections:

**`ad_insights` Collection** - Individual ad performance data:
```typescript
{
  adAccountId: string
  reportRunId: string
  date: string
  accountId: string
  accountName?: string
  campaignId: string
  campaignName?: string
  adsetId: string
  adsetName?: string
  adId: string
  adName?: string
  impressions?: number
  clicks?: number
  spend?: number
  cpm?: number
  cpc?: number
  ctr?: number
  reach?: number
  actions?: string
  actionValues?: string
  costPerActionType?: string
  createdAt: Date
}
```

**`adset_insights` Collection** - Adset (ABO) performance data:
```typescript
{
  adAccountId: string
  reportRunId: string
  date: string
  accountId: string
  accountName?: string
  campaignId: string
  campaignName?: string
  adsetId: string
  adsetName?: string
  adsetObjective?: string
  impressions?: number
  clicks?: number
  amountSpent?: number
  cpm?: number
  ctr?: number
  frequency?: number
  inlineLinkCtr?: number        // Renamed from linkCtr
  costPerInlineLinkClick?: number
  purchaseRoas?: number          // Renamed from roas
  reach?: number
  actions?: string
  actionValues?: string
  costPerActionType?: string
  createdAt: Date
}
```

## Error Handling

Standardized error responses:

```typescript
// Success
{ "success": true, "data": {...} }

// Error
{ "success": false, "error": "ERROR_CODE", "message": "Description" }
```

**Error Codes:**
- `VALIDATION_ERROR` - Invalid input
- `NO_CONNECTION` - User has no Facebook connection
- `NEEDS_RECONNECT` - Token expired, reconnection required
- `STATE_MISMATCH` - CSRF attack detected
- `SCOPE_MISMATCH` - Missing required OAuth scopes
- `INTERNAL_ERROR` - Server error

## Testing with Postman

Import the provided `FacebookAuthController.postman_collection.json` for complete API testing with examples for all endpoints, error cases, and success scenarios.

## Deployment

1. Set environment variables
2. Ensure MongoDB is accessible
3. Configure Facebook App with production redirect URI
4. Build and start: `yarn build && yarn start`

## Architecture Simplifications (KISS Principle)

### Removed Unnecessary Abstractions

Following the KISS (Keep It Simple, Stupid) principle, we've removed unnecessary complexity:

**1. Removed Factory Pattern**
- ❌ Before: `application/factories/ExportResultFactory.ts`, `AdSetInsightFactory.ts`
- ✅ After: Use domain functions directly (`ExportResultDomain.createExportResult()`)
- **Why**: Factories added no value - they just wrapped domain functions

**2. Removed Duplicate Entities**
- ❌ Before: `application/entities/` duplicated domain aggregates
- ✅ After: Single source of truth in `domain/aggregates/`
- **Why**: Duplication violates DRY principle and creates maintenance burden

**3. Reuse Domain Mappers**
- ❌ Before: Created separate mappers in application layer
- ✅ After: Use `mapRecordToAdSetInsight()` from domain layer
- **Why**: Mapping CSV → Domain is domain logic, belongs in domain layer

**4. Removed Unused Services**
- ❌ Before: `domain/services/AdInsightsService.ts` (never imported anywhere)
- ❌ Before: `application/schedulers/AdInsightsSyncScheduler.ts` (duplicate of cron-scheduler)
- ✅ After: Only keep what's actually used
- **Why**: Dead code adds confusion and maintenance burden

**Result**:
- **Deleted 9 files total** (4 factories + 2 entities + 2 repositories + 2 services + 1 scheduler)
- **Removed 4 empty folders**
- Cleaner codebase, less code to maintain, clearer responsibilities
- **From 45 files → 18 files** (60% reduction!)

## Recent Architecture Changes

### Migration to DDD (v2.0)

The codebase has been refactored from a simple functional architecture to Domain-Driven Design:

**Key Changes:**
- **Domain Layer**: Migrated from `domain/entities` to `domain/aggregates` pattern
  - Account aggregate encapsulates all account-related business logic
  - AdSetInsight and ExportResult aggregates for ad insights domain
  - Value objects (AdAccount, TimeRange) ensure type safety and immutability

- **Infrastructure Layer**: Reorganized folder structure
  - `infrastructure/mongo-db` → `infrastructure/database/mongodb`
  - `infrastructure/facebook-sdk` → `infrastructure/external-services/facebook`
  - Better separation of database and external service concerns

- **Application Layer**: Enhanced with factories and services
  - Factories handle complex entity creation logic
  - Services contain application-specific business logic
  - Clear ports/interfaces for external dependencies

- **Type System**: Centralized in domain value objects
  - `AdInsightsTimeRange` moved to `domain/value-objects/TimeRange`
  - Single source of truth for types across all layers
  - No more duplicate type definitions

- **Error Handling**: Simplified approach
  - Removed complex `DomainException` class
  - Using simple Error objects with code property
  - Less boilerplate, easier to understand

## File Naming Conventions

This project follows strict naming conventions for better code organization and readability:

### Domain Layer
- **Aggregates**: `PascalCase` - `Account.ts`, `AdSetInsight.ts`, `ExportResult.ts`
- **Value Objects**: `PascalCase` - `AdAccount.ts`, `TimeRange.ts`
- **Domain Services**: `PascalCase` - `AccountService.ts`, `AdInsightsService.ts`
- **Repository Interfaces**: `PascalCase` with `I` prefix - `IAccountRepository.ts`

### Application Layer
- **Service Interfaces (Ports)**: `PascalCase` with `I` prefix - `IAdInsightService.ts`, `IOAuthService.ts`
- **Services**: `kebab-case` - `cron-scheduler.ts`, `csv-processor.ts`, `CsvService.ts`
- **Use Cases**: `kebab-case` - `facebook-auth.ts`, `sync-ad-insights/`

### Infrastructure Layer
- **Repositories**: `PascalCase` - `AccountRepository.ts`, `AdInsightRepository.ts`
- **Schemas**: `PascalCase` - `AccountSchema.ts`, `AdSetInsightSchema.ts`
- **Clients**: `PascalCase` - `AuthClient.ts`, `InsightClient.ts`
- **Utilities**: `camelCase` - `logger.ts`

### Interface Layer (HTTP)
- **Controllers**: `PascalCase` - `FacebookAuthController.ts`
- **Routes**: `kebab-case` - `facebook-auth.routes.ts`, `ad-insights.routes.ts`
- **Middleware**: `kebab-case` - `error-handler.ts`, `request-logger.ts`
- **Helpers**: `kebab-case` - `response-helpers.ts`, `validation-schemas.ts`
- **Types**: `kebab-case` - `controller-types.ts`, `facebook-auth.types.ts`

### Config Files
- `camelCase` - `env.ts`, `database.ts`, `dependencies.ts`

### General Rules
- **Types/Interfaces/Classes**: `PascalCase`
- **Functions/Operations**: `kebab-case`
- **Utilities/Helpers**: `kebab-case`
- **Folders**: `kebab-case` - `ad-insights`, `sync-ad-insights`

## Contributing

Follow the DDD architecture patterns:
1. Keep business logic in domain layer (aggregates, value objects, domain services)
2. Use pure functions for domain operations (immutable transformations)
3. Application layer orchestrates domain logic and infrastructure
4. Infrastructure layer only handles external concerns (database, APIs, etc.)
5. Import shared dependencies from `config/dependencies.ts`
6. Maintain immutability in all domain operations
7. **Follow file naming conventions** as documented above

## License

MIT