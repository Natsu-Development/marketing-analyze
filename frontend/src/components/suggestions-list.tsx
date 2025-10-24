import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Suggestion {
  id: string
  title: string
  description: string
  provider: string
  providerUrl: string
  status: 'pending' | 'approved' | 'rejected'
  impact: 'high' | 'medium' | 'low'
  currentABO: number
  scalePercent: number
  adAccount: string
  campaign: string
  adSet: string
}

export function SuggestionsList() {
  const { t } = useTranslation()

  const [suggestions, setSuggestions] = useState<Suggestion[]>([
    {
      id: '1',
      title: 'Tăng giá thầu cho từ khóa hiệu suất cao',
      description:
        'Từ khóa "cloud hosting" và "dịch vụ quản lý" cho tỷ lệ chuyển đổi cao hơn 45%. Cân nhắc tăng giá thầu 20%.',
      provider: 'Google Ads',
      providerUrl: 'https://ads.google.com/campaign/123',
      status: 'pending',
      impact: 'high',
      currentABO: 150.0,
      scalePercent: 25,
      adAccount: 'Tài Khoản Chiến Dịch Chính',
      campaign: 'Dịch Vụ Cloud Q1',
      adSet: 'Từ Khóa Ý Định Cao',
    },
    {
      id: '2',
      title: 'Tối ưu lịch chạy quảng cáo để tăng ROI',
      description:
        'Dữ liệu cho thấy 60% chuyển đổi xảy ra từ 14h-18h. Điều chỉnh phân bổ ngân sách tập trung vào khung giờ này.',
      provider: 'Facebook Ads',
      providerUrl: 'https://business.facebook.com/ads/456',
      status: 'pending',
      impact: 'medium',
      currentABO: 200.0,
      scalePercent: 30,
      adAccount: 'Tài Khoản Nhận Diện Thương Hiệu',
      campaign: 'Khuyến Mãi Mùa Xuân 2024',
      adSet: 'Đối Tượng Tương Tự 1%',
    },
    {
      id: '3',
      title: 'Thêm từ khóa loại trừ để giảm chi phí lãng phí',
      description: 'Đã xác định 12 cụm từ tìm kiếm chất lượng thấp tiêu tốn 15% ngân sách với tỷ lệ chuyển đổi 0%.',
      provider: 'Google Ads',
      providerUrl: 'https://ads.google.com/campaign/789',
      status: 'pending',
      impact: 'high',
      currentABO: 180.0,
      scalePercent: 20,
      adAccount: 'Tài Khoản Chiến Dịch Chính',
      campaign: 'Tìm Kiếm - Khớp Rộng',
      adSet: 'Từ Khóa Chung',
    },
    {
      id: '4',
      title: 'Mở rộng đối tượng mục tiêu',
      description:
        'Đối tượng tương tự cho thấy chỉ số tương tác đầy triển vọng. Thử nghiệm mở rộng để tiếp cận thêm 2.5 triệu người dùng.',
      provider: 'LinkedIn Ads',
      providerUrl: 'https://linkedin.com/campaign/321',
      status: 'pending',
      impact: 'medium',
      currentABO: 120.0,
      scalePercent: 15,
      adAccount: 'Tài Khoản Tiếp Thị Lại',
      campaign: 'Tạo Khách Hàng Tiềm Năng B2B',
      adSet: 'Người Ra Quyết Định - Công Nghệ',
    },
  ])

  const handleApprove = (id: string) => {
    setSuggestions(suggestions.map((s) => (s.id === id ? { ...s, status: 'approved' } : s)))
  }

  const handleReject = (id: string) => {
    setSuggestions(suggestions.map((s) => (s.id === id ? { ...s, status: 'rejected' } : s)))
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-500/20 text-red-600 dark:text-red-400'
      case 'medium':
        return 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
      case 'low':
        return 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
      default:
        return 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
    }
  }

  const pendingSuggestions = suggestions.filter((s) => s.status === 'pending')
  const reviewedSuggestions = suggestions.filter((s) => s.status !== 'pending')

  return (
    <div className="space-y-6">
      <Card className="bg-card p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-sm">
              {pendingSuggestions.length} {t('suggestions.pending')}
            </Badge>
          </div>

          {pendingSuggestions.length === 0 ? (
            <div className="border-border rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground text-sm">{t('suggestions.noPendingSuggestions')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="border-border bg-secondary/30 hover:bg-secondary/50 rounded-lg border p-4 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-card-foreground font-medium">{suggestion.title}</h3>
                          <Badge variant="secondary" className={getImpactColor(suggestion.impact)}>
                            {t(`suggestions.impactLevels.${suggestion.impact}`)} {t('suggestions.impact')}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">{suggestion.description}</p>
                      </div>
                    </div>

                    <div className="bg-background/50 space-y-2 rounded-md p-3">
                      <div className="grid gap-2 text-sm sm:grid-cols-3">
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground text-xs">{t('suggestions.adAccount')}</span>
                          <p className="text-foreground font-medium">{suggestion.adAccount}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground text-xs">{t('suggestions.campaign')}</span>
                          <p className="text-foreground font-medium">{suggestion.campaign}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground text-xs">{t('suggestions.adSet')}</span>
                          <p className="text-foreground font-medium">{suggestion.adSet}</p>
                        </div>
                      </div>
                      <div className="border-border flex items-center gap-4 border-t pt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs">{t('suggestions.currentABO')}</span>
                          <span className="text-foreground text-sm font-medium">
                            ${suggestion.currentABO.toFixed(2)}/day
                          </span>
                        </div>
                        <div className="bg-border h-4 w-px" />
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs">{t('suggestions.scalePercent')}</span>
                          <span className="text-foreground text-sm font-medium">{suggestion.scalePercent}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <a
                        href={suggestion.providerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-blue-500 hover:underline"
                      >
                        <span className="font-medium">{suggestion.provider}</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(suggestion.id)}
                          className="border-border gap-1.5 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                          {t('suggestions.reject')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(suggestion.id)}
                          className="gap-1.5 bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                        >
                          <Check className="h-4 w-4" />
                          {t('suggestions.approve')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {reviewedSuggestions.length > 0 && (
        <Card className="bg-card p-6">
          <div className="space-y-4">
            <h3 className="text-card-foreground text-lg font-semibold">{t('suggestions.recentlyReviewed')}</h3>
            <div className="space-y-2">
              {reviewedSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="border-border bg-secondary/30 flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${
                        suggestion.status === 'approved' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}
                    >
                      {suggestion.status === 'approved' ? (
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{suggestion.title}</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      suggestion.status === 'approved'
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                        : 'bg-red-500/20 text-red-600 dark:text-red-400'
                    }
                  >
                    {t(`suggestions.status.${suggestion.status}`)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
