import { useContext } from 'react'
import {
  ClientHomeContext,
  type ClientHomeContextValue,
} from '../context/client-home-context-def'

export function useClientHomeContext(): ClientHomeContextValue {
  const context = useContext(ClientHomeContext)
  if (!context) {
    throw new Error('useClientHomeContext must be used within a ClientHomeProvider')
  }
  return context
}
