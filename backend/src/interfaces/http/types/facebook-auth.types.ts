/**
 * Facebook Auth Types
 * Re-exports types from use cases for convenience
 */

export type {
    InitiateConnectionRequest,
    InitiateConnectionResponse,
    HandleCallbackRequest,
    HandleCallbackResponse,
    GetStatusRequest,
    GetStatusResponse,
    DisconnectRequest,
    DisconnectResponse,
    GetTokenRequest,
    GetTokenResponse,
    RefreshAdAccountsRequest,
    RefreshAdAccountsResponse,
    SetAdAccountActiveRequest,
    SetAdAccountActiveResponse,
} from '../../../application/use-cases/facebook-auth'
