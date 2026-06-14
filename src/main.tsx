import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'
import { registerServiceWorker } from '@/lib/push'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Register the push service worker once the page has loaded
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerServiceWorker()
  })
}
