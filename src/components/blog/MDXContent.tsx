'use client'

import * as runtime from 'react/jsx-runtime'
import { useMemo } from 'react'

interface MDXContentProps {
  code: string
}

/**
 * MDXContent — renderiza o conteúdo MDX compilado pelo velite.
 *
 * O velite compila MDX em JavaScript que usa arguments[0] como runtime.
 * Aqui executamos esse código com o react/jsx-runtime e retornamos o componente.
 */
export function MDXContent({ code }: MDXContentProps) {
  const Component = useMemo(() => {
    const fn = new Function(code)
    return fn({ ...runtime }).default as React.ComponentType
  }, [code])

  return <Component />
}
