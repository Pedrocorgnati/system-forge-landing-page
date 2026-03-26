'use client'

import { useState, useEffect, useRef } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import type { SearchIndexItem } from '@/lib/search'

interface UseArticleSearchReturn {
  results: SearchIndexItem[]
  isSearching: boolean
  hasResults: boolean
  isLoading: boolean
  hasError: boolean
  query: string
}

export function useArticleSearch(query: string): UseArticleSearchReturn {
  const [results, setResults] = useState<SearchIndexItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Fuse.js instância — carregada lazy na primeira busca
  const fuseRef = useRef<InstanceType<typeof import('fuse.js').default> | null>(null)

  const debouncedQuery = useDebounce(query, 500)

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }

    async function search() {
      setIsSearching(true)
      setHasError(false)

      try {
        if (!fuseRef.current) {
          setIsLoading(true)
          const [FuseModule, searchIndex] = await Promise.all([
            import('fuse.js'),
            fetch('/search-index.json').then(r => {
              if (!r.ok) throw new Error(`Search index fetch failed: ${r.status}`)
              return r.json() as Promise<SearchIndexItem[]>
            }),
          ])

          const Fuse = FuseModule.default
          fuseRef.current = new Fuse(searchIndex, {
            threshold: 0.3,
            keys: [
              { name: 'title', weight: 0.5 },
              { name: 'description', weight: 0.3 },
              { name: 'tags', weight: 0.2 },
            ],
            includeScore: true,
            minMatchCharLength: 2,
          })
          setIsLoading(false)
        }

        const fuseResults = fuseRef.current.search(debouncedQuery)
        setResults(fuseResults.map(r => r.item as SearchIndexItem))
      } catch (err) {
        console.error('[useArticleSearch] Falha ao carregar índice de busca:', err)
        setResults([])
        setHasError(true)
      } finally {
        setIsSearching(false)
      }
    }

    search()
  }, [debouncedQuery])

  return {
    results,
    isSearching,
    hasResults: results.length > 0,
    isLoading,
    hasError,
    query: debouncedQuery,
  }
}
