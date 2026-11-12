export function readAuthLinkToken(href: string) {
  const url = new URL(href)
  const token = url.searchParams.get('token') ?? ''
  url.searchParams.delete('token')
  return { token, cleanPath: url.pathname + url.search + url.hash }
}
