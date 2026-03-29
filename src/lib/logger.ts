const isDev = process.env.NODE_ENV !== 'production'

interface LogContext {
  digest?: string
  route?: string
  action?: string
  [key: string]: unknown
}

function formatProd(message: string, ctx?: LogContext): string {
  const parts = [message]
  if (ctx?.digest) parts.push(`digest=${ctx.digest}`)
  if (ctx?.route) parts.push(`route=${ctx.route}`)
  if (ctx?.action) parts.push(`action=${ctx.action}`)
  return parts.join(' | ')
}

export const logger = {
  error(message: string, ctx?: LogContext): void {
    if (isDev) {
      console.error('[error]', message, ctx ?? '')
    } else {
      console.error(formatProd(message, ctx))
    }
  },

  warn(message: string, ctx?: LogContext): void {
    if (isDev) {
      console.warn('[warn]', message, ctx ?? '')
    } else {
      console.warn(formatProd(message, ctx))
    }
  },
}
