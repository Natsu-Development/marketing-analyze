import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Settings } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { AdAccount } from '@/api'

interface AdAccountCardProps {
  adAccount: AdAccount
  onToggle: (adAccountId: string, currentActive: boolean) => void
  isToggling: boolean
}

export function AdAccountCard({ adAccount, onToggle, isToggling }: AdAccountCardProps) {
  const formatLastSync = (timestamp: string | null): string => {
    if (!timestamp) return 'Never'

    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  const getStatusBadge = () => {
    if (!adAccount.isActive) {
      return (
        <Badge variant="secondary" className="bg-gray-500/20 text-gray-600 dark:text-gray-400">
          Inactive
        </Badge>
      )
    }

    return (
      <Badge variant="secondary" className="bg-green-500/20 text-green-600 dark:text-green-400">
        Active
      </Badge>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4 transition-colors hover:bg-secondary/50">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`mt-1 h-2 w-2 rounded-full ${
                adAccount.isActive ? 'bg-green-500' : 'bg-muted-foreground/30'
              }`}
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-card-foreground">{adAccount.name}</h3>
                {getStatusBadge()}
                <Badge variant="outline">{adAccount.currency}</Badge>
              </div>
              <p className="font-mono text-sm text-muted-foreground">{adAccount.adAccountId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/ad-account-config?adAccountId=${adAccount.adAccountId}`}>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
            <Switch
              checked={adAccount.isActive}
              onCheckedChange={() => onToggle(adAccount.adAccountId, adAccount.isActive)}
              disabled={isToggling}
            />
          </div>
        </div>

        <div className="ml-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Last Insight Sync</p>
            <p className="text-sm font-medium text-foreground">
              {formatLastSync(adAccount.lastSyncInsight)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Last Metadata Sync</p>
            <p className="text-sm font-medium text-foreground">
              {formatLastSync(adAccount.lastSyncAdSet)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
