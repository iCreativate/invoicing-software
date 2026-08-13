import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseEnv } from '@/lib/supabase/env';
import { hasSupabaseAuthCookie, isTransientDbError, withTimeoutRetry } from '@/lib/demo/server';

function isProtectedPath(pathname: string) {
  return (
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/invoices' ||
    pathname.startsWith('/invoices/') ||
    pathname === '/quotes' ||
    pathname.startsWith('/quotes/') ||
    pathname === '/clients' ||
    pathname.startsWith('/clients/') ||
    pathname === '/products-services' ||
    pathname.startsWith('/products-services/') ||
    pathname === '/payments' ||
    pathname.startsWith('/payments/') ||
    pathname === '/expenses' ||
    pathname.startsWith('/expenses/') ||
    pathname === '/reports' ||
    pathname.startsWith('/reports/') ||
    pathname === '/recurring' ||
    pathname.startsWith('/recurring/') ||
    pathname === '/time-tracking' ||
    pathname.startsWith('/time-tracking/') ||
    pathname === '/employees' ||
    pathname.startsWith('/employees/') ||
    pathname === '/team' ||
    pathname.startsWith('/team/') ||
    pathname === '/reminders' ||
    pathname.startsWith('/reminders/') ||
    pathname === '/cashflow' ||
    pathname.startsWith('/cashflow/') ||
    pathname === '/insights' ||
    pathname.startsWith('/insights/') ||
    pathname === '/integrations' ||
    pathname.startsWith('/integrations/') ||
    pathname === '/onboarding' ||
    pathname.startsWith('/onboarding/') ||
    pathname === '/notifications' ||
    pathname.startsWith('/notifications/') ||
    pathname === '/billing' ||
    pathname.startsWith('/billing/') ||
    pathname === '/payroll' ||
    pathname.startsWith('/payroll/') ||
    pathname === '/profile' ||
    pathname.startsWith('/profile/') ||
    pathname === '/settings' ||
    pathname.startsWith('/settings/')
  );
}

function isAuthPage(pathname: string) {
  return pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  if (pathname === '/login') {
    url.searchParams.set('next', request.nextUrl.pathname);
  } else {
    url.search = '';
  }
  return NextResponse.redirect(url);
}

function clearDemoCookies(res: NextResponse) {
  res.cookies.set('ti_demo', '', { path: '/', maxAge: 0 });
  res.cookies.set('ti_demo_ui', '', { path: '/', maxAge: 0 });
  res.cookies.set('ti_supabase_down', '', { path: '/', maxAge: 0 });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/api/demo' || pathname.startsWith('/api/demo/')) {
    return NextResponse.next();
  }
  // Login/register always talk to Supabase — drop leftover sample-mode cookies.
  if (isAuthPage(pathname)) {
    const res = NextResponse.next();
    clearDemoCookies(res);
    return res;
  }

  const demo =
    request.cookies.get('ti_demo')?.value === '1' ||
    request.cookies.get('ti_demo_ui')?.value === '1' ||
    request.cookies.get('ti_supabase_down')?.value === '1';

  // Explicit sample mode only (set by /api/demo). Do not auto-enter it.
  if (demo) {
    return NextResponse.next();
  }

  // No session cookies → skip network entirely.
  if (!hasSupabaseAuthCookie(request.cookies.getAll())) {
    if (isProtectedPath(pathname)) return redirectTo(request, '/login');
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const { url, anonKey } = getSupabaseEnv();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  let user: { id: string } | null = null;
  let authUnreachable = false;
  try {
    const result = await withTimeoutRetry(() => supabase.auth.getUser(), 10000, 1);
    user = result.data.user;
  } catch (e) {
    authUnreachable = isTransientDbError(e);
    user = null;
  }

  // Cold-start / paused DB: keep the session cookie and let the page retry.
  if (authUnreachable && isProtectedPath(pathname) && hasSupabaseAuthCookie(request.cookies.getAll())) {
    return response;
  }

  if (authUnreachable && isProtectedPath(pathname)) {
    return redirectTo(request, '/login');
  }

  if (!user && isProtectedPath(pathname)) return redirectTo(request, '/login');
  if (user && isAuthPage(pathname)) return redirectTo(request, '/dashboard');

  return response;
}

export const config = {
  matcher: [
    /*
     * Skip static assets / Next internals so they aren't blocked by auth checks.
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.svg|manifest.webmanifest|serwist|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
