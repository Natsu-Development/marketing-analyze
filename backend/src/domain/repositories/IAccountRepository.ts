/**
 * Repository Interface: IAccountRepository
 * Defines contract for persistence operations on Account entities
 */

import { Account } from '../entities/Account'

export interface IAccountRepository {
    save(account: Account): Promise<Account>
    findByAccountId(accountId: string): Promise<Account | null>
    deleteByAccountId(accountId: string): Promise<void>
    findById(id: string): Promise<Account | null>
}
