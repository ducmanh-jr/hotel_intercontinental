import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { App as AntApp, ConfigProvider } from 'antd'
import viVN from 'antd/locale/vi_VN'
import { DataModeProvider } from '@/shared/lib/data-mode'
import { queryClient } from '@/shared/lib/query-client'
import { AppErrorBoundary } from '@/shared/ui/AppErrorBoundary'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#006A6A',
          colorInfo: '#4B607C',
          colorSuccess: '#0D6B40',
          colorWarning: '#8A5A00',
          colorError: '#BA1A1A',
          colorText: '#191C1C',
          colorTextSecondary: '#3F4948',
          colorBgLayout: '#F4FBFB',
          colorBgContainer: '#FFFFFF',
          colorBorder: '#BEC9C8',
          borderRadius: 8,
          borderRadiusLG: 16,
          controlHeight: 40,
          fontFamily:
            "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        components: {
          Button: {
            fontWeight: 600,
            borderRadius: 9999,
          },
          Card: {
            borderRadiusLG: 16,
            colorBorderSecondary: '#E2E9E9',
          },
          Tabs: {
            inkBarColor: '#006A6A',
            itemSelectedColor: '#006A6A',
            itemHoverColor: '#005050',
          },
          Table: {
            headerBg: '#EEF5F5',
            headerColor: '#191C1C',
            borderColor: '#BEC9C8',
          },
        },
      }}
    >
      <AntApp>
        <AppErrorBoundary>
          <DataModeProvider>
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          </DataModeProvider>
        </AppErrorBoundary>
      </AntApp>
    </ConfigProvider>
  )
}
