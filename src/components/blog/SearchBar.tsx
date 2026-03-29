'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useArticleSearch } from '@/hooks/useArticleSearch'
import { sanitizeSearchQuery } from '@/lib/search'
import { loadMessages } from '@config/content'

const m = loadMessages()

// GA4 tracking (EVT-011 search_performed)
function trackSearch(sanitizedQuery: string) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).gtag('event', 'search', { // any: gtag não tem typings nativos no browser global; acesso pontual via type assertion
      search_term: sanitizedQuery,
    })
  }
}

export function SearchBar() {
  const [inputValue, setInputValue] = useState('')
  const lastTrackedQueryRef = useRef('')
  const { results, isSearching, hasResults, isLoading, hasError, query } = useArticleSearch(inputValue)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setInputValue('')
    }
  }

  // Track GA4 após debounce (query sanitizada) — em efeito para evitar setState durante render
  useEffect(() => {
    if (query && query !== lastTrackedQueryRef.current) {
      const sanitized = sanitizeSearchQuery(query)
      trackSearch(sanitized)
      lastTrackedQueryRef.current = query
    }
  }, [query])

  const showDropdown = inputValue.trim().length >= 2 && !isSearching && !isLoading

  return (
    <div data-testid="blog-search" className="relative w-full max-w-md">
      <input
        data-testid="blog-search-input"
        type="search"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={showDropdown}
        aria-controls="search-listbox"
        aria-autocomplete="list"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={m.blog.search.placeholder}
        aria-label={m.blog.search.ariaLabel}
        className="w-full px-4 py-2.5 min-h-[44px] border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {isLoading && (
        <div className="absolute right-3 top-2.5">
          <span className="text-muted-foreground text-sm">{m.blog.search.loading}</span>
        </div>
      )}

      {isSearching && !isLoading && (
        <div data-testid="blog-search-spinner" className="absolute right-3 top-1/2 -translate-y-1/2" aria-label={m.blog.search.searching} role="status">
          <svg
            className="w-4 h-4 text-muted-foreground animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="sr-only">{m.blog.search.searching}</span>
        </div>
      )}

      {showDropdown && (
        <div
          id="search-listbox"
          data-testid="blog-search-results"
          className="absolute top-full left-0 right-0 z-50 bg-background border border-border rounded-lg shadow-lg mt-1 max-h-80 overflow-y-auto"
          role="listbox"
          aria-label={m.blog.search.resultsAriaLabel}
        >
          {hasError ? (
            <div className="px-4 py-3" role="alert">
              <p className="text-sm text-destructive">
                {m.blog.search.error}
              </p>
            </div>
          ) : hasResults ? (
            <ul>
              {results.slice(0, 5).map(result => (
                <li key={result.slug} role="option" aria-selected={false}>
                  <Link
                    data-testid={`blog-search-result-${result.slug}`}
                    href={`/blog/${result.slug}`}
                    className="block px-4 py-3 hover:bg-muted transition-colors"
                  >
                    <p className="font-medium text-sm line-clamp-1 text-foreground">{result.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{result.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3">
              <p className="text-sm text-muted-foreground">
                {m.blog.search.noResults.replace('{query}', query ?? '')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {m.blog.search.tryDifferent}{' '}
                <Link href="/blog" className="text-primary hover:underline">
                  {m.blog.search.browseBlog}
                </Link>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
