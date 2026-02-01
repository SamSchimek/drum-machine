import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { App } from './components/App'
import { SharedPatternView } from './components/Share'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/p/:shareSlug" element={<SharedPatternView />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
