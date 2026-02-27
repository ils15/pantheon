# Next.js SEO Config Templates

```typescript
// seo-config.ts
export const seoConfig = {
  siteName: 'MyShop',
  defaultTitle: 'MyShop - Best Deals & Offers',
  defaultDescription: 'Find the best deals online. Exclusive coupons, free shipping and cashback.',
  url: 'https://myshop.com',
  twitterHandle: '@myshop',
  email: 'contact@myshop.com',
  
  // Image sizes
  ogImageWidth: 1200,
  ogImageHeight: 630,
  
  // Locales
  locales: ['en', 'en-US'],
  defaultLocale: 'en-US',
  
  // Categories for products
  categories: [
    'electronics',
    'fashion',
    'home',
    'games',
    'books',
    'sports',
    'health'
  ]
}

export function generateMetadataBase() {
  return new URL(seoConfig.url)
}

export function generateOpenGraph(
  title: string,
  description: string,
  imageUrl: string = '/og-default.png',
  type: 'website' | 'product' | 'article' = 'website'
) {
  return {
    type,
    locale: seoConfig.defaultLocale,
    url: seoConfig.url,
    siteName: seoConfig.siteName,
    title,
    description,
    images: [
      {
        url: imageUrl,
        width: seoConfig.ogImageWidth,
        height: seoConfig.ogImageHeight,
        alt: title
      }
    ]
  }
}

export function generateTwitterCard(
  title: string,
  description: string,
  imageUrl: string = '/og-default.png'
) {
  return {
    card: 'summary_large_image',
    title,
    description,
    images: [imageUrl],
    creator: seoConfig.twitterHandle
  }
}
```

## Usage

```typescript
import { seoConfig, generateOpenGraph, generateTwitterCard } from '@/config/seo'

export const metadata: Metadata = {
  title: `Product Title | ${seoConfig.siteName}`,
  description: 'Product description',
  metadataBase: generateMetadataBase(),
  openGraph: generateOpenGraph('Product Title', 'Description', '/image.png', 'product'),
  twitter: generateTwitterCard('Product Title', 'Description', '/image.png'),
}
```
