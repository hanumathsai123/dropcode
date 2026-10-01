import { NextRequest, NextResponse } from 'next/server';

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

function maintenancePage(message: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Temporarily unavailable | DropCodes</title><style>
    *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#eef3f6;color:#172638;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    main{width:min(100%,560px);padding:36px;border:1px solid #d8e1e8;border-radius:12px;background:#fff;box-shadow:0 14px 42px #253b5114;text-align:center}
    .mark{display:grid;width:48px;height:48px;margin:0 auto 18px;place-items:center;border-radius:12px;background:#e1f6fc;color:#0788bb;font-size:24px;font-weight:700}
    h1{margin:0 0 10px;font-size:27px;letter-spacing:0}p{margin:0;color:#647487;line-height:1.65}small{display:block;margin-top:25px;color:#8795a3}
  </style></head><body><main><span class="mark" aria-hidden="true">D</span><h1>We’ll be back soon</h1><p>${escapeHtml(message)}</p><small>DropCodes</small></main></body></html>`;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/api/admin' ||
    pathname.startsWith('/api/admin/')
  ) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return NextResponse.next();

  try {
    const settingsUrl = new URL('/rest/v1/site_settings', supabaseUrl);
    settingsUrl.searchParams.set('id', 'eq.1');
    settingsUrl.searchParams.set('select', 'maintenance_enabled,maintenance_message');
    const response = await fetch(settingsUrl, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      next: { revalidate: 3 },
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return NextResponse.next();

    const rows = (await response.json()) as Array<{
      maintenance_enabled?: boolean;
      maintenance_message?: string;
    }>;
    const settings = rows[0];
    if (!settings?.maintenance_enabled) return NextResponse.next();

    const message = settings.maintenance_message?.trim() ||
      'We are making a few improvements. Please check back shortly.';
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: message, maintenance: true },
        { status: 503, headers: { 'Retry-After': '300', 'Cache-Control': 'no-store' } },
      );
    }

    return new NextResponse(maintenancePage(message), {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': '300',
      },
    });
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};