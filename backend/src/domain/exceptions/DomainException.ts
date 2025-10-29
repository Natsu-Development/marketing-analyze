/**
 * Domain Exception
 * Base exception for domain layer
 */

export class DomainException extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly statusCode: number = 400
    ) {
        super(message)
        this.name = 'DomainException'
    }
}

// Specific domain exceptions
export class ConnectionNotFoundException extends DomainException {
    constructor(message: string = 'Connection not found') {
        super(message, 'CONNECTION_NOT_FOUND', 404)
        this.name = 'ConnectionNotFoundException'
    }
}

export class ExpiredTokenException extends DomainException {
    constructor(message: string = 'Token has expired') {
        super(message, 'TOKEN_EXPIRED', 401)
        this.name = 'ExpiredTokenException'
    }
}

export class InvalidAdAccountException extends DomainException {
    constructor(message: string = 'Invalid ad account') {
        super(message, 'INVALID_AD_ACCOUNT', 400)
        this.name = 'InvalidAdAccountException'
    }
}
