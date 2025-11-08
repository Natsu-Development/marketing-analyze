import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  getSettings,
  upsertSettings,
  ApiError,
  mapErrorToMessage,
  logError,
  type SettingsFormData,
} from '@/api'
import { getCurrencySymbol } from '@/lib/currency'
import {
  PerformanceThresholdsSection,
  ScalingConfigSection,
  NotesSection,
  FormActions,
} from '@/components/ad-account-config'

export default function AdAccountConfigPage() {
  const [searchParams] = useSearchParams()
  const adAccountId = searchParams.get('adAccountId')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currency, setCurrency] = useState('VND')
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
      toast.success('Settings saved successfully')
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

  if (!adAccountId) {
    return (
      <main className="min-h-screen bg-background p-6 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Card className="bg-card p-8 text-center">
            <h2 className="text-xl font-semibold text-foreground">No Ad Account Selected</h2>
            <p className="mt-2 text-muted-foreground">
              Please select an ad account from the Accounts page.
            </p>
            <Link to="/account">
              <Button className="mt-4">Go to Accounts</Button>
            </Link>
          </Card>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-6 md:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Link to="/account">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Accounts
            </Button>
          </Link>
          <Card className="bg-card p-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </Card>
        </div>
      </main>
    )
  }

  const currencySymbol = getCurrencySymbol(currency)

  return (
    <main className="min-h-screen bg-background p-6 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link to="/account">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Accounts
          </Button>
        </Link>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Ad Account Settings
          </h1>
          <p className="font-mono text-sm text-muted-foreground">{adAccountId}</p>
        </div>

        <div className="space-y-6">
          <PerformanceThresholdsSection
            settings={settings}
            currencySymbol={currencySymbol}
            onUpdateField={updateField}
          />

          <ScalingConfigSection settings={settings} onUpdateField={updateField} />

          <NotesSection note={settings.note} onUpdateNote={updateNote} />

          <FormActions onSave={handleSave} saving={saving} />
        </div>
      </div>
    </main>
  )
}
