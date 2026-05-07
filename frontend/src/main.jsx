// Main entry point — mounts the app and adds a 30-minute idle session timeout.
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { logout } from './services/authService'
import './styles/global.css'

const IDLE_TIMEOUT_MS = 30 * 60 * 1000

// Watches for user inactivity and logs out after IDLE_TIMEOUT_MS of no interaction.
function SessionExpiryWatcher() {
  React.useEffect(() => {
    let timerId

    const resetTimer = () => {
      window.clearTimeout(timerId)
      timerId = window.setTimeout(() => {
        if (sessionStorage.getItem('adminToken')) {
          logout()
        }
      }, IDLE_TIMEOUT_MS)
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach((eventName) => window.addEventListener(eventName, resetTimer))
    resetTimer()

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer))
      window.clearTimeout(timerId)
    }
  }, [])

  return null
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 0,
      refetchOnWindowFocus: true,
      refetchInterval: 30000,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SessionExpiryWatcher />
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
