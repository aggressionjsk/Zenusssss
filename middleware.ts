import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle socket.io requests
  if (request.nextUrl.pathname.startsWith('/api/socket/io')) {
    // Allow the socket.io requests to pass through to the socket.io handler
    return NextResponse.next();
  }

  // For all other requests, continue with normal processing
  return NextResponse.next();
}

// Configure the middleware to run for specific paths
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Specifically match socket.io routes
    '/api/socket/io',
  ],
};