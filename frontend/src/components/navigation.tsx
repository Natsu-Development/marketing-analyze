import { Link, useLocation } from 'react-router-dom'
import { RefreshCw, Lightbulb, Moon, Sun, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useTranslation } from 'react-i18next'

export function Navigation() {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { t } = useTranslation()

  const links = [
    { href: '/', label: t('navigation.dashboard'), icon: Home },
    { href: '/sync', label: t('navigation.adAccounts'), icon: RefreshCw },
    { href: '/suggestions', label: t('navigation.recommendations'), icon: Lightbulb },
  ]

  return (
    <nav className="border-border bg-card border-b">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-foreground text-xl font-semibold">
              {t('app.title')}
            </Link>
            <div className="flex items-center gap-1">
              {links.map((link) => {
                const Icon = link.icon
                const isActive =
                  link.href === '/'
                    ? location.pathname === '/'
                    : location.pathname === link.href || location.pathname.startsWith(link.href + '/')
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
