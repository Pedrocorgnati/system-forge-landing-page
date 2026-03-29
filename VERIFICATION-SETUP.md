# Verification Setup Guide

**Project:** System Forge Landing Page (i18n Triple-Market)
**Status:** Ready for configuration

---

## Overview

This guide explains how to set up search engine verification for your site. Verification is required to access Search Console dashboards and receive notifications about crawling errors.

---

## Google Search Console Verification

### Method 1: HTML Meta Tag (Recommended)

**Status:** ✅ Already implemented in code

**Your site has:** `<meta name="google-site-verification" content="..." />`

**Setup steps:**

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **+ Create Property**
3. Select **Domain** property type
4. Enter your domain: `forjadesistemas.com.br` (or your domain)
5. Choose verification method: **HTML tag**
6. Copy the **content** value (the long string after `content="`)
   - Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
7. Add to `.env.local` or ``.env`:
   ```
   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```
8. Rebuild and deploy:
   ```bash
   npm run build
   npm run start
   ```
9. In Google Search Console, click **Verify**
10. You should see: ✅ "Ownership verified"

**Advantages:**
- Quick setup (no DNS changes)
- Works immediately after deploy
- No additional infrastructure

**Note:** The meta tag is automatically inserted in `<head>` via Next.js metadata API (see `src/app/layout.tsx` line 87).

---

### Method 2: DNS TXT Record (Alternative)

If you prefer DNS verification:

1. In Google Search Console, choose verification method: **DNS record**
2. Copy the TXT record value
3. Add to your domain's DNS settings:
   - Provider: Hostinger, GoDaddy, Namecheap, etc.
   - Type: TXT
   - Name: `forjadesistemas.com.br` (or `@`)
   - Value: Paste the GSC record
4. Wait 10-60 minutes for DNS propagation
5. In Google Search Console, click **Verify**

**Advantages:**
- Domain-level verification (applies to all subdomains)
- More authoritative

---

## Bing Webmaster Tools Verification

### Method 1: HTML Meta Tag

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmaster)
2. Click **+ Add site**
3. Enter your domain
4. Choose **HTML meta tag** verification
5. Copy the `content` value
6. Add to a new `.env` variable:
   ```
   NEXT_PUBLIC_BING_SITE_VERIFICATION=your_bing_token
   ```
7. Update `src/app/layout.tsx` to include Bing meta tag:
   ```tsx
   verification: {
     google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
     other: {
       'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION,
     },
   }
   ```
8. Rebuild and deploy
9. In Bing Webmaster, click **Verify**

### Method 2: DNS CNAME Record

1. In Bing Webmaster, choose **CNAME record** verification
2. Add the CNAME to your DNS provider
3. Wait 24-48 hours for verification

---

## Meta (Facebook) Pixel & Domain Verification

### Pixel Code (Analytics)

1. Go to [Meta Business Suite](https://business.facebook.com)
2. Select your business account
3. Navigate to **Events Manager** > **Data Sources** > **Web**
4. Copy your **Pixel ID** (format: `123456789012345`)
5. Add to `.env`:
   ```
   NEXT_PUBLIC_FACEBOOK_PIXEL_ID=123456789012345
   ```
6. Update `src/components/analytics/Analytics.tsx` or create Facebook Pixel integration

### Domain Verification

1. In Meta Business Suite, go to **Brand Safety** > **Domains**
2. Click **+ Add Domain**
3. Enter domain: `forjadesistemas.com.br`
4. Choose verification method:
   - **DNS TXT record** (recommended)
   - **Meta tag** (HTML)
   - **Upload file** (file to public folder)
5. Complete verification

---

## Environment Variables Checklist

Update your `.env.local` file with:

```bash
# Google Search Console
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your_token_here

# Bing Webmaster Tools (optional)
NEXT_PUBLIC_BING_SITE_VERIFICATION=your_token_here

# Meta / Facebook Pixel (optional)
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=your_pixel_id

# Google Analytics 4 (already configured)
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## CI/CD & Deployment

### GitHub Actions

If using GitHub Actions for deployment, add secrets:

1. Go to **Repository Settings** > **Secrets and variables** > **Actions**
2. Add each verification token as a secret:
   - `GOOGLE_SITE_VERIFICATION`
   - `BING_SITE_VERIFICATION`
   - `FACEBOOK_PIXEL_ID`

3. In your `.github/workflows/deploy.yml`:
   ```yaml
   env:
     NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: ${{ secrets.GOOGLE_SITE_VERIFICATION }}
     NEXT_PUBLIC_BING_SITE_VERIFICATION: ${{ secrets.BING_SITE_VERIFICATION }}
   ```

### Vercel

If deployed on Vercel:

1. Go to **Project Settings** > **Environment Variables**
2. Add each variable as `NEXT_PUBLIC_*`:
   - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
   - `NEXT_PUBLIC_BING_SITE_VERIFICATION`
   - `NEXT_PUBLIC_FACEBOOK_PIXEL_ID`

3. Set scope: **Production** (or all environments)
4. Redeploy

---

## Verification Status

### How to Verify

After deployment, check that verification meta tags are in the HTML:

```bash
# Check Google verification tag
curl https://forjadesistemas.com.br | grep "google-site-verification"

# Should output:
# <meta name="google-site-verification" content="..." />
```

### In Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your property
3. Check **Settings** > **Verification** status
4. Should show: ✅ **Verified**

---

## DNS Records Setup (Optional)

If you want to verify via DNS, add these TXT records to your DNS provider:

| Type | Name | Value | Provider |
|------|------|-------|----------|
| TXT | @ | Google verification record | Hostinger DNS |
| TXT | @ | Bing verification record | Hostinger DNS |
| CNAME | www | Points to your host | Hostinger DNS |
| A | @ | Your server IP | Hostinger DNS |

**Note:** Exact configuration depends on your DNS provider.

---

## Common Issues

### "Verification token not found"

- [ ] Check `.env` variable spelling (should be `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`)
- [ ] Rebuild with `npm run build`
- [ ] Deploy changes
- [ ] Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)
- [ ] Check HTML source: right-click > **View page source** > search for "google-site-verification"

### "This file failed to download"

If using file verification method:
- [ ] Ensure file is in `public/` folder
- [ ] File path should be: `public/google{xxxxx}.html`
- [ ] Verify file is accessible: `https://forjadesistemas.com.br/google{xxxxx}.html`

### "DNS record not yet detected"

- [ ] Check DNS provider (Hostinger, GoDaddy, etc.)
- [ ] Verify TXT record was added correctly
- [ ] Wait 10-60 minutes for propagation
- [ ] Use [MXToolbox](https://mxtoolbox.com/txtlookup.aspx) to verify DNS

---

## Recommended Verification Order

1. ✅ **Google Search Console** (most important)
2. ⚠️ **Bing Webmaster** (secondary)
3. 🔵 **Meta Pixel** (optional, for ad tracking)

---

## References

- [Google Search Console Help](https://support.google.com/webmasters)
- [Bing Webmaster Tools Help](https://www.bing.com/webmasters/help)
- [Meta for Developers](https://developers.facebook.com)
- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)

---

**Last updated:** 2026-03-29
**Status:** Ready to configure
**Deployment:** Complete the setup after production deployment
