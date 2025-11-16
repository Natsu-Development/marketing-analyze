import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Facebook } from 'lucide-react'
import type { AccountStatus } from '@/api'

interface ConnectionCardProps {
  status: AccountStatus
  onDisconnect: () => void
}

export function ConnectionCard({ status, onDisconnect }: ConnectionCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-500/10 p-2">
          <Facebook className="h-5 w-5 text-blue-500" />
        </div>
        <div className="space-y-0.5">
          <Label className="text-base font-semibold">Facebook Connection</Label>
          <p className="text-sm text-muted-foreground">Status: {status}</p>
        </div>
      </div>
      <Button onClick={onDisconnect} variant="outline" size="sm">
        Disconnect
      </Button>
    </div>
  )
}
