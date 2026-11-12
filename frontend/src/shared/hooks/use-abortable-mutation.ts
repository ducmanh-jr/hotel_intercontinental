import { useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'

/** Transient form requests: abort on replacement/unmount and do not cache credentials. */
export function useAbortableMutation<TValues, TResult>(
  mutationKey: readonly unknown[],
  execute: (values: TValues, signal: AbortSignal) => Promise<TResult>,
) {
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])
  return useMutation({
    mutationKey,
    retry: false,
    gcTime: 0,
    mutationFn: (values: TValues) => {
      controller.current?.abort()
      controller.current = new AbortController()
      return execute(values, controller.current.signal)
    },
  })
}
