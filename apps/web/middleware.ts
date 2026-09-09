import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { demoModeEnabled } from '@/lib/demo/accounts';
import { getSupabaseEnv } from '@/lib/supabase/env';
import { hasSupabaseAuthCookie, isTransientDbError, withTimeoutRetry } from '@/lib/demo/server';

function isProtectedPath(pathname: string) {
  return (
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/money' ||
    pathname.startsWith('/money/') ||
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
    pathname === '/company' ||
    pathname.startsWith('/company/') ||
    pathname === '/settings' ||
    pathname.startsWith('/settings/') ||
    pathname === '/crew' ||
    pathname.startsWith('/crew/')
  );
}

/** Paths suspended/terminated workspaces may still open. */
function isAccountBlockedExempt(pathname: string) {
  return (
    pathname === '/settings' ||
    pathname.startsWith('/settings/') ||
    pathname === '/billing' ||
    pathname.startsWith('/billing/') ||
    pathname === '/crew' ||
    pathname.startsWith('/crew/') ||
    pathname.startsWith('/api/')
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

  const demoCookies =
    request.cookies.get('ti_demo')?.value === '1' ||
    request.cookies.get('ti_demo_ui')?.value === '1' ||
    request.cookies.get('ti_supabase_down')?.value === '1';

  // Live Supabase only: strip leftover sample cookies and require a real session.
  if (!demoModeEnabled()) {
    const response = NextResponse.next();
    if (demoCookies) clearDemoCookies(response);
    if (!hasSupabaseAuthCookie(request.cookies.getAll())) {
      if (isProtectedPath(pathname)) return redirectTo(request, '/login');
      return response;
    }
    // Fall through to session refresh below (do not bypass auth).
  } else if (demoCookies) {
    // Explicit sample mode only (set by /api/demo).
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

  // Soft account lifecycle: block suspended/terminated workspaces from app use
  // (billing + crew remain reachable). Best-effort; missing column/table fails open.
  if (
    user &&
    isProtectedPath(pathname) &&
    !isAccountBlockedExempt(pathname)
  ) {
    try {
      const { data: profile } = await supabase
        .from('company_profiles')
        .select('account_status')
        .eq('owner_id', user.id)
        .maybeSingle();
      const status = String((profile as { account_status?: string } | null)?.account_status ?? 'active').toLowerCase();
      if (status === 'suspended' || status === 'terminated') {
        const url = request.nextUrl.clone();
        url.pathname = '/settings/billing';
        url.search = 'account=suspended';
        return NextResponse.redirect(url);
      }
    } catch {
      // fail open
    }
  }

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
