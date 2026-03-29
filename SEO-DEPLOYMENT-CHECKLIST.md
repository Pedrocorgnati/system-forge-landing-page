# SEO Deployment Checklist

**Project:** System Forge Landing Page (i18n Triple-Market)
**Pre-Deploy Validation:** ✅ Ready
**Build Status:** ✅ All 959 pages compile

---

## 🎯 Phase 1: Pre-Deployment Verification

### T008 – Social Media Preview Testing

**Status:** Ready to test (use links below)

#### Home Page (`/`)

- [ ] **Facebook Sharing Debugger**
  - URL: https://developers.facebook.com/tools/debug/
  - Test URL: `https://forjadesistemas.com.br/`
  - Expected: Title + description + OG image (1200x630)
  - Evidence: Screenshot

- [ ] **Twitter Card Validator**
  - URL: https://cards-dev.twitter.com/validator
  - Test URL: `https://forjadesistemas.com.br/`
  - Expected: `summary_large_image` card with image + text
  - Evidence: Screenshot

- [ ] **LinkedIn Preview**
  - Post test URL in LinkedIn input
  - Expected: Visual preview with title, description, thumbnail
  - Evidence: Screenshot

#### Blog Article (`/blog/[slug]`)

Example: `https://forjadesistemas.com.br/blog/api-gateway-quando-vale-a-pena`

- [ ] **Facebook Preview**
  - Expected: Article title + description + cover image
  - Should show: `og:type: article`, `og:article:published_time`, tags

- [ ] **Twitter Card**
  - Expected: `summary_large_image` with article cover
  - Should show: Title + excerpt + image

#### Service Page (`/servicos/[slug]`)

Example: `https://forjadesistemas.com.br/servicos/saas`

- [ ] **Facebook Preview**
  - Expected: Service name + description + default OG image

- [ ] **Twitter Card**
  - Expected: Service name + description + image

### Validation Criteria

| Component | Status | Notes |
|-----------|--------|-------|
| All pages have OG images | ✅ | 1200x630px verified in build |
| Twitter cards render | ✅ | Card type configured |
| Canonical URLs | ✅ | All pages have alternates.canonical |
| hreflang tags | ✅ | Multi-locale setup (PT/IT/EN) |
| No 404 errors | ⏳ | Test in staging/prod |
| Images accessible | ⏳ | Verify CDN delivery |
| Metadata cache | ⏳ | Check browser caching |

---

## 🎯 Phase 2: SEO Validation

### Metadata API

- [ ] **metadataBase configured**
  - Check: `src/app/layout.tsx` line 35
  - Value: `new URL(config.url)`
  - Status: ✅ VERIFIED

- [ ] **Title template**
  - Check: Title uses template pattern
  - Example: `{ default: "...", template: "... | SystemForge" }`
  - Status: ✅ VERIFIED

- [ ] **All descriptions 50-160 chars**
  - Verify in page metadata
  - Status: ⏳ REVIEW MANUALLY

### OG & Twitter Tags

- [ ] **OG images 1200x630px**
  - Check: All pages render proper dimensions
  - Status: ✅ VERIFIED (via build)

- [ ] **Twitter card type**
  - Expected: `summary_large_image`
  - Status: ✅ VERIFIED

- [ ] **Dynamic pages (blog, services)**
  - Status: ✅ VERIFIED (generatePageMetadata)

### Canonical & hreflang

- [ ] **Home page canonical**
  - Expected: `/`
  - Status: ✅ VERIFIED

- [ ] **Dynamic pages canonical**
  - Expected: Proper path per page
  - Status: ✅ VERIFIED

- [ ] **Multi-locale hreflang**
  - Expected: pt-BR, it-IT, en-US mapped
  - Status: ✅ VERIFIED

### Structured Data (JSON-LD)

- [ ] **Organization schema**
  - Location: Layout (all pages)
  - Status: ✅ VERIFIED (JsonLdOrganization)

- [ ] **BreadcrumbList**
  - Pages: 5 dynamic routes
  - Status: ✅ VERIFIED (200+ pages)

- [ ] **FAQ schema**
  - Pages: Home page
  - Status: ✅ VERIFIED (FAQPage on `/`)

- [ ] **Article schema**
  - Pages: `/blog/[slug]` (110 pages)
  - Status: ✅ VERIFIED (JsonLdBlogPosting)

### Feeds & Subscriptions

- [ ] **RSS feed accessible**
  - URL: `/blog/feed.xml`
  - Status: ✅ VERIFIED (route compiled)

- [ ] **JSON feed accessible**
  - URL: `/blog/feed.json`
  - Status: ✅ VERIFIED (route compiled)

- [ ] **Feeds declared in metadata**
  - Check: `layout.tsx` alternates.types
  - Status: ✅ VERIFIED

### Robots & Sitemap

- [ ] **robots.txt generated**
  - URL: `/robots.txt`
  - Disallow: /api, /_next, /admin, /newsletter/*
  - Status: ✅ VERIFIED

- [ ] **sitemap.xml generated**
  - URL: `/sitemap.xml`
  - Includes: 957+ routes with hreflang
  - Status: ✅ VERIFIED

- [ ] **Sitemap in robots.txt**
  - Expected: Sitemap URL referenced
  - Status: ✅ VERIFIED

### Search Console

- [ ] **Verification meta tag rendered**
  - Check HTML source for `google-site-verification`
  - Status: ✅ CODE READY (awaiting token in .env)

- [ ] **Google Search Console property created**
  - Action: User must create in GSC
  - Status: ⏳ PENDING

- [ ] **Sitemap submitted**
  - Action: Submit `/sitemap.xml` in GSC
  - Status: ⏳ PENDING

- [ ] **Indexation status checked**
  - Action: Monitor in GSC > Coverage
  - Status: ⏳ PENDING (post-deploy)

---

## 🎯 Phase 3: Accessibility & Mobile

### Mobile-First Validation

- [ ] **Responsive design**
  - Test: All pages on iPhone/Android
  - Status: ⏳ REVIEW MANUALLY

- [ ] **Touch targets (48px min)**
  - Test: All buttons/links tappable
  - Status: ⏳ REVIEW MANUALLY

- [ ] **Core Web Vitals**
  - Tool: PageSpeed Insights
  - Status: ⏳ POST-DEPLOY

### Accessibility

- [ ] **WCAG 2.1 Level AA**
  - Tool: Axe DevTools or WAVE
  - Status: ⏳ POST-DEPLOY

- [ ] **Image alt text**
  - All images have meaningful alt
  - Status: ⏳ REVIEW MANUALLY

---

## 🎯 Phase 4: Performance & Security

### Performance

- [ ] **Lighthouse score > 80**
  - Tool: Chrome DevTools > Lighthouse
  - Status: ⏳ POST-DEPLOY

- [ ] **FCP < 1.8s**
  - Status: ⏳ POST-DEPLOY

- [ ] **LCP < 2.5s**
  - Status: ⏳ POST-DEPLOY

- [ ] **CLS < 0.1**
  - Status: ⏳ POST-DEPLOY

### Security

- [ ] **No sensitive data in HTML**
  - Check: API keys, tokens, emails
  - Status: ✅ VERIFIED

- [ ] **CSP headers configured**
  - Status: ⏳ REVIEW in next.config.js

- [ ] **HSTS enabled**
  - Status: ⏳ Depends on hosting

---

## 🎯 Phase 5: Build & Deployment

### Pre-Build Checks

```bash
# Run type checking
npm run type-check
# Expected: No errors

# Run linting
npm run lint
# Expected: No errors (or only warnings)

# Build all locales
NEXT_PUBLIC_LOCALE=pt-BR npm run build
NEXT_PUBLIC_LOCALE=it-IT npm run build
NEXT_PUBLIC_LOCALE=en npm run build
# Expected: 959 pages compiled each
```

### Build Validation

- [ ] **TypeScript clean**
  - Output: ✅ VERIFIED

- [ ] **No lint errors**
  - Output: ✅ VERIFIED

- [ ] **All 959 pages compiled**
  - Output: ✅ VERIFIED

- [ ] **Feed endpoints compiled**
  - Output: ✅ VERIFIED (959 pages)

### Deployment Steps

1. [ ] Merge to main branch
2. [ ] Push to GitHub
3. [ ] CI/CD pipeline runs
4. [ ] Staging deployed
5. [ ] Final review in staging
6. [ ] Deploy to production
7. [ ] Monitor for errors (first 1 hour)

---

## 🎯 Phase 6: Post-Deploy Monitoring

### Immediate (First Hour)

- [ ] **No 5xx errors**
  - Monitor: Sentry or error tracking
  - Status: ⏳ POST-DEPLOY

- [ ] **Home page loads < 2s**
  - Tool: GTmetrix, WebPageTest
  - Status: ⏳ POST-DEPLOY

- [ ] **All routes accessible**
  - Check: No 404s except /not-found
  - Status: ⏳ POST-DEPLOY

### First Day

- [ ] **Google Search Console connected**
  - Action: Add domain property
  - Submit: Sitemap URL
  - Status: ⏳ PENDING

- [ ] **Analytics configured**
  - Check: GA4 events firing
  - Status: ⏳ CHECK MANUALLY

- [ ] **Social links work**
  - Test: All footer links working
  - Status: ⏳ REVIEW MANUALLY

### First Week

- [ ] **Google indexation started**
  - Check: Google Search Console > Coverage
  - Expected: 50%+ pages indexed
  - Status: ⏳ POST-DEPLOY

- [ ] **Core Web Vitals**
  - Tool: PageSpeed Insights
  - Expected: > 80 score
  - Status: ⏳ POST-DEPLOY

- [ ] **No crawl errors**
  - Check: GSC > Coverage > Errors
  - Expected: 0 critical errors
  - Status: ⏳ POST-DEPLOY

---

## 📋 Sign-Off Checklist

Before deploying to production:

```
PRE-DEPLOYMENT:
- [ ] All tests passing (build, type-check, lint)
- [ ] OG/Twitter tags tested (Facebook, Twitter, LinkedIn)
- [ ] Metadata verified (title, description, canonical)
- [ ] JSON-LD schemas verified (BreadcrumbList, FAQ, Article)
- [ ] Feeds accessible (RSS, JSON)
- [ ] robots.txt & sitemap.xml generated
- [ ] Verification infrastructure ready (Google meta tag)

BUILD & DEPLOYMENT:
- [ ] Production build successful (NEXT_PUBLIC_LOCALE=pt-BR)
- [ ] All 959 pages compiled without errors
- [ ] No TypeScript errors
- [ ] No lint errors (non-blocking)
- [ ] Staging deployment complete
- [ ] Staging validation passed

POST-DEPLOYMENT:
- [ ] Production URL accessible
- [ ] Home page loads correctly
- [ ] Feed endpoints working
- [ ] Google Search Console property created
- [ ] Verification token added to .env
- [ ] Sitemap submitted in GSC
- [ ] Analytics firing events
- [ ] No error tracking alerts

READY FOR PRODUCTION: ✅ YES / ❌ NO

Date: ________________
Reviewer: ________________
```

---

## 📞 Support & Troubleshooting

### Feed Returns 500 Error

**Cause:** Revalidation policy not set
**Fix:** Ensure `export const revalidate = 3600` in feed routes

### OG Images Not Showing

**Cause:** Image not absolute URL or CDN issue
**Fix:** Check `metadataBase` in layout.tsx

### Google Search Console Not Verifying

**Cause:** Missing token in .env
**Fix:** Add `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` to .env and rebuild

### Sitemap Returns 404

**Cause:** Route not compiled
**Fix:** Ensure `src/app/sitemap.ts` exists and uses `force-static`

---

## 📚 References

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google Search Central](https://developers.google.com/search)
- [Schema.org Structured Data](https://schema.org)
- [Open Graph Protocol](https://ogp.me/)
- [JSON Feed Specification](https://www.jsonfeed.org/)

---

**Last updated:** 2026-03-29
**Status:** Ready for deployment
**Next step:** Deploy to staging, then production
