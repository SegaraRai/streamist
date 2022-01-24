const IS_MAINTENANCE = false;

export default {
  /**
   * @param {Request} request
   * @returns {Promise<Response>}
   */
  fetch(request, env) {
    const { pathname, search } = new URL(request.url);
    if (pathname.startsWith('/api/')) {
      if (IS_MAINTENANCE) {
        return new Response('down for maintenance', {
          status: 503,
          headers: {
            'Cache-Control': 'no-store',
          },
        });
      } else {
        const rewrittenPathname = pathname.replace(
          /^\/api\//,
          `/${env.API_BASE_PATH}/`
        );
        const newRequest = new Request(
          `${env.API_ORIGIN_FOR_API_PROXY}${rewrittenPathname}${search}`,
          request
        );
        for (const [key, value] of request.headers.entries()) {
          if (/^cf-/i.test(key)) {
            newRequest.headers.set(`Streamist-Forwarded-${key}`, value);
          }
        }
        newRequest.headers.set(
          'Streamist-Proxy-Authorization',
          `Bearer ${env.SECRET_API_PROXY_AUTH_TOKEN}`
        );
        return fetch(newRequest);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
