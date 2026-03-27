import React from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './app/context/ThemeContext'
import { AuthProvider } from './app/context/AuthContext'
import { AppProvider } from './app/context/AppContext'
import { MenubarWidget } from './app/pages/MenubarWidget'
import { Toaster } from './app/components/ui/sonner'
import './styles/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              <MenubarWidget />
              <Toaster position="bottom-right" />
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  </React.StrictMode>
)