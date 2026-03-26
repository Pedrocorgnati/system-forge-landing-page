import type { MDXComponents } from 'mdx/types'
import Image from 'next/image'

/**
 * mdx-components.tsx
 * Componentes customizados para renderização MDX.
 * Usado pelo Next.js ao renderizar arquivos MDX.
 *
 * module-7-blog-pipeline / TASK-1 / ST004
 */

type CalloutType = 'info' | 'tip' | 'warning'

const calloutStyles: Record<CalloutType, string> = {
  tip: 'border-green-500 bg-green-50 dark:bg-green-950/20',
  warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
  info: 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Substituir <img> por next/image otimizado
    img: ({ src, alt, ...props }) => (
      <Image
        src={src ?? ''}
        alt={alt ?? ''}
        width={800}
        height={450}
        className="rounded-lg w-full"
        {...(props as Record<string, unknown>)}
      />
    ),

    // Código com overflow horizontal em mobile
    pre: ({ children, ...props }) => (
      <div className="overflow-x-auto rounded-lg bg-muted/50 border my-4">
        <pre {...props} className="p-4 text-sm">
          {children}
        </pre>
      </div>
    ),

    // Callout para notas, dicas e avisos
    // Uso no MDX: <Callout type="tip">Texto da dica</Callout>
    Callout: ({
      type = 'info',
      children,
    }: {
      type?: CalloutType
      children: React.ReactNode
    }) => (
      <div
        className={`border-l-4 p-4 my-4 rounded-r-lg ${calloutStyles[type as CalloutType] ?? calloutStyles.info}`}
      >
        {children}
      </div>
    ),

    ...components,
  }
}
