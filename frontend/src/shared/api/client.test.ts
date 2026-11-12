import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createHttpClient } from './client'
import { ApiError } from './api-error'

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } })
}
function setup(response: Response) {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response)
  const client = createHttpClient({ baseUrl: '/api/v1', timeoutMs: 10_000, fetcher })
  return { client, fetcher }
}

afterEach(() => vi.useRealTimers())

describe('shared HTTP client', () => {
  it('uses the common API prefix and unwraps the actual BE envelope', async () => {
    const { client, fetcher } = setup(json({ message: 'Thành công.', data: { id: '1' } }))
    await expect(client.request('/hotels')).resolves.toEqual({ id: '1' })
    expect(fetcher.mock.calls[0][0]).toBe('/api/v1/hotels')
    expect(fetcher.mock.calls[0][1]?.credentials).toBe('same-origin')
  })
  it.each([null, false, 0])('does not reject a valid falsy data value: %s', async (data) => {
    const { client } = setup(json({ message: 'Thành công.', data }))
    await expect(client.request('/sample')).resolves.toBe(data)
  })
  it('handles HTTP 204 without trying to parse JSON', async () => {
    const { client } = setup(new Response(null, { status: 204 }))
    await expect(client.request<void>('/sample', { method: 'DELETE' })).resolves.toBeUndefined()
  })
  it('preserves BE ProblemDetail code, trace ID and field errors', async () => {
    const { client } = setup(json({
      detail: 'Email không hợp lệ.', code: 'VALIDATION_FAILED', traceId: 'trace-1',
      errors: [{ field: 'email', message: 'Sai định dạng.' }],
    }, 400))
    await expect(client.request('/sample')).rejects.toMatchObject({
      name: 'ApiError', status: 400, code: 'VALIDATION_FAILED', traceId: 'trace-1',
      errors: [{ field: 'email', message: 'Sai định dạng.' }],
    })
  })
  it.each([401, 403])('does not silently retry or fabricate a session for HTTP %s', async (status) => {
    const { client, fetcher } = setup(json({}, status))
    await expect(client.request('/sample')).rejects.toMatchObject({ kind: 'http', status })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('does not expose an unexpected server error detail', async () => {
    const { client } = setup(json({ detail: 'internal database password' }, 500))
    await expect(client.request('/sample')).rejects.not.toHaveProperty('message', 'internal database password')
  })
  it('supports the real raw Actuator endpoint without an envelope', async () => {
    const { client, fetcher } = setup(json({ status: 'UP' }))
    await expect(client.requestRaw('/actuator/health', {
      schema: z.object({ status: z.string() }),
    })).resolves.toEqual({ status: 'UP' })
    expect(fetcher.mock.calls[0][0]).toBe('/actuator/health')
  })
  it('rejects an HTML fallback returned with HTTP 200', async () => {
    const { client } = setup(new Response('<html>SPA fallback</html>'))
    await expect(client.request('/sample')).rejects.toMatchObject({ kind: 'invalid-response' })
  })
  it('validates API data at the feature boundary when a schema is supplied', async () => {
    const { client } = setup(json({ message: 'ok', data: { id: 123 } }))
    await expect(client.request('/sample', { schema: z.object({ id: z.string() }) }))
      .rejects.toMatchObject({ kind: 'invalid-response' })
  })
  it('does not force JSON headers on FormData', async () => {
    const { client, fetcher } = setup(json({ message: 'ok', data: null }))
    const body = new FormData()
    body.set('caption', 'Ảnh khách sạn')
    await client.request('/media', { method: 'POST', body })
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).has('Content-Type')).toBe(false)
    expect(fetcher.mock.calls[0][1]?.body).toBe(body)
  })
  it('normalizes a network failure', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'))
    const client = createHttpClient({ baseUrl: '/api/v1', timeoutMs: 100, fetcher })
    await expect(client.request('/sample')).rejects.toMatchObject({ kind: 'network', status: 0 })
  })
  it('distinguishes timeout from a server response', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn<typeof fetch>().mockImplementation((_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      }))
    const client = createHttpClient({ baseUrl: '/api/v1', timeoutMs: 20, fetcher })
    const assertion = expect(client.request('/sample')).rejects.toMatchObject({ kind: 'timeout' })
    await vi.advanceTimersByTimeAsync(25)
    await assertion
  })
  it('preserves caller cancellation rather than showing a network error', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation((_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      }))
    const client = createHttpClient({ baseUrl: '/api/v1', timeoutMs: 10_000, fetcher })
    const controller = new AbortController()
    const assertion = expect(client.request('/sample', { signal: controller.signal }))
      .rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()
    await assertion
  })
  it('rejects an external URL before sending credentials', async () => {
    const { client, fetcher } = setup(json({}))
    await expect(client.request('https://external.example')).rejects.toThrow()
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('returns an Error instance that a shared UI can recognize', async () => {
    const { client } = setup(json({}, 404))
    try {
      await client.request('/sample')
      throw new Error('Expected a request failure')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
    }
  })

  it('sends X-Requested-With header on requests', async () => {
    const { client, fetcher } = setup(json({ message: 'ok', data: true }))
    await client.request('/sample')
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).get('X-Requested-With')).toBe('XMLHttpRequest')
  })

  it('retries once with refreshed token when receiving 401 on non-auth endpoint', async () => {
    let callCount = 0
    let currentToken = 'old-token'
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => {
      callCount++
      if (callCount === 1) {
        return json({ detail: 'Token expired', code: 'UNAUTHORIZED' }, 401)
      }
      return json({ message: 'ok', data: { success: true } }, 200)
    })
    const onRefreshToken = vi.fn().mockImplementation(async () => {
      currentToken = 'new-token'
      return 'new-token'
    })
    const client = createHttpClient({
      baseUrl: '/api/v1',
      timeoutMs: 10_000,
      fetcher,
      getAccessToken: () => currentToken,
      onRefreshToken,
    })

    const result = await client.request('/hotels')
    expect(result).toEqual({ success: true })
    expect(onRefreshToken).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(new Headers(fetcher.mock.calls[1][1]?.headers).get('Authorization')).toBe('Bearer new-token')
  })

  it('does not retry 401 on auth endpoints', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ detail: 'Invalid' }, 401))
    const onRefreshToken = vi.fn().mockResolvedValue('new-token')
    const client = createHttpClient({
      baseUrl: '/api/v1',
      timeoutMs: 10_000,
      fetcher,
      onRefreshToken,
    })

    await expect(client.request('/auth/refresh')).rejects.toMatchObject({ status: 401 })
    expect(onRefreshToken).not.toHaveBeenCalled()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
