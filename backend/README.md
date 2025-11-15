# Marketing Analytics Backend

A robust Node.js/Express REST API for Facebook advertising analytics and automated campaign optimization. Built with TypeScript and Domain-Driven Design principles, this backend provides comprehensive AdSet tracking, performance analysis, and intelligent budget scaling suggestions.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Cron Jobs](#cron-jobs)
- [Environment Configuration](#environment-configuration)
- [Development](#development)
- [Deployment](#deployment)

## Overview

This backend service integrates with Facebook's Graph API to:
- Authenticate users via OAuth 2.0
- Sync AdSet metadata and performance metrics
- Analyze campaign performance against configurable thresholds
- Generate automated budget scaling suggestions
- Track suggestion lifecycle (pending → applied/rejected)

**Version:** 1.0.0
**Base URL:** `http://localhost:3001/api/v1`

## Features

### Facebook Integration
- OAuth 2.0 authentication with long-lived token management
- Ad account discovery and status tracking
- AdSet metadata synchronization (budget, status, campaign info)
- AdSet insights export with comprehensive metrics
- Facebook Ads Manager deep linking

### Analytics & Suggestions
- Configurable performance metrics:
  - CPM (Cost Per Mille)
  - CTR (Click-Through Rate)
  - Frequency
  - Inline Link CTR
  - Cost Per Inline Link Click
  - Purchase ROAS (Return On Ad Spend)
- Automated suggestion generation for high-performing AdSets
- Budget scaling recommendations with percentage-based increments
- Intelligent eligibility validation (campaign age, scale timing)

### Automation
- Scheduled AdSet metadata sync (daily at 1 AM)
- Scheduled insights export (daily at 2 AM)
- Graceful shutdown handling
- Automatic token refresh management

### Data Management
- Per-account ad account configuration
- Active/inactive status toggling
- Timezone-aware data processing
- CSV export support for insights

## Tech Stack

**Core:**
- **Node.js** - JavaScript runtime
- **Express 4.18.2** - Web framework
- **TypeScript 5.3.3** - Type-safe development

**Database:**
- **MongoDB 8.0.3** - NoSQL database
- **Mongoose** - ODM for MongoDB

**Security:**
- **Facebook OAuth 2.0** - Authentication via Graph API v23.0
- **Helmet 7.1.0** - Security headers
- **CORS** - Cross-origin resource sharing
- **Token Encryption** - AES-256 encryption for access tokens

**Utilities:**
- **Zod 3.22.4** - Runtime schema validation
- **Axios 1.6.2** - HTTP client
- **Winston 3.18.3** - Structured logging
- **Node-Cron 4.2.1** - Job scheduling
- **CSV Parser 6.1.0** - Data export

## Architecture

Built using Domain-Driven Design (DDD) with clear separation of concerns:

```
backend/
├── src/
│   ├── domain/                 # Core business logic (pure functions)
│   │   ├── aggregates/        # Domain entities (Account, AdSet, etc.)
│   │   ├── repositories/      # Repository interfaces
│   │   ├── services/          # Domain services
│   │   └── value-objects/     # Immutable value types
│   │
│   ├── application/           # Use cases & orchestration
│   │   ├── use-cases/        # Business workflows
│   │   ├── services/         # Application services (CSV, Cron)
│   │   └── ports/            # External service interfaces
│   │
│   ├── infrastructure/        # External implementations
│   │   ├── database/         # MongoDB schemas & repositories
│   │   ├── external-services/ # Facebook API, Telegram
│   │   └── shared/           # Logger, utilities
│   │
│   ├── interfaces/            # HTTP layer
│   │   └── http/
│   │       ├── controllers/  # Request handlers
│   │       ├── routes/       # Route definitions
│   │       └── middleware/   # Express middleware
│   │
│   └── config/               # Configuration
│       ├── env.ts           # Environment validation
│       ├── database.ts      # DB connection
│       └── dependencies.ts  # Dependency injection
│
└── server.ts                 # Application entry point
```

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** 8.0.3+ (local or Atlas)
- **Facebook App** with Business Extension configured
  - App ID and App Secret
  - OAuth redirect URI configured
  - Required permissions: `ads_read`, `ads_management`, `public_profile`

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (see [Environment Configuration](#environment-configuration))

4. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3001` (or configured PORT).

### Quick Start

1. **Connect Facebook Account:**
   ```bash
   POST /api/v1/auth/facebook/session
   Body: { "action": "connect" }
   ```

2. **Sync AdSets:**
   ```bash
   POST /api/v1/adset-sync/sync
   ```

3. **Export Insights:**
   ```bash
   POST /api/v1/adset-insights/sync
   ```

4. **Generate Suggestions:**
   ```bash
   POST /api/v1/suggestions/analyze
   ```

5. **View Pending Suggestions:**
   ```bash
   GET /api/v1/suggestions?status=pending
   ```

## API Documentation

### Postman Collection

Import the Postman collection for complete API documentation:
- **File:** `Marketing-Analytics-Backend.postman_collection.json`
- Includes all endpoints with examples
- Pre-configured environment variables
- Sample request/response bodies

### Endpoint Overview

#### Health Check
```
GET /health
```

#### Facebook Authentication
```
POST   /api/v1/auth/facebook/session      # Connect/disconnect
GET    /api/v1/auth/facebook/callback     # OAuth callback
```

#### Account Management
```
GET    /api/v1/accounts/:accountId                                   # Get account details
POST   /api/v1/accounts/:accountId/refresh-ad-accounts               # Refresh ad accounts
PUT    /api/v1/accounts/:accountId/ad-accounts/:adAccountId/active   # Toggle active status
```

#### Ad Account Settings
```
GET    /api/v1/ad-account-settings/:adAccountId    # Get settings
PUT    /api/v1/ad-account-settings/:adAccountId    # Update settings
```

#### AdSet Sync
```
POST   /api/v1/adset-sync/sync    # Sync AdSet metadata
```

#### AdSet Insights
```
POST   /api/v1/adset-insights/sync    # Export insights
```

#### Suggestions
```
GET    /api/v1/suggestions                         # Get all suggestions
GET    /api/v1/suggestions?status=pending          # Filter by status
POST   /api/v1/suggestions/analyze                 # Generate suggestions
POST   /api/v1/suggestions/:suggestionId/approve   # Approve suggestion
POST   /api/v1/suggestions/:suggestionId/reject    # Reject suggestion
```

### Response Format

All API responses follow a consistent structure:

**Success (200):**
```json
{
  "data": { ... },
  "message": "Success message"
}
```

**Error (4xx/5xx):**
```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

## Database Schema

### Collections

#### `accounts`
Stores Facebook account information and connected ad accounts.

**Key Fields:**
- `accountId` (string, unique) - Facebook account ID
- `accessToken` (string, encrypted) - OAuth access token
- `status` (enum) - `connected` | `disconnected` | `needs_reconnect`
- `expiresAt` (Date) - Token expiration timestamp
- `adAccounts[]` (array) - Connected ad accounts with sync timestamps

**Indexes:**
- `accountId` (unique)
- `{ expiresAt, status }`
- `{ 'adAccounts.lastSyncInsight', 'adAccounts.isActive' }`

#### `adsets`
AdSet metadata from Facebook.

**Key Fields:**
- `adsetId` (string) - Facebook AdSet ID
- `adAccountId` (string) - Parent ad account
- `status` (enum) - `ACTIVE` | `PAUSED` | `DELETED` | `ARCHIVED`
- `dailyBudget` / `lifetimeBudget` (number) - Budget configuration
- `lastScaledAt` (Date) - Last budget scale timestamp

**Indexes:**
- `{ adAccountId, adsetId }` (unique)
- `status`, `campaignId`, `syncedAt`

#### `adset_insights`
AdSet performance metrics.

**Key Fields:**
- `adsetId` (string) - AdSet identifier
- `date` (Date) - Metrics date
- `impressions`, `clicks`, `amountSpent` (number) - Basic metrics
- `cpm`, `ctr`, `frequency` (number) - Performance metrics
- `purchaseRoas` (number) - ROAS metric

#### `ad_account_settings`
Per-account configuration for thresholds and scaling.

**Key Fields:**
- `adAccountId` (string, unique) - Ad account identifier
- `cpm`, `ctr`, `frequency`, etc. (number, optional) - Metric thresholds
- `scalePercent` (number) - Budget scale percentage (default: 20%)
- `initScaleDay` (number) - Min campaign age for first scale (default: 3)
- `recurScaleDay` (number) - Min days between scales (default: 7)

#### `suggestions`
Budget scaling suggestions generated from analysis.

**Key Fields:**
- `adsetId` (string) - Target AdSet
- `dailyBudget` (number) - Current budget
- `budgetScaled` (number) - Recommended new budget
- `metrics[]` (array) - Metrics that exceeded thresholds
- `status` (enum) - `pending` | `applied` | `rejected`

**Indexes:**
- `{ adAccountId, adsetId, createdAt }` (unique)
- `status`
- `{ adAccountId, status }`

## Cron Jobs

### AdSet Sync
**Schedule:** Daily at 1:00 AM
**Configuration:** `ADSET_SYNC_CRON_SCHEDULE` (default: `0 1 * * *`)

**Actions:**
1. Fetch all connected accounts
2. For each active ad account:
   - Query Facebook for AdSet list
   - Update or create AdSet records
   - Update `Account.adAccounts[].lastSyncAdSet` timestamp

### Insights Export
**Schedule:** Daily at 2:00 AM
**Configuration:** `AD_INSIGHTS_CRON_SCHEDULE` (default: `0 2 * * *`)

**Actions:**
1. Fetch all accounts with active ad accounts
2. For each ad account:
   - Calculate time range (since last sync, max 90 days)
   - Create async insights export job on Facebook
   - Poll for completion
   - Download and parse CSV
   - Store insights in MongoDB
   - Update `Account.adAccounts[].lastSyncInsight` timestamp

## Environment Configuration

Create a `.env` file in the backend root:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/marketing-analytics

# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:3001/api/v1/auth/facebook/callback
FACEBOOK_API_VERSION=v23.0

# Security
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your_64_character_hex_encryption_key

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=info

# Cron Schedules (cron syntax)
ADSET_SYNC_CRON_SCHEDULE=0 1 * * *
AD_INSIGHTS_CRON_SCHEDULE=0 2 * * *

# Optional: Telegram Notifications
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
```

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/db` |
| `FACEBOOK_APP_ID` | Facebook App ID | `123456789012345` |
| `FACEBOOK_APP_SECRET` | Facebook App Secret | `abc123...` |
| `FACEBOOK_REDIRECT_URI` | OAuth callback URL | `http://localhost:3001/api/...` |
| `ENCRYPTION_KEY` | 64-char hex key (32 bytes) | `a1b2c3d4...` |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:5173` |

### Generating Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Development

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm start            # Start production server
npm run type-check   # Run TypeScript type checking
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

### Development Workflow

1. **Start MongoDB:**
   ```bash
   # If using Docker:
   docker run -d -p 27017:27017 --name mongodb mongo:8.0.3
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **View logs:**
   Logs are output to console with Winston formatting:
   ```
   [2025-11-07 12:00:00] INFO: Server started on port 3001
   [2025-11-07 12:00:01] DEBUG: MongoDB connected successfully
   ```

### Code Style

- **TypeScript strict mode** enabled
- **ESLint** for linting
- **Prettier** for formatting
- **Functional programming** preferred in domain layer
- **DDD principles** for architecture

### Debugging

Enable debug logging:
```env
LOG_LEVEL=debug
```

For verbose logs including request/response:
```env
LOG_LEVEL=trace
```

## Deployment

### Production Build

```bash
npm install --production
npm run build
npm start
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Use MongoDB Atlas or managed MongoDB instance
3. Configure Facebook App with production redirect URI
4. Set secure CORS origins
5. Use strong encryption key (32 bytes)

### Docker Deployment

Example `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t marketing-analytics-backend .
docker run -p 3001:3001 --env-file .env marketing-analytics-backend
```

### Health Monitoring

Monitor the health endpoint:
```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-07T12:00:00.000Z",
  "service": "marketing-analytics-backend"
}
```

### Performance Considerations

- **MongoDB Connection Pooling:** Configured via Mongoose
- **Request Timeout:** 60 seconds for Facebook API calls
- **Rate Limiting:** 100 requests per 15 minutes (configurable)
- **Body Size Limit:** 10MB for JSON payloads
- **Graceful Shutdown:** 30-second timeout for in-flight requests

### Security Best Practices

1. **Token Encryption:** All Facebook access tokens encrypted at rest
2. **CORS:** Restrict to known frontend origins
3. **Helmet:** Security headers enabled
4. **Environment Variables:** Never commit `.env` file
5. **Token Expiration:** Automatic refresh management with 5-minute window
6. **Error Handling:** No sensitive data in error responses

## Project Structure

```
backend/
├── src/
│   ├── domain/                          # Business logic (pure functions)
│   │   ├── aggregates/
│   │   │   ├── account/                 # Account aggregate
│   │   │   ├── adset/                   # AdSet aggregate
│   │   │   ├── adset-insights/          # Insights aggregate
│   │   │   ├── ad-account-setting/      # Settings aggregate
│   │   │   └── suggestion/              # Suggestion aggregate
│   │   ├── repositories/                # Repository interfaces
│   │   ├── services/
│   │   │   └── SuggestionAnalyzer.ts   # Suggestion generation logic
│   │   └── value-objects/               # Immutable types
│   │
│   ├── application/                     # Use cases
│   │   ├── use-cases/
│   │   │   ├── facebook-auth/          # OAuth workflows
│   │   │   ├── account/                # Account management
│   │   │   ├── ad-account-setting/     # Settings management
│   │   │   ├── adset-sync/             # AdSet sync workflow
│   │   │   ├── adset-insights/         # Insights export workflow
│   │   │   ├── suggestion/             # Suggestion CRUD
│   │   │   └── analyze-suggestions/    # Suggestion analysis
│   │   ├── services/
│   │   │   ├── cron-scheduler.ts       # Job scheduling
│   │   │   └── csv-processor.ts        # CSV parsing
│   │   └── ports/                       # External interfaces
│   │
│   ├── infrastructure/                  # External implementations
│   │   ├── database/
│   │   │   └── mongodb/
│   │   │       ├── schemas/            # Mongoose schemas
│   │   │       └── repositories/       # Repository implementations
│   │   ├── external-services/
│   │   │   ├── facebook/
│   │   │   │   └── FacebookClient.ts   # Facebook API client
│   │   │   └── telegram/               # Optional Telegram client
│   │   └── shared/
│   │       └── logger.ts               # Winston logger
│   │
│   ├── interfaces/                      # HTTP layer
│   │   └── http/
│   │       ├── controllers/            # Request handlers
│   │       ├── routes/                 # Express routes
│   │       ├── middleware/             # Middleware (CORS, etc.)
│   │       └── helpers/                # Response utilities
│   │
│   ├── config/                          # Configuration
│   │   ├── env.ts                      # Environment validation (Zod)
│   │   ├── database.ts                 # DB connection setup
│   │   └── dependencies.ts             # DI container
│   │
│   └── app.ts                          # Express app setup
│
├── server.ts                            # Entry point
├── package.json
├── tsconfig.json
├── .env.template                        # Environment template
└── README.md
```

## Contributing

1. Follow TypeScript strict mode
2. Maintain DDD architecture
3. Add unit tests for domain logic
4. Update API documentation
5. Run linting and formatting before commit

## License

[Your License Here]

## Support

For issues and questions:
- GitHub Issues: [repository-url]/issues
- Documentation: This README

---

**Built with TypeScript, Express, and MongoDB**
**Powered by Facebook Graph API v23.0**
