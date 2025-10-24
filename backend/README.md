# Marketing Analytics Backend

Backend service for Facebook OAuth authentication with ad account management, built with **Simplified Functional Architecture**.

## Architecture

This implementation follows **Simplified Clean Architecture** with a functional approach:

```
src/
├── domain/              # Business entities and rules (innermost layer)
│   ├── Connection.ts    # Plain data interfaces + pure functions
│   ├── IConnectionRepository.ts  # Repository interface
│   └── IFacebookClient.ts       # Facebook API interface
├── application/         # Application business rules
│   └── use-cases/       # Use case implementations (pure functions)
│       └── facebookAuth.ts
├── infrastructure/      # External concerns (outermost layer)
│   ├── mongo-db/        # MongoDB schemas and repositories
│   │   ├── ConnectionRepository.ts
│   │   └── ConnectionSchema.ts
│   ├── FacebookClient.ts    # Facebook OAuth API client
│   └── logger.ts            # Logging infrastructure
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

## Functional Architecture Benefits

✅ **Simplified Design**
- Plain data objects instead of complex factory patterns
- Pure functions operating on data
- No object methods or frozen instances
- Direct imports instead of dependency injection

✅ **Better Performance**
- No `Object.freeze()` overhead
- Plain object operations
- Shared functions instead of object methods
- Faster startup and execution

✅ **Easier Testing**
- Test pure functions independently
- No complex mocking required
- Clear input/output testing
- Functional composition

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

## Functional Architecture Pattern

### Domain Layer (Pure Functions)

```typescript
// Plain data interface
export interface FacebookConnection {
  readonly id?: string
  readonly fbUserId: string
  readonly accessToken: string
  // ... other properties
}

// Pure functions namespace
export const fbConnection = {
  create: (props) => ({ ...props, /* defaults */ }),
  setAdAccountActive: (connection, adAccountId, isActive) => ({
    ...connection,
    adAccounts: connection.adAccounts.map(account => 
      account.adAccountId === adAccountId 
        ? { ...account, isActive }
        : account
    ),
    updatedAt: new Date()
  }),
  // ... other pure functions
}
```

### Repository Layer (Clean Document Mapping)

```typescript
const toDomain = (doc: any): FacebookConnection => {
  // Convert Mongoose document to plain object (no pollution)
  const plainDoc = doc.toObject ? doc.toObject() : doc
  
  return {
    id: plainDoc._id.toString(),
    fbUserId: plainDoc.fbUserId,
    // ... map all fields cleanly
  }
}
```

### Use Cases (Pure Functions)

```typescript
export async function setAdAccountActive(
  request: SetAdAccountActiveRequest
): Promise<SetAdAccountActiveResponse> {
  const connection = await repo.findByFbUserId(request.fbUserId)
  if (!connection) return { success: false, error: 'NO_CONNECTION' }

  // Use pure function
  const updated = fbConnection.setAdAccountActive(
    connection, 
    request.adAccountId, 
    request.isActive
  )

  const saved = await repo.save(updated)
  return { success: true, connection: saved }
}
```

## Database Schema

### FacebookConnection Collection

```typescript
{
  fbUserId: string            // Unique Facebook user ID
  accessToken: string         // Facebook access token
  scopes: string[]           // OAuth scopes granted
  status: ConnectionStatus   // connected | disconnected | needs_reconnect
  connectedAt: Date          // Initial connection timestamp
  expiresAt: Date           // Token expiration
  lastErrorCode?: string    // Last error encountered
  adAccounts: FacebookAdAccount[]  // User's ad accounts
  createdAt: Date
  updatedAt: Date
}
```

### FacebookAdAccount (embedded)

```typescript
{
  name: string              // Ad account name
  status: number           // Facebook account status
  currency: string         // Account currency
  timezone: string         // Account timezone
  spendCap?: string       // Spending cap
  adAccountId: string     // Facebook ad account ID
  isActive: boolean       // Whether account is active in our system
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

## Contributing

Follow the functional architecture patterns:
1. Keep domain logic in pure functions
2. Use plain data objects, not complex classes
3. Import dependencies directly from `config/dependencies.ts`
4. Test pure functions independently
5. Maintain immutability in all operations

## License

MIT