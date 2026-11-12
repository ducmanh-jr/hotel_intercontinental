import { createContext, useContext } from 'react'

/**
 * Chế độ nguồn dữ liệu trên giao diện:
 * - 'api': Gọi trực tiếp tới Backend thật qua shared/api/http.ts (/api/v1/...).
 * - 'mock': Hiển thị dữ liệu mẫu (Mock Preview) phục vụ kiểm thử UI khi Backend chưa mở endpoint.
 *   Không lưu token/secret; ghi rõ trạng thái Mock trên giao diện theo quy tắc dự án.
 */
export type DataSourceMode = 'api' | 'mock'

export interface DataModeContextValue {
  mode: DataSourceMode
  setMode: (mode: DataSourceMode) => void
}

export const DataModeContext = createContext<DataModeContextValue>({
  mode: 'api',
  setMode: () => undefined,
})

export function useDataMode() {
  return useContext(DataModeContext)
}
