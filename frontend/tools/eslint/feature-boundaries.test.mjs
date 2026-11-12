import { describe, expect, it } from 'vitest'
import { ESLint } from 'eslint'

const eslint = new ESLint()

describe('frontend import boundaries', () => {
  it.each([
    ['src/shared/lib/probe.ts', '@/features/auth', true],
    ['src/shared/lib/probe.ts', '../../features/auth', true],
    ['src/features/auth/hooks/probe.ts', '@/pages/auth/LoginPage', true],
    ['src/pages/admin/probe.tsx', '@/features/auth/hooks/use-session', true],
    ['src/pages/admin/probe.tsx', '../../features/auth/hooks/use-session', true],
    ['src/features/live-api/components/probe.tsx', '../../auth/hooks/use-session', true],
    ['src/features/auth/components/probe.tsx', '../hooks/use-session', false],
    ['src/pages/auth/probe.tsx', '@/features/auth', false],
    ['src/pages/auth/probe.tsx', '../../features/auth/index', false],
  ])('checks %s importing %s', async (filePath, specifier, blocked) => {
    const [result] = await eslint.lintText(`import { example } from '${specifier}'; export { example };`, { filePath })
    const rejected = result.messages.some((message) =>
      message.ruleId === 'no-restricted-imports' || message.ruleId === 'architecture/feature-boundaries')
    expect(rejected).toBe(blocked)
  }, 20000)
})
