'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Menu, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { NAV_LINKS, SITE } from '@/lib/constants'
import { MobileNav } from './MobileNav'
import { cn } from '@/lib/utils'

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    function handleScroll() {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <>
      <header
        data-testid="header"
        className={cn(
          'sticky top-0 z-30 w-full h-16 bg-background transition-all duration-200',
          isScrolled
            ? 'border-b border-border backdrop-blur-md bg-background/80'
            : 'border-b border-transparent',
        )}
      >
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link
              href="/"
              data-testid="header-logo"
              className={cn(
                'text-xl font-bold text-primary',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-md',
              )}
            >
              {SITE.name}
            </Link>

            {/* Nav Desktop */}
            <nav data-testid="header-nav" className="hidden md:flex items-center gap-6" aria-label="Navegação principal">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  data-testid={`header-nav-item-${link.href.replace(/^\//, '') || 'home'}`}
                  className={cn(
                    'text-sm text-foreground/80 hover:text-foreground transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-md px-1',
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div data-testid="header-actions" className="flex items-center gap-2">
              {/* Theme toggle */}
              <button
                data-testid="header-theme-toggle-button"
                onClick={toggleTheme}
                className={cn(
                  'w-10 h-10 flex items-center justify-center rounded-md',
                  'text-foreground hover:bg-accent transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
                )}
                aria-label={mounted && theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              >
                {mounted && theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* Hamburger mobile */}
              <button
                ref={hamburgerRef}
                data-testid="header-mobile-menu-button"
                onClick={() => setIsMobileNavOpen(true)}
                aria-expanded={isMobileNavOpen}
                aria-label="Abrir menu de navegação"
                className={cn(
                  'md:hidden w-10 h-10 flex items-center justify-center rounded-md',
                  'text-foreground hover:bg-accent transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
                )}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        triggerRef={hamburgerRef}
      />
    </>
  )
}
