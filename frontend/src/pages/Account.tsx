import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  getAccount,
  refreshAdAccounts,
  toggleAccountActive,
  connectFacebook,
  disconnectFacebook,
  handleOAuthCallback,
  runOrchestratedAnalysis,
  ApiError,
  mapErrorToMessage,
  logError,
  type Account as AccountType,
  type AnalysisProgress,
} from '@/api'
import { ConnectionCard, AdAccountsList, NoConnectionState, LoadingState, AnalysisDialog } from '@/components/account'

export default function AccountPage() {
  const { t } = useTranslation()
  const [account, setAccount] = useState<AccountType | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [togglingAccounts, setTogglingAccounts] = useState<Set<string>>(new Set())
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [analysisHasError, setAnalysisHasError] = useState(false)

  useEffect(() => {
    const oauthResult = handleOAuthCallback()

    if (oauthResult.status === 'success') {
      toast.success(t('account.fbConnectedSuccess'))
      window.history.replaceState({}, '', window.location.pathname)
    } else if (oauthResult.status === 'error') {
      toast.error(oauthResult.message || t('account.authFailedError'))
      window.history.replaceState({}, '', window.location.pathname)
    }

    loadAccount()
  }, [])

  const loadAccount = async () => {
    const accountId = '122103622383096002' // hard-code temp

    if (!accountId) {
      setLoading(false)
      return
    }

    try {
      const data = await getAccount(accountId)
      setAccount(data)
    } catch (error) {
      if (error instanceof ApiError) {
        const errorMsg = mapErrorToMessage(error)
        logError(error, 'Load Account')

        if (error.errorCode === 'NO_CONNECTION' || error.errorCode === 'TOKEN_EXPIRED') {
          localStorage.removeItem('accountId')
          setAccount(null)
        } else {
          toast.error(errorMsg.title, { description: errorMsg.description })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      await connectFacebook()
    } catch (error) {
      if (error instanceof ApiError) {
        const errorMsg = mapErrorToMessage(error)
        logError(error, 'Connect Facebook')
        toast.error(errorMsg.title, { description: errorMsg.description })
      }
    }
  }

  const handleDisconnect = async () => {
    if (!account) return

    try {
      await disconnectFacebook(account.accountId)
      localStorage.removeItem('accountId')
      setAccount(null)
      toast.success(t('account.fbDisconnectedSuccess'))
    } catch (error) {
      if (error instanceof ApiError) {
        const errorMsg = mapErrorToMessage(error)
        logError(error, 'Disconnect Facebook')
        toast.error(errorMsg.title, { description: errorMsg.description })
      }
    }
  }

  const handleRefresh = async () => {
    if (!account) return

    setRefreshing(true)

    try {
      const response = await refreshAdAccounts(account.accountId)
      setAccount(response.account)
      toast.success(t('account.refreshSuccess', { count: response.adAccountsCount }))
    } catch (error) {
      if (error instanceof ApiError) {
        const errorMsg = mapErrorToMessage(error)
        logError(error, 'Refresh Ad Accounts')
        toast.error(errorMsg.title, { description: errorMsg.description })
      }
    } finally {
      setRefreshing(false)
    }
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setAnalysisDialogOpen(true)
    setAnalysisProgress(null)
    setAnalysisComplete(false)
    setAnalysisHasError(false)

    try {
      const result = await runOrchestratedAnalysis((progress) => {
        setAnalysisProgress(progress)
      })

      setAnalysisComplete(true)

      if (result.success) {
        toast.success(
          t('account.analysis.successMessage', {
            count: result.results.suggestionsCreated,
          })
        )
      } else {
        setAnalysisHasError(true)
        toast.error(t('account.analysis.errorMessage'))
      }
    } catch (error) {
      setAnalysisComplete(true)
      setAnalysisHasError(true)
      const errorMessage = error instanceof Error ? error.message : t('account.analysis.unknownError')
      toast.error(t('account.analysis.errorMessage'), { description: errorMessage })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleCloseAnalysisDialog = () => {
    setAnalysisDialogOpen(false)
    setAnalysisProgress(null)
    setAnalysisComplete(false)
    setAnalysisHasError(false)
  }

  const handleToggle = async (adAccountId: string, currentActive: boolean) => {
    if (!account) return

    const newActive = !currentActive

    setAccount({
      ...account,
      adAccounts: account.adAccounts.map((acc) =>
        acc.adAccountId === adAccountId ? { ...acc, isActive: newActive } : acc
      ),
    })

    setTogglingAccounts((prev) => new Set([...prev, adAccountId]))

    try {
      const updatedAccount = await toggleAccountActive(account.accountId, adAccountId, newActive)
      setAccount(updatedAccount)
      const status = newActive ? t('account.activated') : t('account.deactivated')
      toast.success(t('account.accountToggled', { status }))
    } catch (error) {
      setAccount({
        ...account,
        adAccounts: account.adAccounts.map((acc) =>
          acc.adAccountId === adAccountId ? { ...acc, isActive: currentActive } : acc
        ),
      })

      if (error instanceof ApiError) {
        const errorMsg = mapErrorToMessage(error)
        logError(error, 'Toggle Ad Account')
        toast.error(errorMsg.title, { description: errorMsg.description })
      }
    } finally {
      setTogglingAccounts((prev) => {
        const updated = new Set(prev)
        updated.delete(adAccountId)
        return updated
      })
    }
  }

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
