import { useTranslation } from 'react-i18next'
import { Globe, Check } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng)
  }

  const languages = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ]

  const currentLanguage = i18n.language || 'vi'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Change language"
      >
        <Globe className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48" sideOffset={8}>
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onSelect={() => changeLanguage(language.code)}
            className="flex cursor-pointer items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span>{language.flag}</span>
              <span>{language.name}</span>
            </div>
            {currentLanguage === language.code && <Check className="text-primary h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
