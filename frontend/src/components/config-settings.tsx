import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

export function ConfigSettings() {
  const { t } = useTranslation()

  const [config, setConfig] = useState({
    environment: 'production',
    apiTimeout: '30',
    maxRetries: '3',
    apiEndpoint: 'https://api.example.com',
    region: 'us-east-1',
  })

  return (
    <Card className="bg-card p-6">
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="environment" className="text-sm font-medium">
              {t('settings.environment')}
            </Label>
            <Select value={config.environment} onValueChange={(value) => setConfig({ ...config, environment: value })}>
              <SelectTrigger id="environment" className="bg-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">{t('settings.environments.development')}</SelectItem>
                <SelectItem value="staging">{t('settings.environments.staging')}</SelectItem>
                <SelectItem value="production">{t('settings.environments.production')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="region" className="text-sm font-medium">
              {t('settings.region')}
            </Label>
            <Select value={config.region} onValueChange={(value) => setConfig({ ...config, region: value })}>
              <SelectTrigger id="region" className="bg-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us-east-1">{t('settings.regions.usEast')}</SelectItem>
                <SelectItem value="us-west-2">{t('settings.regions.usWest')}</SelectItem>
                <SelectItem value="eu-west-1">{t('settings.regions.euWest')}</SelectItem>
                <SelectItem value="ap-southeast-1">{t('settings.regions.apSoutheast')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiEndpoint" className="text-sm font-medium">
              {t('settings.apiEndpoint')}
            </Label>
            <Input
              id="apiEndpoint"
              type="text"
              value={config.apiEndpoint}
              onChange={(e) => setConfig({ ...config, apiEndpoint: e.target.value })}
              className="bg-input font-mono text-sm"
              placeholder="https://api.example.com"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="apiTimeout" className="text-sm font-medium">
                {t('settings.apiTimeout')}
              </Label>
              <Input
                id="apiTimeout"
                type="number"
                value={config.apiTimeout}
                onChange={(e) => setConfig({ ...config, apiTimeout: e.target.value })}
                className="bg-input"
                min="1"
                max="300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRetries" className="text-sm font-medium">
                {t('settings.maxRetries')}
              </Label>
              <Input
                id="maxRetries"
                type="number"
                value={config.maxRetries}
                onChange={(e) => setConfig({ ...config, maxRetries: e.target.value })}
                className="bg-input"
                min="0"
                max="10"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            {t('settings.saveChanges')}
          </Button>
        </div>
      </div>
    </Card>
  )
}
