export const config = {
  matcher: '/api/:path*',
};

export default function middleware(request) {
  const target = process.env.BACKEND_API_URL;
  
  if (target) {
    const url = new URL(request.url);
    // Create the destination URL (e.g. http://VPS_IP:8002/api/auth/login)
    const newUrl = `${target}${url.pathname}${url.search}`;
    
    // Vercel intercepts this header and proxies the request under the hood
    return new Response(null, {
      headers: {
        'x-middleware-rewrite': newUrl,
      },
    });
  }
}
