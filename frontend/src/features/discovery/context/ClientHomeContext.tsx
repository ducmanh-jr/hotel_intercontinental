import React from 'react'
import { useClientHome } from '../hooks/use-client-home'
import { ClientHomeContext } from './client-home-context-def'

export function ClientHomeProvider({ children }: { children: React.ReactNode }) {
  const value = useClientHome()
  return (
    <ClientHomeContext.Provider value={value}>
      {children}
    </ClientHomeContext.Provider>
  )
}
