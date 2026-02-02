import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './auth/AuthContext'
import { App } from './components/App'
import { SharedPatternView } from './components/Share'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/p/:shareSlug" element={<SharedPatternView />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
