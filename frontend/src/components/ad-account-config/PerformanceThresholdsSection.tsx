import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { TrendingUp } from 'lucide-react'
import type { SettingsFormData } from '@/api'

interface PerformanceThresholdsSectionProps {
  settings: SettingsFormData
  currencySymbol: string
  onUpdateField: (field: keyof SettingsFormData, value: string) => void
}

export function PerformanceThresholdsSection({
  settings,
  currencySymbol,
  onUpdateField,
}: PerformanceThresholdsSectionProps) {
  return (
    <Card className="bg-card p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-green-500/10 p-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Performance Thresholds</h2>
            <p className="text-sm text-muted-foreground">
              Define minimum performance thresholds for scaling
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cpm" className="text-sm font-medium">
              CPM (Cost per 1K Impressions)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {currencySymbol}
              </span>
              <Input
                id="cpm"
                type="number"
                step="0.01"
                value={settings.cpm ?? ''}
                onChange={(e) => onUpdateField('cpm', e.target.value)}
                className="bg-input pl-10"
                placeholder="Enter CPM threshold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ctr" className="text-sm font-medium">
              CTR (Click Through Rate %)
            </Label>
            <div className="relative">
              <Input
                id="ctr"
                type="number"
                step="0.01"
                value={settings.ctr ?? ''}
                onChange={(e) => onUpdateField('ctr', e.target.value)}
                className="bg-input pr-8"
                placeholder="Enter CTR threshold"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency" className="text-sm font-medium">
              Frequency
            </Label>
            <Input
              id="frequency"
              type="number"
              step="0.01"
              value={settings.frequency ?? ''}
              onChange={(e) => onUpdateField('frequency', e.target.value)}
              className="bg-input"
              placeholder="Enter frequency threshold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inlineLinkCtr" className="text-sm font-medium">
              Inline Link CTR (%)
            </Label>
            <div className="relative">
              <Input
                id="inlineLinkCtr"
                type="number"
                step="0.01"
                value={settings.inlineLinkCtr ?? ''}
                onChange={(e) => onUpdateField('inlineLinkCtr', e.target.value)}
                className="bg-input pr-8"
                placeholder="Enter inline link CTR"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="costPerInlineLinkClick" className="text-sm font-medium">
              Cost Per Inline Link Click
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {currencySymbol}
              </span>
              <Input
                id="costPerInlineLinkClick"
                type="number"
                step="0.01"
                value={settings.costPerInlineLinkClick ?? ''}
                onChange={(e) => onUpdateField('costPerInlineLinkClick', e.target.value)}
                className="bg-input pl-10"
                placeholder="Enter cost threshold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseRoas" className="text-sm font-medium">
              Purchase ROAS
            </Label>
            <Input
              id="purchaseRoas"
              type="number"
              step="0.1"
              value={settings.purchaseRoas ?? ''}
              onChange={(e) => onUpdateField('purchaseRoas', e.target.value)}
              className="bg-input"
              placeholder="e.g., 2.5"
            />
            <p className="text-xs text-muted-foreground">Enter as decimal (e.g., 2.5 not 2.5x)</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
