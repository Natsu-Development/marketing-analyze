import { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { Navigation } from '@/components/navigation'
import Home from '@/pages/Home'
import Settings from '@/pages/Settings'
import Suggestions from '@/pages/Suggestions'
import Sync from '@/pages/Sync'
import AccountConfig from '@/pages/AccountConfig'

export default function App() {
  return (
    <ThemeProvider>
      <Suspense fallback={null}>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/suggestions" element={<Suggestions />} />
          <Route path="/sync" element={<Sync />} />
          <Route path="/sync/:accountId" element={<AccountConfig />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  )
}
