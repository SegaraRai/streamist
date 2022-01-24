const IS_MAINTENANCE = false;

export default {
  /**
   * @param {Request} request
   * @returns {Promise<Response>}
   */
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
        for (const [key, value] of request.headers.entries()) {
          if (/^cf-/i.test(key)) {
            newRequest.headers.set(`Streamist-Forwarded-${key}`, value);
          }
        }
        newRequest.headers.set(
          'Streamist-Proxy-Authorization',
          `Bearer ${env.BACKEND_API_TOKEN}`
        );
        return fetch(newRequest);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
