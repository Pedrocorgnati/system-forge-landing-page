'use client'

import { useState, useEffect } from 'react'

/**
 * useDebounce — retorna um valor com debounce (atrasado).
 * Usado em SearchBar (module-7) para evitar muitas buscas durante digitação.
 *
 * @param value - Valor a debounce
 * @param delay - Atraso em ms (padrão: 300ms)
 * @returns Valor debounced
 *
 * @example
 * const [query, setQuery] = useState('')
 * const debouncedQuery = useDebounce(query, 300)
 * useEffect(() => { search(debouncedQuery) }, [debouncedQuery])
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
