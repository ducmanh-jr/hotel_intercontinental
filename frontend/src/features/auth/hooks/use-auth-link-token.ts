import { useEffect, useState } from 'react'
import { readAuthLinkToken } from '../model/auth-link-token'

export function useAuthLinkToken() {
  const [token] = useState(() => typeof window === 'undefined' ? '' : readAuthLinkToken(window.location.href).token)
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.has('token')) {
      const { cleanPath } = readAuthLinkToken(url.href)
      window.history.replaceState(window.history.state, '', cleanPath)
    }
  }, [])
  return token
}
