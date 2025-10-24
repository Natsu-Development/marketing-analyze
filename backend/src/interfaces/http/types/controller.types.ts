/**
 * HTTP Controller Types
 * Centralized type definitions for all HTTP controllers
 */

import { Request, Response, NextFunction } from 'express'

/**
 * Base controller handler type
 */
export type ControllerHandler = (req: Request, res: Response, next?: NextFunction) => Promise<void> | void

/**
 * Base controller interface
 */
export interface IController {
    [key: string]: ControllerHandler
}
