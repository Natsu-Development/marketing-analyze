/**
 * Account Use Cases
 * Manages account operations and ad account management
 */

import { AccountDomain } from '../../../domain'
import { accountRepository, facebookClient } from '../../../config/dependencies'
import {
    GetAccountInfoRequest,
    GetAccountInfoResponse,
    RefreshAdAccountsRequest,
    RefreshAdAccountsResponse,
    SetAdAccountActiveRequest,
    SetAdAccountActiveResponse,
} from './types'

/**
 * Get account information by account ID
 */
export async function getAccountInfo(request: GetAccountInfoRequest): Promise<GetAccountInfoResponse> {
    try {
        const account = await accountRepository.findByAccountId(request.accountId)
        if (!account) {
            return { success: false, error: 'ACCOUNT_NOT_FOUND' }
        }

        return { success: true, account }
    } catch (error) {
        return { success: false, error: (error as Error).message || 'INTERNAL_ERROR' }
    }
}

/**
 * Refresh ad accounts list from Facebook
 */
export async function refreshAdAccounts(request: RefreshAdAccountsRequest): Promise<RefreshAdAccountsResponse> {
    try {
        const account = await accountRepository.findByAccountId(request.accountId)
        if (!account) {
            return { success: false, error: 'NO_CONNECTION' }
        }

        // Fetch ad accounts from Facebook
        const adAccountsResponse = await facebookClient.getAdAccounts(account.accessToken)
        const adAccounts = adAccountsResponse.adAccounts

        // Update account with new ad accounts
        const updatedAccount = AccountDomain.updateAdAccounts(account, adAccounts)
        const savedAccount = await accountRepository.save(updatedAccount)

        return {
            success: true,
            message: 'Ad accounts refreshed successfully',
            adAccountsCount: adAccounts.length,
            account: savedAccount,
        }
    } catch (error) {
        return { success: false, error: (error as Error).message || 'INTERNAL_ERROR' }
    }
}

/**
 * Set ad account active status
 */
export async function setAdAccountActive(request: SetAdAccountActiveRequest): Promise<SetAdAccountActiveResponse> {
    try {
        const account = await accountRepository.findByAccountId(request.accountId)
        if (!account) {
            return { success: false, error: 'NO_CONNECTION' }
        }

        const updatedAccount = AccountDomain.setAdAccountActive(account, request.adAccountId, request.isActive)
        const savedAccount = await accountRepository.save(updatedAccount)

        return { success: true, account: savedAccount }
    } catch (error) {
        return { success: false, error: (error as Error).message || 'INTERNAL_ERROR' }
    }
}
