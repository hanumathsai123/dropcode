export function getSiteUrl(): URL | undefined {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    'https://dropcodes.in';
  if (!configuredUrl) return undefined;

  try {
    return new URL(
      configuredUrl.startsWith('http') ? configuredUrl : `https://${configuredUrl}`,
    );
  } catch {
    return undefined;
  }
}