import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AdAccountCard } from './AdAccountCard'
import type { AdAccount } from '@/api'

interface AdAccountsListProps {
  adAccounts: AdAccount[]
  onRefresh: () => void
  onAnalyze: () => void
  onToggle: (adAccountId: string, currentActive: boolean) => void
  refreshing: boolean
  analyzing: boolean
  togglingAccounts: Set<string>
}

export function AdAccountsList({
  adAccounts,
  onRefresh,
  onAnalyze,
  onToggle,
  refreshing,
  analyzing,
  togglingAccounts,
}: AdAccountsListProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{t('account.adAccountsList.title')}</Label>
        <div className="flex items-center gap-2">
          <Button
            onClick={onAnalyze}
            disabled={analyzing || refreshing}
            variant="outline"
            size="sm"
            className="gap-2 bg-transparent"
          >
            <TrendingUp className={`h-4 w-4 ${analyzing ? 'animate-pulse' : ''}`} />
            {t('account.analyze')}
          </Button>
          <Button
            onClick={onRefresh}
            disabled={refreshing || analyzing}
            variant="outline"
            size="sm"
            className="gap-2 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {adAccounts.map((adAccount) => (
          <AdAccountCard
            key={adAccount.adAccountId}
            adAccount={adAccount}
            onToggle={onToggle}
            isToggling={togglingAccounts.has(adAccount.adAccountId)}
          />
        ))}
      </div>
    </div>
  )
}
