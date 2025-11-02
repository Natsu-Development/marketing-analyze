/**
 * Infrastructure: Logger
 * Structured logging using Pino with automatic file name tracking
 */

import pino from 'pino'
import path from 'path'

const baseLogger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport:
        process.env.NODE_ENV === 'development'
            ? {
                  target: 'pino-pretty',
                  options: {
                      colorize: true,
                      translateTime: 'SYS:standard',
                      ignore: 'pid,hostname',
                  },
              }
            : undefined,
})

/**
 * Get the calling file name from stack trace
 */
function getCallerFile(): string {
    const originalPrepareStackTrace = Error.prepareStackTrace
    try {
        const err = new Error()
        let callerFile = 'unknown'

        Error.prepareStackTrace = (_err, stack) => stack

        const stack = err.stack as unknown as NodeJS.CallSite[]

        // Find the first stack frame outside of logger.ts
        for (let i = 0; i < stack.length; i++) {
            const fileName = stack[i].getFileName()
            if (fileName && !fileName.includes('logger.ts')) {
                callerFile = path.basename(fileName)
                break
            }
        }

        Error.prepareStackTrace = originalPrepareStackTrace
        return callerFile
    } catch {
        Error.prepareStackTrace = originalPrepareStackTrace
        return 'unknown'
    }
}

/**
 * Create a logger wrapper that automatically adds file name to all logs
 */
function createLoggerWithFile() {
    return {
        info: (obj: any, msg?: any) => {
            const file = getCallerFile()
            if (typeof obj === 'string') {
                baseLogger.info({ file }, obj)
            } else if (msg !== undefined) {
                baseLogger.info({ ...obj, file }, msg)
            } else {
                baseLogger.info({ ...obj, file })
            }
        },
        warn: (obj: any, msg?: any) => {
            const file = getCallerFile()
            if (typeof obj === 'string') {
                baseLogger.warn({ file }, obj)
            } else if (msg !== undefined) {
                baseLogger.warn({ ...obj, file }, msg)
            } else {
                baseLogger.warn({ ...obj, file })
            }
        },
        error: (obj: any, msg?: any) => {
            const file = getCallerFile()
            if (typeof obj === 'string') {
                baseLogger.error({ file }, obj)
            } else if (msg !== undefined) {
                baseLogger.error({ ...obj, file }, msg)
            } else {
                baseLogger.error({ ...obj, file })
            }
        },
        debug: (obj: any, msg?: any) => {
            const file = getCallerFile()
            if (typeof obj === 'string') {
                baseLogger.debug({ file }, obj)
            } else if (msg !== undefined) {
                baseLogger.debug({ ...obj, file }, msg)
            } else {
                baseLogger.debug({ ...obj, file })
            }
        },
    }
}

export const logger = createLoggerWithFile()
