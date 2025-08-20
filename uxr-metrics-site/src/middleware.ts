import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect admin routes
        if (req.nextUrl.pathname.startsWith('/dashboard') || 
            req.nextUrl.pathname.startsWith('/projects') ||
            req.nextUrl.pathname.startsWith('/tags') ||
            req.nextUrl.pathname.startsWith('/api/projects') ||
            req.nextUrl.pathname.startsWith('/api/tags') ||
            req.nextUrl.pathname.startsWith('/api/categories')) {
          return token?.role === 'ADMIN'
        }
        return true
      }
    }
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/projects/:path*', '/tags/:path*', '/api/projects/:path*', '/api/tags/:path*', '/api/categories/:path*']
}