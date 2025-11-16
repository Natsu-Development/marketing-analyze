import { get, put } from './client'
import { AdAccountSetting, SettingsFormData } from './types'

interface SettingsResponse extends AdAccountSetting {
  success: true
}

export async function getSettings(adAccountId: string): Promise<AdAccountSetting> {
  const response = await get<SettingsResponse>(
    `/api/v1/ad-account-settings/${adAccountId}`
  )

  // Backend spreads settings fields directly into response
  const { success, ...settings } = response
  return settings as AdAccountSetting
}

export async function upsertSettings(
  adAccountId: string,
  settings: SettingsFormData
): Promise<AdAccountSetting> {
  const response = await put<SettingsResponse>(
    `/api/v1/ad-account-settings/${adAccountId}`,
    settings as Record<string, unknown>
  )

  // Backend spreads settings fields directly into response
  const { success, ...updatedSettings } = response
  return updatedSettings as AdAccountSetting
}
