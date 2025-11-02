/**
 * Infrastructure: Logger
 * Winston logger with popular format including file name and line number tracking
 */

import winston from 'winston'
import path from 'path'

interface CallerInfo {
    file: string
    line: number
}

/**
 * Get the calling file name and line number from stack trace
 */
function getCallerInfo(): CallerInfo {
    const originalPrepareStackTrace = Error.prepareStackTrace
    try {
        const err = new Error()
        let callerFile = 'unknown'
        let callerLine = 0

        Error.prepareStackTrace = (_err, stack) => stack

        const stack = err.stack as unknown as NodeJS.CallSite[]

        // Find the first stack frame outside of logger.ts
        for (let i = 0; i < stack.length; i++) {
            const fileName = stack[i].getFileName()
            if (fileName && !fileName.includes('logger.ts')) {
                // Get file name without extension
                const baseName = path.basename(fileName)
                callerFile = baseName.replace(path.extname(baseName), '')
                callerLine = stack[i].getLineNumber() || 0
                break
            }
        }

        Error.prepareStackTrace = originalPrepareStackTrace
        return {
            file: callerFile,
            line: callerLine,
        }
    } catch {
        Error.prepareStackTrace = originalPrepareStackTrace
        return {
            file: 'unknown',
            line: 0,
        }
    }
}

/**
 * Custom format for development with colors and file:line
 */
const devFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf((info) => {
        const { timestamp, level, message, file, line, ...meta } = info
        const fileContext = file && line ? `[${file}:${line}]` : ''
        const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : ''
        return `${timestamp} ${level} ${fileContext} ${message}${metaStr}`
    })
)

/**
 * Custom format for production (JSON with metadata)
 */
const prodFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
)

/**
 * Create Winston logger instance
 */
const baseLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.NODE_ENV === 'development' ? devFormat : prodFormat,
    transports: [
        new winston.transports.Console({
            stderrLevels: ['error'],
        }),
    ],
    // Don't exit on handled exceptions
    exitOnError: false,
})

/**
 * Create logger wrapper with automatic file name and line number tracking
 */
function createLogger() {
    return {
        info: (obj: any, msg?: any) => {
            const callerInfo = getCallerInfo()
            if (typeof obj === 'string') {
                baseLogger.info(obj, { file: callerInfo.file, line: callerInfo.line })
            } else if (msg !== undefined) {
                baseLogger.info(msg, { ...obj, file: callerInfo.file, line: callerInfo.line })
            } else {
                baseLogger.info('', { ...obj, file: callerInfo.file, line: callerInfo.line })
            }
        },
        warn: (obj: any, msg?: any) => {
            const callerInfo = getCallerInfo()
            if (typeof obj === 'string') {
                baseLogger.warn(obj, { file: callerInfo.file, line: callerInfo.line })
            } else if (msg !== undefined) {
                baseLogger.warn(msg, { ...obj, file: callerInfo.file, line: callerInfo.line })
            } else {
                baseLogger.warn('', { ...obj, file: callerInfo.file, line: callerInfo.line })
            }
        },
        error: (obj: any, msg?: any) => {
            const callerInfo = getCallerInfo()
            if (typeof obj === 'string') {
                baseLogger.error(obj, { file: callerInfo.file, line: callerInfo.line })
            } else if (msg !== undefined) {
                baseLogger.error(msg, { ...obj, file: callerInfo.file, line: callerInfo.line })
            } else {
                baseLogger.error('', { ...obj, file: callerInfo.file, line: callerInfo.line })
            }
        },
        debug: (obj: any, msg?: any) => {
            const callerInfo = getCallerInfo()
            if (typeof obj === 'string') {
                baseLogger.debug(obj, { file: callerInfo.file, line: callerInfo.line })
            } else if (msg !== undefined) {
                baseLogger.debug(msg, { ...obj, file: callerInfo.file, line: callerInfo.line })
            } else {
                baseLogger.debug('', { ...obj, file: callerInfo.file, line: callerInfo.line })
            }
        },
    }
}

export const logger = createLogger()
