import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = ['/account'];

// Define admin routes that require admin/super_admin role
const adminRoutes = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if user is authenticated by looking for Amplify auth tokens
  // Amplify stores tokens in localStorage on client side, but we can check for session cookies
  const amplifyTokens = request.cookies.get('amplify-signin-with-hostedUI_token') || 
                       request.cookies.get('CognitoIdentityServiceProvider.7pcl9n0ij4c217ri21oc9q7sr6.LastAuthUser') ||
                       request.cookies.get('amplify-auth-token');
  
  const isAuthenticated = !!amplifyTokens;

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if the current path is an admin route
  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Redirect unauthenticated users away from protected routes to home
  // They can use the login modal from there
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect unauthenticated users away from admin routes
  if (isAdminRoute && !isAuthenticated) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
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