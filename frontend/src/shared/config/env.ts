import { parsePublicEnv } from './env-schema'

export const env = parsePublicEnv(import.meta.env)
