import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/global.css'
import App from './App'
import './test-directus'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
