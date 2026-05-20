'use client'

import * as runtime from 'react/jsx-runtime'
import { useMemo } from 'react'
import { mdxBlogComponents } from './MdxBlogComponents'

interface MDXContentProps {
  code: string
}

/**
 * MDXContent — renderiza o conteúdo MDX compilado pelo velite.
 *
 * O velite compila MDX em JavaScript que usa arguments[0] como runtime.
 * Aqui executamos esse código com o react/jsx-runtime e retornamos o componente.
 *
 * Os componentes customizados (`<FAQSchema>`, `<Callout>`) são passados via prop
 * `components` — sem isso o MDX compilado os resolve para `undefined` e a página
 * quebra em runtime ("Element type is invalid"). Ver MdxBlogComponents.tsx.
 */
export function MDXContent({ code }: MDXContentProps) {
  const Component = useMemo(() => {
    const fn = new Function(code)
    return fn({ ...runtime }).default as React.ComponentType<{
      components?: Record<string, unknown>
    }>
  }, [code])

  return <Component components={mdxBlogComponents} />
}
