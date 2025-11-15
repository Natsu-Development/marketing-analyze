import { useSearchParams, Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { getCurrencySymbol } from '@/lib/currency'
import {
  PerformanceThresholdsSection,
  ScalingConfigSection,
  NotesSection,
  FormActions,
} from '@/components/ad-account-config'
import { useAdAccountConfig } from '@/hooks/use-ad-account-config'

export default function AdAccountConfigPage() {
  const [searchParams] = useSearchParams()
  const adAccountId = searchParams.get('adAccountId')

  const { loading, saving, currency, settings, handleSave, updateField, updateNote } =
    useAdAccountConfig(adAccountId)

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
