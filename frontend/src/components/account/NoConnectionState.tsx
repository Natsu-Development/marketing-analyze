import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Facebook } from 'lucide-react'

interface NoConnectionStateProps {
  onConnect: () => void
}

export function NoConnectionState({ onConnect }: NoConnectionStateProps) {
  return (
    <Card className="bg-card p-12">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-blue-500/10 p-4">
          <Facebook className="h-12 w-12 text-blue-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">No Facebook Connection</h3>
          <p className="text-sm text-muted-foreground">
            Connect your Facebook account to sync ad accounts and campaigns
          </p>
        </div>
        <Button onClick={onConnect} className="gap-2">
          <Facebook className="h-4 w-4" />
          Connect Facebook
        </Button>
      </div>
    </Card>
  )
}
