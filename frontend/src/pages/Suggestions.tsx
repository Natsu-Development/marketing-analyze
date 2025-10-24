import { SuggestionsList } from '@/components/suggestions-list'
import { useTranslation } from 'react-i18next'

export default function Suggestions() {
  const { t } = useTranslation()

  return (
    <main className="bg-background min-h-screen p-6 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-foreground text-3xl font-semibold tracking-tight">{t('suggestions.title')}</h1>
          <p className="text-muted-foreground">{t('suggestions.subtitle')}</p>
        </div>
        <SuggestionsList />
      </div>
    </main>
  )
}
