import { Card } from '@/components/ui/card'
import { useTranslation } from 'react-i18next'
import { ConnectionCard, AdAccountsList, NoConnectionState, LoadingState, AnalysisDialog } from '@/components/account'
import { useAccount } from '@/hooks/use-account'

export default function AccountPage() {
  const { t } = useTranslation()
  const {
    account,
    loading,
    refreshing,
    togglingAccounts,
    analyzing,
    analysisDialogOpen,
    analysisProgress,
    analysisComplete,
    analysisHasError,
    handleConnect,
    handleDisconnect,
    handleRefresh,
    handleAnalyze,
    handleCloseAnalysisDialog,
    handleToggle,
    setAnalysisDialogOpen,
  } = useAccount()

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t('account.title')}</h1>
            <p className="text-muted-foreground">{t('account.subtitle')}</p>
          </div>
          <LoadingState />
        </div>
      </main>
    )
  }

  if (!account) {
    return (
      <main className="min-h-screen bg-background p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t('account.title')}</h1>
            <p className="text-muted-foreground">{t('account.subtitle')}</p>
          </div>
          <NoConnectionState onConnect={handleConnect} />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background p-6 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t('account.title')}</h1>
          <p className="text-muted-foreground">{t('account.subtitle')}</p>
        </div>

        <Card className="bg-card p-6">
          <div className="space-y-6">
            <ConnectionCard status={account.status} onDisconnect={handleDisconnect} />
            <AdAccountsList
              adAccounts={account.adAccounts}
              onRefresh={handleRefresh}
              onAnalyze={handleAnalyze}
              onToggle={handleToggle}
              refreshing={refreshing}
              analyzing={analyzing}
              togglingAccounts={togglingAccounts}
            />
          </div>
        </Card>

        <AnalysisDialog
          open={analysisDialogOpen}
          onOpenChange={setAnalysisDialogOpen}
          progress={analysisProgress}
          isComplete={analysisComplete}
          hasError={analysisHasError}
          onClose={handleCloseAnalysisDialog}
        />
      </div>
    </main>
  )
}
