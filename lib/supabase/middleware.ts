import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /dashboard routes
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next({ request });
  }

  const userId = request.cookies.get('user_id')?.value;

  // Not authenticated → redirect to sign in
  if (!userId) {
    const url = request.nextUrl.clone();
    url.pathname = '/signin';
    return NextResponse.redirect(url);
  }

  // Authenticated → let through; the layout handles role-based access
  return NextResponse.next({ request });
}
