import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { apply } from "@richaadgigi/stylexui"
import "@richaadgigi/stylexui/css/xui.css"
import "./assets/css/style.css"
import { BrowserRouter } from 'react-router'
import { GeneralProvider } from './context/GeneralContext'

apply()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <GeneralProvider>
        <App />
      </GeneralProvider>
    </BrowserRouter>
  </StrictMode>,
)
