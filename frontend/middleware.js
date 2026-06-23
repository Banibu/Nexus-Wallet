import { rewrite } from '@vercel/functions';

export const config = {
  matcher: '/api/:path*',
};

export default function middleware(request) {
  const target = process.env.BACKEND_API_URL;

  if (!target) {
    return new Response(
      JSON.stringify({
        error: 'BACKEND_API_URL não configurado na Vercel',
      }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json',
        },
      },
    );
  }

  const url = new URL(request.url);
  const destination = new URL(url.pathname + url.search, target);

  return rewrite(destination);
}