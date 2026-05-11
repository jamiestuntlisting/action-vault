import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env.local")
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorPrimary: '#e50914',
          colorBackground: '#141414',
          colorText: '#fff',
          colorInputBackground: '#0e0e0e',
          colorInputText: '#fff',
          fontFamily: 'Barlow, sans-serif',
        }
      }}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
)
