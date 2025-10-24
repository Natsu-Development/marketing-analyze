/**
 * Simplified Functional Approach for Facebook Connections
 * Plain data + pure functions - no factory pattern needed
 */

import { FacebookAdAccount } from './IFacebookClient'

export enum ConnectionStatus {
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    NEEDS_RECONNECT = 'needs_reconnect',
}

// Plain data interface - just data, no methods
export interface FacebookConnection {
    readonly id?: string
    readonly fbUserId: string
    readonly accessToken: string
    readonly scopes: readonly string[]
    readonly status: ConnectionStatus
    readonly connectedAt: Date
    readonly expiresAt: Date
    readonly lastErrorCode?: string
    readonly adAccounts?: readonly FacebookAdAccount[]
    readonly createdAt: Date
    readonly updatedAt: Date
}

// Pure functions that operate on the data
export const fbConnection = {
    // Create a new connection
    create: (props: Partial<FacebookConnection> & Pick<FacebookConnection, 'fbUserId' | 'accessToken' | 'scopes' | 'expiresAt'>): FacebookConnection => {
        const now = new Date()
        return {
            ...props,
            status: props.status || ConnectionStatus.CONNECTED,
            connectedAt: props.connectedAt || now,
            createdAt: props.createdAt || now,
            updatedAt: props.updatedAt || now,
            scopes: [...props.scopes],
            adAccounts: props.adAccounts ? [...props.adAccounts] : [],
        }
    },

    // Check if connection is expired
    isExpired: (connection: FacebookConnection): boolean => {
        return new Date() >= connection.expiresAt
    },

    // Check if connection is expiring soon
    isExpiringSoon: (connection: FacebookConnection, windowMinutes = 5): boolean => {
        const threshold = new Date(Date.now() + windowMinutes * 60 * 1000)
        return connection.expiresAt <= threshold
    },

    // Check if needs refresh
    needsRefresh: (connection: FacebookConnection, windowMinutes = 5): boolean => {
        return !fbConnection.isExpired(connection) && fbConnection.isExpiringSoon(connection, windowMinutes)
    },

    // Update tokens - returns new connection object
    updateTokens: (connection: FacebookConnection, accessToken: string, expiresAt: Date): FacebookConnection => ({
        ...connection,
        accessToken,
        expiresAt,
        status: ConnectionStatus.CONNECTED,
        lastErrorCode: undefined,
        updatedAt: new Date(),
    }),

    // Update ad accounts - returns new connection object
    updateAdAccounts: (connection: FacebookConnection, adAccounts: FacebookAdAccount[]): FacebookConnection => ({
        ...connection,
        adAccounts: [...adAccounts],
        updatedAt: new Date(),
    }),

    // Set ad account active status - returns new connection object
    setAdAccountActive: (connection: FacebookConnection, adAccountId: string, isActive: boolean): FacebookConnection => {
        const updatedAdAccounts = (connection.adAccounts || []).map((account) => 
            account.adAccountId === adAccountId 
                ? { ...account, isActive }
                : account
        )

        return {
            ...connection,
            adAccounts: updatedAdAccounts,
            updatedAt: new Date(),
        }
    },

    // Check if ad account is active
    isAdAccountActive: (connection: FacebookConnection, adAccountId: string): boolean => {
        const account = (connection.adAccounts || []).find((acc) => acc.adAccountId === adAccountId)
        return account?.isActive === true
    },

    // Get active ad accounts
    getActiveAdAccounts: (connection: FacebookConnection): readonly FacebookAdAccount[] => {
        return (connection.adAccounts || []).filter((account) => account.isActive === true)
    },

    // Mark as needs reconnect - returns new connection object
    markAsNeedsReconnect: (connection: FacebookConnection, errorCode: string): FacebookConnection => ({
        ...connection,
        status: ConnectionStatus.NEEDS_RECONNECT,
        lastErrorCode: errorCode,
        updatedAt: new Date(),
    }),

    // Disconnect - returns new connection object
    disconnect: (connection: FacebookConnection): FacebookConnection => ({
        ...connection,
        status: ConnectionStatus.DISCONNECTED,
        updatedAt: new Date(),
    }),

    // Convert to JSON (for API responses)
    toJSON: (connection: FacebookConnection) => ({
        id: connection.id,
        fbUserId: connection.fbUserId,
        scopes: connection.scopes,
        status: connection.status,
        connectedAt: connection.connectedAt,
        expiresAt: connection.expiresAt,
        lastErrorCode: connection.lastErrorCode,
        adAccounts: connection.adAccounts,
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt,
    }),
}

// Validation function
export const validateFacebookConnection = (props: any): void => {
    if (!props.fbUserId || typeof props.fbUserId !== 'string') {
        throw new Error('fbUserId is required and must be a string')
    }
    if (!props.accessToken || typeof props.accessToken !== 'string') {
        throw new Error('accessToken is required and must be a string')
    }
    if (!Array.isArray(props.scopes) || props.scopes.length === 0) {
        throw new Error('scopes must be a non-empty array')
    }
    if (!props.expiresAt || !(props.expiresAt instanceof Date)) {
        throw new Error('expiresAt is required and must be a Date')
    }
}
