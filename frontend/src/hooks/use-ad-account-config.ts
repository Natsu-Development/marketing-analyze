import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  getSettings,
  upsertSettings,
  mapErrorToMessage,
  logError,
  type SettingsFormData,
} from '@/api'
import { ApiError } from '@/api/client'

export function useAdAccountConfig(adAccountId: string | null) {
  const { t } = useTranslation()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currency] = useState('VND')
  const [settings, setSettings] = useState<SettingsFormData>({
    scalePercent: undefined,
    initScaleDay: undefined,
    recurScaleDay: undefined,
    cpm: undefined,
    ctr: undefined,
    frequency: undefined,
    inlineLinkCtr: undefined,
    costPerInlineLinkClick: undefined,
    purchaseRoas: undefined,
    note: undefined,
  })

  useEffect(() => {
    if (adAccountId) {
      loadSettings()
    } else {
      setLoading(false)
    }
  }, [adAccountId])

  const loadSettings = async () => {
    if (!adAccountId) return

    try {
      const data = await getSettings(adAccountId)
      setSettings({
        scalePercent: data.scalePercent ?? undefined,
        initScaleDay: data.initScaleDay ?? undefined,
        recurScaleDay: data.recurScaleDay ?? undefined,
        cpm: data.cpm ?? undefined,
        ctr: data.ctr ?? undefined,
        frequency: data.frequency ?? undefined,
        inlineLinkCtr: data.inlineLinkCtr ?? undefined,
        costPerInlineLinkClick: data.costPerInlineLinkClick ?? undefined,
        purchaseRoas: data.purchaseRoas ?? undefined,
        note: data.note ?? undefined,
      })
    } catch (error) {
      if (error instanceof ApiError) {
        const errorMsg = mapErrorToMessage(error)
        logError(error, 'Load Settings')
        toast.error(errorMsg.title, { description: errorMsg.description })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!adAccountId) return

    setSaving(true)

    try {
      await upsertSettings(adAccountId, settings)
      toast.success(t('settings.savedSuccessfully'))
    } catch (error) {
      if (error instanceof ApiError) {
        const errorMsg = mapErrorToMessage(error)
        logError(error, 'Save Settings')
        toast.error(errorMsg.title, { description: errorMsg.description })
      }
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof SettingsFormData, value: string) => {
    const numValue = value.trim() === '' ? undefined : parseFloat(value)
    setSettings({ ...settings, [field]: numValue })
  }

  const updateNote = (value: string) => {
    setSettings({ ...settings, note: value })
  }

  return {
    // State
    loading,
    saving,
    currency,
    settings,
    // Actions
    handleSave,
    updateField,
    updateNote,
  }
}
