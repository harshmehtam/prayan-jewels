import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { runWithAmplifyServerContext, AuthGetCurrentUserServer } from '@/utils/amplify-utils';

// Define protected routes that require authentication
const PROTECTED_ROUTES = [
  '/account',
  '/account/orders',
  '/account/profile',
  '/account/addresses',
  '/account/reviews',
  '/account/wishlist',
  '/account/coupons',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current path is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  // Skip middleware for public routes
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  try {
    // Check authentication status using existing utility
    const user = await AuthGetCurrentUserServer();
    const authenticated = !!user;

    // Redirect to home if not authenticated
    if (!authenticated) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, redirect to home for safety
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
