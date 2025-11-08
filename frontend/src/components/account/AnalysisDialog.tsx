import { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AnalysisProgress, AnalysisStep } from '@/api/types'

interface AnalysisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  progress: AnalysisProgress | null
  isComplete: boolean
  hasError: boolean
  onClose: () => void
}

export function AnalysisDialog({
  open,
  onOpenChange,
  progress,
  isComplete,
  hasError,
  onClose,
}: AnalysisDialogProps) {
  const { t } = useTranslation()

  useEffect(() => {
    if (isComplete && !hasError) {
      const timer = setTimeout(() => {
        onClose()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isComplete, hasError, onClose])

  const getStepIcon = (step: AnalysisStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
      case 'in_progress':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
    }
  }

  const progressPercentage = progress
    ? Math.round((progress.currentStep / progress.steps.length) * 100)
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete && !hasError && (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            )}
            {hasError && <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
            {!isComplete && !hasError && <Loader2 className="h-5 w-5 animate-spin" />}
            {t('account.analysis.title')}
          </DialogTitle>
          <DialogDescription>
            {isComplete && !hasError && t('account.analysis.completed')}
            {hasError && t('account.analysis.failed')}
            {!isComplete && !hasError && t('account.analysis.inProgress')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t('account.analysis.progress')}
              </span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {progress && (
            <div className="space-y-3">
              {progress.steps.map((step) => (
                <div
                  key={step.step}
                  className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3"
                >
                  <div className="mt-0.5">{getStepIcon(step)}</div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground">{step.name}</p>
                    {step.result && (
                      <div className="text-xs text-muted-foreground">
                        {step.result.insightsExported !== undefined &&
                          `${t('account.analysis.insightsExported')}: ${step.result.insightsExported}`}
                        {step.result.adsetsSynced !== undefined &&
                          `${t('account.analysis.adsetsSynced')}: ${step.result.adsetsSynced}`}
                        {step.result.suggestionsCreated !== undefined &&
                          `${t('account.analysis.suggestionsCreated')}: ${step.result.suggestionsCreated}`}
                      </div>
                    )}
                    {step.error && (
                      <p className="text-xs text-red-600 dark:text-red-400">{step.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isComplete && (
            <div className="flex justify-end">
              <Button onClick={onClose} variant="outline">
                {t('common.close')}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
