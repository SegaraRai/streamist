const IS_MAINTENANCE = false;

interface Env {
  readonly API_BASE_PATH: string;
  readonly API_ORIGIN_FOR_API_PROXY: string;
  readonly SECRET_API_PROXY_AUTH_TOKEN: string;
}

export const onRequest: PagesFunction<Env> = (context): Promise<Response> => {
  const { env, request } = context;

  if (IS_MAINTENANCE) {
    return Promise.resolve(
      new Response('down for maintenance', {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
        },
      })
    );
  }

  const { pathname, search } = new URL(request.url);
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
};
