import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = ['/account'];

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

  // Redirect unauthenticated users away from protected routes to home
  // They can use the login modal from there
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Note: Admin routes are handled by client-side AdminRoute component
  // This allows proper authentication checking using Amplify's client-side auth state

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