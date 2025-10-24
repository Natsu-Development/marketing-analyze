import { ConfigSettings } from '@/components/config-settings'
import { useTranslation } from 'react-i18next'

export default function Settings() {
  const { t } = useTranslation()

  return (
    <main className="bg-background min-h-screen p-6 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-foreground text-3xl font-semibold tracking-tight">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.subtitle')}</p>
        </div>
        <ConfigSettings />
      </div>
    </main>
  )
}
