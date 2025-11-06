/**
 * Repository Interface: IAccountRepository
 * Defines contract for persistence operations on Account entities
 */

import { Account } from '../aggregates/account'

export interface IAccountRepository {
    save(account: Account): Promise<Account>
    findByAccountId(accountId: string): Promise<Account | null>
    findAllConnected(): Promise<Account[]>
    deleteByAccountId(accountId: string): Promise<void>
    findById(id: string): Promise<Account | null>
    /**
     * Find ad account name by ad account ID
     * Searches through all connected accounts to find the ad account name
     * Returns null if ad account not found
     */
    findAdAccountNameById(adAccountId: string): Promise<string | null>
}
