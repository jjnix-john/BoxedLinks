import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './app/App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#e8edf4',
          color: '#273043',
          border: 'none',
          borderRadius: '16px',
          padding: '12px 16px',
          boxShadow: '8px 8px 18px rgba(158,172,196,0.55), -8px -8px 18px rgba(255,255,255,0.95)',
          fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
          fontWeight: 600,
          fontSize: '14px',
        },
        success: {
          iconTheme: { primary: '#1fbfb0', secondary: '#ffffff' },
        },
        error: {
          iconTheme: { primary: '#ef4f73', secondary: '#ffffff' },
        },
      }}
    />
  </React.StrictMode>,
)
