import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = ['/account'];

// Define auth routes that should redirect to home if already authenticated
const authRoutes = ['/auth/login', '/auth/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if user is authenticated by looking for the auth token in localStorage
  // Since middleware runs on the server, we need to check cookies instead
  const authCookie = request.cookies.get('mock_auth_user');
  const isAuthenticated = !!authCookie;

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};