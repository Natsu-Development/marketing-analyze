import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Zap } from 'lucide-react'
import type { SettingsFormData } from '@/api'

interface ScalingConfigSectionProps {
  settings: SettingsFormData
  onUpdateField: (field: keyof SettingsFormData, value: string) => void
}

export function ScalingConfigSection({ settings, onUpdateField }: ScalingConfigSectionProps) {
  return (
    <Card className="bg-card p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/10 p-2">
            <Zap className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Scaling Configuration</h2>
            <p className="text-sm text-muted-foreground">Configure how and when to scale budgets</p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="scalePercent" className="text-sm font-medium">
              Scale Percent (%)
            </Label>
            <div className="relative">
              <Input
                id="scalePercent"
                type="number"
                step="1"
                min="0"
                max="100"
                value={settings.scalePercent ?? ''}
                onChange={(e) => onUpdateField('scalePercent', e.target.value)}
                className="bg-input pr-8"
                placeholder="e.g., 20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Budget increase percentage</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initScaleDay" className="text-sm font-medium">
              Initial Scale Day
            </Label>
            <Input
              id="initScaleDay"
              type="number"
              step="1"
              min="1"
              value={settings.initScaleDay ?? ''}
              onChange={(e) => onUpdateField('initScaleDay', e.target.value)}
              className="bg-input"
              placeholder="e.g., 3"
            />
            <p className="text-xs text-muted-foreground">
              Days before first scale (from start time)
            </p>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="recurScaleDay" className="text-sm font-medium">
              Recurring Scale Day
            </Label>
            <Input
              id="recurScaleDay"
              type="number"
              step="1"
              min="1"
              value={settings.recurScaleDay ?? ''}
              onChange={(e) => onUpdateField('recurScaleDay', e.target.value)}
              className="bg-input"
              placeholder="e.g., 7"
            />
            <p className="text-xs text-muted-foreground">
              Days between scales (from last scaled time)
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
