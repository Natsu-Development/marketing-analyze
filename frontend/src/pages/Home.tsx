import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Target, Calendar, Clock, StopCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ScaledAdSet {
  id: string
  name: string
  accountName: string
  accountId: string
  platform: string
  scaledAt: string
  totalScaleSpend: number
  scalePercentSetting: number
  totalSpend: number
  scaleStoppedAt: string | null
  status: 'active' | 'paused' | 'stopped'
  roas: number
}

const mockScaledAdSets: ScaledAdSet[] = [
  {
    id: 'adset-1',
    name: 'Chiến Dịch Mùa Hè - Đối Tượng Tương Tự',
    accountName: 'Tài Khoản Chiến Dịch Chính',
    accountId: 'fb-1',
    platform: 'Facebook',
    scaledAt: '2025-01-10 14:30',
    totalScaleSpend: 1200,
    scalePercentSetting: 25,
    totalSpend: 3700,
    scaleStoppedAt: null,
    status: 'active',
    roas: 4.2,
  },
  {
    id: 'adset-2',
    name: 'Tiếp Thị Lại - Giỏ Hàng Bỏ Quên',
    accountName: 'Tài Khoản Chiến Dịch Chính',
    accountId: 'fb-1',
    platform: 'Facebook',
    scaledAt: '2025-01-09 10:15',
    totalScaleSpend: 900,
    scalePercentSetting: 20,
    totalSpend: 2700,
    scaleStoppedAt: null,
    status: 'active',
    roas: 5.1,
  },
  {
    id: 'adset-3',
    name: 'Nhận Diện Thương Hiệu - Chiến Dịch Video',
    accountName: 'Tài Khoản Nhận Diện Thương Hiệu',
    accountId: 'fb-2',
    platform: 'Facebook',
    scaledAt: '2025-01-08 16:45',
    totalScaleSpend: 1500,
    scalePercentSetting: 30,
    totalSpend: 4700,
    scaleStoppedAt: null,
    status: 'active',
    roas: 3.8,
  },
  {
    id: 'adset-4',
    name: 'Ra Mắt Sản Phẩm - Nhắm Mục Tiêu Sở Thích',
    accountName: 'Tài Khoản Tiếp Thị Lại',
    accountId: 'fb-3',
    platform: 'Facebook',
    scaledAt: '2025-01-07 09:20',
    totalScaleSpend: 800,
    scalePercentSetting: 20,
    totalSpend: 2900,
    scaleStoppedAt: '2025-01-09 18:30',
    status: 'stopped',
    roas: 2.9,
  },
  {
    id: 'adset-5',
    name: 'Đặc Biệt Ngày Lễ - Đối Tượng Rộng',
    accountName: 'Tài Khoản Nhận Diện Thương Hiệu',
    accountId: 'fb-2',
    platform: 'Facebook',
    scaledAt: '2025-01-06 11:00',
    totalScaleSpend: 2000,
    scalePercentSetting: 35,
    totalSpend: 6000,
    scaleStoppedAt: null,
    status: 'paused',
    roas: 3.5,
  },
]

export default function Home() {
  const { t } = useTranslation()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-600 dark:text-green-400'
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
      case 'stopped':
        return 'bg-red-500/20 text-red-600 dark:text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
    }
  }

  const getRoasColor = (roas: number) => {
    if (roas >= 4) return 'text-green-600 dark:text-green-400'
    if (roas >= 3) return 'text-blue-600 dark:text-blue-400'
    return 'text-orange-600 dark:text-orange-400'
  }

  const totalScaleSpend = mockScaledAdSets.reduce((sum, adset) => sum + adset.totalScaleSpend, 0)
  const activeAdSets = mockScaledAdSets.filter((adset) => adset.status === 'active').length
  const stoppedAdSets = mockScaledAdSets.filter((adset) => adset.status === 'stopped').length

  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-foreground text-4xl font-semibold tracking-tight">{t('home.title')}</h1>
            <p className="text-muted-foreground text-lg">{t('home.subtitle')}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">{t('home.activeScaling')}</p>
                  <p className="text-foreground text-2xl font-semibold">{activeAdSets}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-purple-500/10 p-3">
                  <Target className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">{t('home.scaleBudgetUsed')}</p>
                  <p className="text-foreground text-2xl font-semibold">${totalScaleSpend.toLocaleString()}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-red-500/10 p-3">
                  <StopCircle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">{t('home.stoppedScaling')}</p>
                  <p className="text-foreground text-2xl font-semibold">{stoppedAdSets}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="bg-card">
            <div className="border-border border-b p-6">
              <h2 className="text-foreground text-xl font-semibold">{t('home.activeAdSets')}</h2>
              <p className="text-muted-foreground text-sm">{t('home.activeAdSetsSubtitle')}</p>
            </div>
            <div className="divide-border divide-y">
              {mockScaledAdSets.map((adset) => (
                <div key={adset.id} className="hover:bg-accent/50 p-6 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-foreground text-lg font-semibold">{adset.name}</h3>
                            <Badge variant="secondary" className={getStatusColor(adset.status)}>
                              {t(`home.status.${adset.status}`)}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground flex items-center gap-3 text-sm">
                            <span>{adset.accountName}</span>
                            <span>•</span>
                            <span>{adset.platform}</span>
                          </div>
                        </div>
                        <Link to={`/sync/${adset.accountId}`}>
                          <Button variant="outline" size="sm">
                            {t('home.viewSettings')}
                          </Button>
                        </Link>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="text-muted-foreground h-3 w-3" />
                            <p className="text-muted-foreground text-xs">{t('home.scaledAt')}</p>
                          </div>
                          <p className="text-foreground text-sm font-medium">{adset.scaledAt}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs">{t('home.scaleSpend')}</p>
                          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                            ${adset.totalScaleSpend.toLocaleString()}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs">{t('home.scalePercent')}</p>
                          <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                            {adset.scalePercentSetting}%
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Clock className="text-muted-foreground h-3 w-3" />
                            <p className="text-muted-foreground text-xs">{t('home.stoppedAt')}</p>
                          </div>
                          <p className="text-foreground text-sm font-medium">
                            {adset.scaleStoppedAt || <span className="text-muted-foreground">—</span>}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs">{t('home.roas')}</p>
                          <p className={`text-lg font-semibold ${getRoasColor(adset.roas)}`}>
                            {adset.roas.toFixed(1)}x
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}
