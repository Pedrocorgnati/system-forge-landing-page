'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, Sun, Moon } from 'lucide-react'
import { getSiteConfig } from '@config'
import { loadMessages } from '@config/content'
import { MobileNav } from './MobileNav'
import { useTheme } from './ThemeProvider'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants/routes'
import { MultibackendLogin } from '@/components/auth/MultibackendLogin'

const config = getSiteConfig()
const messages = loadMessages()

const locale = config.locale
const NAV_ARIA_LABEL = locale === 'it-IT' ? 'Navigazione principale'
  : locale === 'en' ? 'Main navigation'
  : 'Navegação principal'
const THEME_LABELS = locale === 'it-IT'
  ? { light: 'Attiva modalità chiara', dark: 'Attiva modalità scura' }
  : locale === 'en'
  ? { light: 'Switch to light mode', dark: 'Switch to dark mode' }
  : { light: 'Ativar modo claro', dark: 'Ativar modo escuro' }

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const { theme, mounted, toggleTheme } = useTheme()

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isDark = mounted && theme === 'dark'

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
              href={ROUTES.HOME}
              data-testid="header-logo"
              className={cn(
                'flex items-center gap-2 text-xl font-bold text-primary',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-md',
              )}
            >
              <Image
                src="/images/logo.png"
                alt={`${config.siteName} logo`}
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                priority
              />
              {config.siteName}
            </Link>

            {/* Nav Desktop */}
            <nav data-testid="header-nav" className="hidden md:flex items-center gap-6" aria-label={NAV_ARIA_LABEL}>
              {config.navigation.map((link) => (
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
              {/* Login OIDC multibackend (R-26: visivel em toda viewport; tambem no menu mobile) */}
              <MultibackendLogin />
              {/* Theme toggle */}
              <button
                data-testid="header-theme-toggle-button"
                onClick={toggleTheme}
                className={cn(
                  'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md',
                  'text-foreground hover:bg-accent transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
                )}
                aria-label={isDark ? THEME_LABELS.light : THEME_LABELS.dark}
              >
                {isDark ? (
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
                aria-label={messages.accessibility.openMenu}
                className={cn(
                  'md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md',
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
