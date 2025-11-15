interface CurrencyFormatOptions {
  locale?: string
  abbreviated?: boolean
  showSymbol?: boolean
}

function getCurrencyLocale(currencyCode: string): string {
  const localeMap: Record<string, string> = {
    VND: 'vi-VN',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    JPY: 'ja-JP',
    KRW: 'ko-KR',
  }
  return localeMap[currencyCode] || 'en-US'
}

export function formatCurrency(
  amount: number,
  currencyCode: string,
  options?: CurrencyFormatOptions
): string {
  const defaultLocale = getCurrencyLocale(currencyCode)
  const { locale = defaultLocale, abbreviated = false, showSymbol = true } = options || {}

  if (abbreviated && Math.abs(amount) >= 1000000) {
    const millions = amount / 1000000
    const formatted = millions.toFixed(1)
    const symbol = showSymbol ? getCurrencySymbol(currencyCode) : ''
    return `${formatted}M ${symbol}`.trim()
  }

  try {
    const decimalPlaces = getDecimalPlaces(currencyCode)

    return new Intl.NumberFormat(locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: currencyCode,
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(amount)
  } catch {
    return `${amount} ${currencyCode}`
  }
}

export function formatCurrencyInput(value: string): number | null {
  const cleaned = value.replace(/[^0-9.-]/g, '')
  const parsed = parseFloat(cleaned)

  if (isNaN(parsed)) {
    return null
  }

  return parsed
}

export function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    VND: '₫',
    USD: '$',
    EUR: '€',
  }

  return symbols[currencyCode] || currencyCode
}

export function getDecimalPlaces(currencyCode: string): number {
  const zeroDecimalCurrencies = ['VND', 'JPY', 'KRW']
  return zeroDecimalCurrencies.includes(currencyCode) ? 0 : 2
}
