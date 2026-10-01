import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  if (!siteUrl) return [];

  return ['', '/support', '/access', '/share/text', '/share/document'].map(
    (path) => ({
      url: new URL(path, siteUrl).toString(),
      changeFrequency: path === '' ? 'weekly' : 'monthly',
      priority: path === '' ? 1 : 0.6,
    }),
  );
}