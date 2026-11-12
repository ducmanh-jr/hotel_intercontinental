import { useState, type ReactNode } from 'react'
import { DataModeContext, type DataSourceMode } from './data-mode-context'

export function DataModeProvider({
  children,
  initialMode = 'api',
}: {
  children: ReactNode
  initialMode?: DataSourceMode
}) {
  const [mode, setMode] = useState<DataSourceMode>(initialMode)
  return (
    <DataModeContext.Provider value={{ mode, setMode }}>
      {children}
    </DataModeContext.Provider>
  )
}
