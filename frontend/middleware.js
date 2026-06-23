export const config = {
  matcher: '/api/:path*',
};

export default function middleware(request) {
  const target = process.env.BACKEND_API_URL;
  
  if (target) {
    const url = new URL(request.url);
    // Cria a URL de destino (ex: http://82.38.28.138:8002/api/auth/login)
    const newUrl = `${target}${url.pathname}${url.search}`;
    
    // O Vercel intercepta esse header e faz o proxy por debaixo dos panos
    return new Response(null, {
      headers: {
        'x-middleware-rewrite': newUrl,
      },
    });
  }
}
