import { get, post, put } from './client'
import { Account } from './types'

interface AccountResponse extends Account {
  success: true
}

interface RefreshResponse {
  success: true
  message: string
  adAccountsCount: number
  account: Account
}

interface ToggleActiveResponse {
  success: true
  message: string
  account: Account
}

export async function getAccount(accountId: string): Promise<Account> {
  const response = await get<AccountResponse>(
    `/api/v1/accounts/${accountId}`
  )

  // Backend spreads account fields directly into response
  const { success, ...account } = response
  return account as Account
}

export async function refreshAdAccounts(accountId: string): Promise<RefreshResponse> {
  return await post<RefreshResponse>(
    `/api/v1/accounts/${accountId}/refresh-ad-accounts`
  )
}

export async function toggleAccountActive(
  accountId: string,
  adAccountId: string,
  isActive: boolean
): Promise<Account> {
  const response = await put<ToggleActiveResponse>(
    `/api/v1/accounts/${accountId}/ad-accounts/${adAccountId}/active`,
    { isActive }
  )

  return response.account
}
