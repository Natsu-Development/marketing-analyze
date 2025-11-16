import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export function LoadingState() {
  return (
    <Card className="bg-card p-12">
      <div className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </Card>
  )
}
