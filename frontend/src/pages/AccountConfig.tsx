import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, TrendingUp, Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface AdAccountConfig {
  scaleSpendPercent: string
  roas: string
  costPerIbComment: string
  cpc: string
  ctrAll: string
  ctrLink: string
  cpm: string
  costPerPurchase: string
  notes: string
}

interface AdAccountData {
  id: string
  name: string
  accountId: string
  status: 'active' | 'paused' | 'error'
  platform: string
  config: AdAccountConfig
}

const mockAccounts: Record<string, AdAccountData> = {
  'fb-1': {
    id: 'fb-1',
    name: 'Tài Khoản Chiến Dịch Chính',
    accountId: 'act_123456789',
    status: 'active',
    platform: 'Facebook',
    config: {
      scaleSpendPercent: '25',
      roas: '3.5',
      costPerIbComment: '0.25',
      cpc: '0.45',
      ctrAll: '2.8',
      ctrLink: '1.9',
      cpm: '12.50',
      costPerPurchase: '15.75',
      notes: 'ROAS mục tiêu cần duy trì trên 3.0 để có lợi nhuận. Theo dõi sát CPC trong giờ cao điểm.',
    },
  },
  'fb-2': {
    id: 'fb-2',
    name: 'Tài Khoản Nhận Diện Thương Hiệu',
    accountId: 'act_987654321',
    status: 'active',
    platform: 'Facebook',
    config: {
      scaleSpendPercent: '30',
      roas: '2.8',
      costPerIbComment: '0.30',
      cpc: '0.52',
      ctrAll: '3.2',
      ctrLink: '2.1',
      cpm: '15.00',
      costPerPurchase: '18.50',
      notes: 'Tập trung vào chỉ số nhận diện thương hiệu. CTR là ưu tiên hơn chi phí chuyển đổi.',
    },
  },
  'fb-3': {
    id: 'fb-3',
    name: 'Tài Khoản Tiếp Thị Lại',
    accountId: 'act_456789123',
    status: 'paused',
    platform: 'Facebook',
    config: {
      scaleSpendPercent: '20',
      roas: '4.2',
      costPerIbComment: '0.18',
      cpc: '0.35',
      ctrAll: '4.5',
      ctrLink: '3.2',
      cpm: '10.00',
      costPerPurchase: '12.00',
      notes: 'Chiến dịch tiếp thị lại thường có tương tác cao hơn. Duy trì mục tiêu ROAS chặt chẽ.',
    },
  },
}

export default function AccountConfig() {
  const { t } = useTranslation()
  const { accountId } = useParams<{ accountId: string }>()
  const accountData = accountId ? mockAccounts[accountId] : undefined

  const [config, setConfig] = useState<AdAccountConfig>(
    accountData?.config || {
      scaleSpendPercent: '',
      roas: '',
      costPerIbComment: '',
      cpc: '',
      ctrAll: '',
      ctrLink: '',
      cpm: '',
      costPerPurchase: '',
      notes: '',
    }
  )

  const handleSave = () => {
    console.log('[v0] Saving configuration:', config)
    // In real app, save to API/database
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-600 dark:text-green-400'
      case 'paused':
        return 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
      case 'error':
        return 'bg-red-500/20 text-red-600 dark:text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
    }
  }

  if (!accountData) {
    return (
      <main className="bg-background min-h-screen p-6 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Card className="bg-card p-8 text-center">
            <h2 className="text-foreground text-xl font-semibold">{t('accountConfig.notFound')}</h2>
            <p className="text-muted-foreground mt-2">{t('accountConfig.notFoundMessage')}</p>
            <Link to="/sync">
              <Button className="mt-4">{t('accountConfig.backToAdAccounts')}</Button>
            </Link>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-background min-h-screen p-6 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-4">
          <Link to="/sync">
            <Button variant="ghost" size="sm" className="-ml-2 gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('accountConfig.backToAdAccounts')}
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-foreground text-3xl font-semibold tracking-tight">{t('accountConfig.title')}</h1>
                <Badge variant="secondary" className={getStatusColor(accountData.status)}>
                  {t(`accountConfig.status.${accountData.status}`)}
                </Badge>
              </div>
              <div className="text-muted-foreground flex items-center gap-4 text-sm">
                <span className="font-mono">{accountData.accountId}</span>
                <span>•</span>
                <span>{accountData.platform}</span>
                <span>•</span>
                <span>{accountData.name}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-card p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-foreground text-xl font-semibold">{t('accountConfig.scaleSettings')}</h2>
                  <p className="text-muted-foreground text-sm">{t('accountConfig.scaleSettingsSubtitle')}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scaleSpendPercent" className="text-sm font-medium">
                  {t('accountConfig.scalePercent')}
                </Label>
                <div className="relative">
                  <Input
                    id="scaleSpendPercent"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={config.scaleSpendPercent}
                    onChange={(e) => setConfig({ ...config, scaleSpendPercent: e.target.value })}
                    className="bg-input pr-8"
                    placeholder="25"
                  />
                  <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2">%</span>
                </div>
                <p className="text-muted-foreground text-xs">{t('accountConfig.scalePercentHelp')}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-card p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-500/10 p-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h2 className="text-foreground text-xl font-semibold">{t('accountConfig.performanceTargets')}</h2>
                  <p className="text-muted-foreground text-sm">{t('accountConfig.performanceTargetsSubtitle')}</p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="roas" className="text-sm font-medium">
                    {t('accountConfig.roasLabel')}
                  </Label>
                  <Input
                    id="roas"
                    type="number"
                    step="0.1"
                    value={config.roas}
                    onChange={(e) => setConfig({ ...config, roas: e.target.value })}
                    className="bg-input"
                    placeholder="3.5"
                  />
                  <p className="text-muted-foreground text-xs">{t('accountConfig.roasHelp')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="costPerIbComment" className="text-sm font-medium">
                    {t('accountConfig.costPerEngagement')}
                  </Label>
                  <div className="relative">
                    <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">$</span>
                    <Input
                      id="costPerIbComment"
                      type="number"
                      step="0.01"
                      value={config.costPerIbComment}
                      onChange={(e) => setConfig({ ...config, costPerIbComment: e.target.value })}
                      className="bg-input pl-7"
                      placeholder="0.25"
                    />
                  </div>
                  <p className="text-muted-foreground text-xs">{t('accountConfig.costPerEngagementHelp')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpc" className="text-sm font-medium">
                    {t('accountConfig.cpcLabel')}
                  </Label>
                  <div className="relative">
                    <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">$</span>
                    <Input
                      id="cpc"
                      type="number"
                      step="0.01"
                      value={config.cpc}
                      onChange={(e) => setConfig({ ...config, cpc: e.target.value })}
                      className="bg-input pl-7"
                      placeholder="0.45"
                    />
                  </div>
                  <p className="text-muted-foreground text-xs">{t('accountConfig.cpcHelp')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpm" className="text-sm font-medium">
                    {t('accountConfig.cpmLabel')}
                  </Label>
                  <div className="relative">
                    <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">$</span>
                    <Input
                      id="cpm"
                      type="number"
                      step="0.01"
                      value={config.cpm}
                      onChange={(e) => setConfig({ ...config, cpm: e.target.value })}
                      className="bg-input pl-7"
                      placeholder="12.50"
                    />
                  </div>
                  <p className="text-muted-foreground text-xs">{t('accountConfig.cpmHelp')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ctrAll" className="text-sm font-medium">
                    {t('accountConfig.ctrAllLabel')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="ctrAll"
                      type="number"
                      step="0.1"
                      value={config.ctrAll}
                      onChange={(e) => setConfig({ ...config, ctrAll: e.target.value })}
                      className="bg-input pr-8"
                      placeholder="2.8"
                    />
                    <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2">%</span>
                  </div>
                  <p className="text-muted-foreground text-xs">{t('accountConfig.ctrAllHelp')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ctrLink" className="text-sm font-medium">
                    {t('accountConfig.ctrLinkLabel')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="ctrLink"
                      type="number"
                      step="0.1"
                      value={config.ctrLink}
                      onChange={(e) => setConfig({ ...config, ctrLink: e.target.value })}
                      className="bg-input pr-8"
                      placeholder="1.9"
                    />
                    <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2">%</span>
                  </div>
                  <p className="text-muted-foreground text-xs">{t('accountConfig.ctrLinkHelp')}</p>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="costPerPurchase" className="text-sm font-medium">
                    {t('accountConfig.costPerPurchaseLabel')}
                  </Label>
                  <div className="relative">
                    <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">$</span>
                    <Input
                      id="costPerPurchase"
                      type="number"
                      step="0.01"
                      value={config.costPerPurchase}
                      onChange={(e) => setConfig({ ...config, costPerPurchase: e.target.value })}
                      className="bg-input pl-7"
                      placeholder="15.75"
                    />
                  </div>
                  <p className="text-muted-foreground text-xs">{t('accountConfig.costPerPurchaseHelp')}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-card p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <Target className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-foreground text-xl font-semibold">{t('accountConfig.notes')}</h2>
                  <p className="text-muted-foreground text-sm">{t('accountConfig.notesSubtitle')}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Textarea
                  id="notes"
                  value={config.notes}
                  onChange={(e) => setConfig({ ...config, notes: e.target.value })}
                  className="bg-input min-h-[120px] resize-none"
                  placeholder={t('accountConfig.notesPlaceholder')}
                />
                <p className="text-muted-foreground text-xs">{t('accountConfig.notesHelp')}</p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Link to="/sync">
              <Button variant="outline">{t('accountConfig.cancel')}</Button>
            </Link>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Save className="h-4 w-4" />
              {t('accountConfig.saveSettings')}
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
