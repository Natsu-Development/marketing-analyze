import { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { Navigation } from '@/components/navigation'
import Home from '@/pages/Home'
import Settings from '@/pages/Settings'
import Suggestions from '@/pages/Suggestions'
import Account from '@/pages/Account'
import AdAccountConfig from '@/pages/AdAccountConfig'

export default function App() {
  return (
    <ThemeProvider>
      <Suspense fallback={null}>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/suggestions" element={<Suggestions />} />
          <Route path="/account" element={<Account />} />
          <Route path="/ad-account-config" element={<AdAccountConfig />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  )
}
