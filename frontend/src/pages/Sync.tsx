import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Facebook, Plus, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface AdAccount {
  id: string
  name: string
  accountId: string
  enabled: boolean
  spendLimit: number
  timeRange: string
  lastSync: string
  status: 'active' | 'paused' | 'error'
}

interface Platform {
  id: string
  name: string
  icon: typeof Facebook
  enabled: boolean
  accounts: AdAccount[]
}

export default function Sync() {
  const { t } = useTranslation()

  const [platforms, setPlatforms] = useState<Platform[]>([
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      enabled: true,
      accounts: [
        {
          id: 'fb-1',
          name: 'Tài Khoản Chiến Dịch Chính',
          accountId: 'act_123456789',
          enabled: true,
          spendLimit: 5000,
          timeRange: 'daily',
          lastSync: '2 phút trước',
          status: 'active',
        },
        {
          id: 'fb-2',
          name: 'Tài Khoản Nhận Diện Thương Hiệu',
          accountId: 'act_987654321',
          enabled: true,
          spendLimit: 3000,
          timeRange: 'daily',
          lastSync: '5 phút trước',
          status: 'active',
        },
        {
          id: 'fb-3',
          name: 'Tài Khoản Tiếp Thị Lại',
          accountId: 'act_456789123',
          enabled: false,
          spendLimit: 2000,
          timeRange: 'daily',
          lastSync: '1 giờ trước',
          status: 'paused',
        },
      ],
    },
  ])

  const togglePlatform = (platformId: string) => {
    setPlatforms(platforms.map((p) => (p.id === platformId ? { ...p, enabled: !p.enabled } : p)))
  }

  const toggleAccount = (platformId: string, accountId: string) => {
    setPlatforms(
      platforms.map((p) =>
        p.id === platformId
          ? {
              ...p,
              accounts: p.accounts.map((acc) =>
                acc.id === accountId
                  ? { ...acc, enabled: !acc.enabled, status: !acc.enabled ? 'active' : 'paused' }
                  : acc
              ),
            }
          : p
      )
    )
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

  return (
    <main className="bg-background min-h-screen p-6 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-foreground text-3xl font-semibold tracking-tight">{t('sync.title')}</h1>
          <p className="text-muted-foreground">{t('sync.subtitle')}</p>
        </div>

        <div className="space-y-6">
          {platforms.map((platform) => {
            const Icon = platform.icon
            return (
              <Card key={platform.id} className="bg-card p-6">
                <div className="space-y-6">
                  <div className="border-border bg-secondary/50 flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-500/10 p-2">
                        <Icon className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="space-y-0.5">
                        <Label htmlFor={`platform-${platform.id}`} className="text-base font-semibold">
                          {t('sync.platformSync', { platform: platform.name })}
                        </Label>
                        <p className="text-muted-foreground text-sm">
                          {t('sync.turnOnOffSync', { platform: platform.name })}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={`platform-${platform.id}`}
                      checked={platform.enabled}
                      onCheckedChange={() => togglePlatform(platform.id)}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{t('sync.adAccounts')}</Label>
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                        <Plus className="h-4 w-4" />
                        {t('sync.addAccount')}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {platform.accounts.map((account) => (
                        <div
                          key={account.id}
                          className="border-border bg-secondary/30 hover:bg-secondary/50 rounded-lg border p-4 transition-colors"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div
                                  className={`mt-1 h-2 w-2 rounded-full ${
                                    account.enabled && platform.enabled ? 'bg-green-500' : 'bg-muted-foreground/30'
                                  }`}
                                />
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-card-foreground font-medium">{account.name}</h3>
                                    <Badge variant="secondary" className={getStatusColor(account.status)}>
                                      {t(`sync.status.${account.status}`)}
                                    </Badge>
                                  </div>
                                  <p className="text-muted-foreground font-mono text-sm">{account.accountId}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Link to={`/sync/${account.id}`}>
                                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                                    <Settings className="h-4 w-4" />
                                    {t('sync.settings')}
                                  </Button>
                                </Link>
                                <Switch
                                  checked={account.enabled}
                                  onCheckedChange={() => toggleAccount(platform.id, account.id)}
                                  disabled={!platform.enabled}
                                />
                              </div>
                            </div>

                            <div className="ml-5 grid gap-4 sm:grid-cols-3">
                              <div className="space-y-1">
                                <p className="text-muted-foreground text-xs">{t('sync.spendLimit')}</p>
                                <p className="text-foreground text-sm font-medium">
                                  ${account.spendLimit.toLocaleString()} / {t('sync.daily')}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground text-xs">{t('sync.timeRange')}</p>
                                <p className="text-foreground text-sm font-medium capitalize">{account.timeRange}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground text-xs">{t('sync.lastSync')}</p>
                                <p className="text-foreground text-sm font-medium">{account.lastSync}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}

          <Card className="bg-card p-6">
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
              <div className="bg-secondary rounded-full p-4">
                <Plus className="text-muted-foreground h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-card-foreground text-lg font-semibold">{t('sync.addMorePlatforms')}</h3>
                <p className="text-muted-foreground text-sm">{t('sync.addMorePlatformsSubtitle')}</p>
              </div>
              <Button variant="outline">{t('sync.connectPlatform')}</Button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}
