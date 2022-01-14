const IS_MAINTENANCE = false;

export default {
  fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      if (IS_MAINTENANCE) {
        return new Response('down for maintenance', {
          status: 503,
          headers: {
            'Cache-Control': 'no-store',
          },
        });
      } else {
        const newRequest = new Request(
          `${env.BACKEND_API_ORIGIN}${url.pathname}${url.search}`,
          request
        );
        newRequest.headers.set(
          'X-Backend-Authorization',
          `Bearer ${env.BACKEND_API_TOKEN}`
        );
        newRequest.headers.set(
          'X-Backend-CF-Connecting-IP',
          request.headers.get('cf-connecting-ip')
        );
        return fetch(newRequest);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
