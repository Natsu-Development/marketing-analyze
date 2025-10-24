/**
 * Domain Exceptions
 * Custom exceptions for domain-specific errors following DDD principles
 */

export abstract class DomainException extends Error {
    constructor(
        message: string,
        public readonly code: string
    ) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}

export class ValidationException extends DomainException {
    constructor(message: string) {
        super(message, 'VALIDATION_ERROR')
    }
}

export class ConnectionNotFoundException extends DomainException {
    constructor(userId: string) {
        super(`No connection found for user: ${userId}`, 'NO_CONNECTION')
    }
}

export class TokenExpiredException extends DomainException {
    constructor(message: string = 'Access token has expired') {
        super(message, 'TOKEN_EXPIRED')
    }
}

export class NeedsReconnectException extends DomainException {
    constructor(message: string = 'Connection requires user to reconnect') {
        super(message, 'NEEDS_RECONNECT')
    }
}

export class StateMismatchException extends DomainException {
    constructor() {
        super('State parameter mismatch - possible CSRF attack', 'STATE_MISMATCH')
    }
}

export class ScopeMismatchException extends DomainException {
    constructor(missing: string[]) {
        super(`Missing required OAuth scopes: ${missing.join(', ')}`, 'SCOPE_MISMATCH')
    }
}

export class RefreshFailedException extends DomainException {
    constructor(message: string = 'Token refresh failed') {
        super(message, 'REFRESH_FAILED')
    }
}

export class ExternalServiceException extends DomainException {
    constructor(service: string, message: string) {
        super(`${service} error: ${message}`, 'EXTERNAL_SERVICE_ERROR')
    }
}
