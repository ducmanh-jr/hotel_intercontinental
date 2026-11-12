import path from 'node:path'
import { fileURLToPath } from 'node:url'

const sourceRoot = fileURLToPath(new URL('../../src/', import.meta.url))

function segments(absolutePath) {
  return path.relative(sourceRoot, absolutePath).split(path.sep)
}

/** Resolve imports before checking ownership, so aliases and relative paths behave alike. */
export const featureBoundaries = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      upward: 'Shared and feature code must not depend on upper layers: {{source}}.',
      private: 'Import {{feature}} through its public interface @/features/{{feature}}.',
    },
  },
  create(context) {
    const filename = context.filename
    const owner = segments(filename)

    function check(node) {
      const specifier = node.source?.value
      if (typeof specifier !== 'string') return
      const target = specifier.startsWith('@/') ? path.resolve(sourceRoot, specifier.slice(2))
        : specifier.startsWith('.') ? path.resolve(path.dirname(filename), specifier) : undefined
      if (!target) return
      const destination = segments(target)
      if (destination[0] === '..') return

      const sharedToUpper = owner[0] === 'shared' && ['app', 'pages', 'features'].includes(destination[0])
      const featureToUpper = owner[0] === 'features' && ['app', 'pages'].includes(destination[0])
      if (sharedToUpper || featureToUpper) {
        context.report({ node: node.source, messageId: 'upward', data: { source: specifier } })
        return
      }

      if (destination[0] !== 'features') return
      if (owner[0] === 'features' && owner[1] === destination[1]) return
      const publicIndex = destination.length === 2
        || (destination.length === 3 && /^index(?:\.[cm]?[jt]sx?)?$/.test(destination[2]))
      if (!publicIndex) {
        context.report({ node: node.source, messageId: 'private', data: { feature: destination[1] } })
      }
    }

    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: check,
    }
  },
}
