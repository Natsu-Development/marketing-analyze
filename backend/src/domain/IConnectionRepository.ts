/**
 * Repository Interface: IFacebookConnectionRepository
 * Defines contract for persistence operations on FacebookConnection entities
 */

import { FacebookConnection } from './Connection'

export interface IFacebookConnectionRepository {
    save(connection: FacebookConnection): Promise<FacebookConnection>
    findByFbUserId(fbUserId: string): Promise<FacebookConnection | null>
    deleteByFbUserId(fbUserId: string): Promise<void>
    findById(id: string): Promise<FacebookConnection | null>
}
