import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseEnv } from '@/lib/supabase/env';

function isProtectedPath(pathname: string) {
  return (
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/invoices' ||
    pathname.startsWith('/invoices/') ||
    pathname === '/clients' ||
    pathname.startsWith('/clients/') ||
    pathname === '/payments' ||
    pathname.startsWith('/payments/') ||
    pathname === '/employees' ||
    pathname.startsWith('/employees/') ||
    pathname === '/payroll' ||
    pathname.startsWith('/payroll/') ||
    pathname === '/profile' ||
    pathname.startsWith('/profile/') ||
    pathname === '/settings' ||
    pathname.startsWith('/settings/')
  );
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(
    url,
    anonKey,
    {
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
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Demo mode cookie should never grant access to protected app routes.
  // (Keeps marketing/public pages previewable, but requires auth for dashboard.)
  const demo = request.cookies.get('ti_demo')?.value === '1';
  if (demo && isProtectedPath(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    user &&
    (request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/register' ||
      request.nextUrl.pathname === '/forgot-password')
  ) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

