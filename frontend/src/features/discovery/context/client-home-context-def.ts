import { createContext } from 'react'
import type { useClientHome } from '../hooks/use-client-home'

export type ClientHomeContextValue = ReturnType<typeof useClientHome>

export const ClientHomeContext = createContext<ClientHomeContextValue | null>(null)
