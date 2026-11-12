/**
 * Validates and sanitizes a return URL to prevent Open Redirect vulnerabilities.
 * Only allows relative internal application paths (e.g. `/admin/users`).
 */
export function sanitizeReturnTo(url: unknown): string | null {
  if (typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null

  // Must start with exactly one forward slash, not double-slash or backslash
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return null
  }

  // Disallow colon before question mark (e.g. protocol bypasses like '/javascript:...')
  const pathPart = trimmed.split('?')[0].split('#')[0]
  if (pathPart.includes(':') || pathPart.includes('\\')) {
    return null
  }

  // URL parsing check with dummy origin
  try {
    const parsed = new URL(trimmed, 'https://stayhub.internal')
    if (parsed.origin !== 'https://stayhub.internal') return null
    return parsed.pathname + parsed.search + parsed.hash
  } catch {
    return null
  }
}

