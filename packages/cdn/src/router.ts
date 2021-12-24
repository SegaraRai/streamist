/**
 * Helper functions that when passed a request will return a
 * boolean indicating if the request uses that HTTP method,
 * header, host or referrer.
 */

import { createResponseNotFound } from './response';

type Condition = (req: Request) => boolean;
type Handler = (req: Request) => Response | Promise<Response>;

type PathCondition = string | RegExp;

const Method = (method: string): Condition => (req: Request): boolean =>
  req.method.toUpperCase() === method;
const Connect: Condition = /*@__PURE__*/ Method('CONNECT');
const Delete: Condition = /*@__PURE__*/ Method('DELETE');
const Get: Condition = /*@__PURE__*/ Method('GET');
const Head: Condition = /*@__PURE__*/ Method('HEAD');
const Options: Condition = /*@__PURE__*/ Method('OPTIONS');
const Patch: Condition = /*@__PURE__*/ Method('PATCH');
const Post: Condition = /*@__PURE__*/ Method('POST');
const Put: Condition = /*@__PURE__*/ Method('PUT');
const Trace: Condition = /*@__PURE__*/ Method('TRACE');

/*
const Header = (header: string, val: string): Condition =>
  (request: Request) => request.headers.get(header) === val;
const Host = (host: string): Condition => Header('host', host.toLowerCase());
//*/

const Path = (target: PathCondition) => (req: Request): boolean => {
  const url = new URL(req.url);

  const pathname = url.pathname;

  if (typeof target === 'string') {
    return pathname === target;
  }

  return target.test(pathname);
};

interface Route {
  conditions$$q: Condition[] | null | undefined;
  handler$$q: Handler;
}

/**
 * The Router handles determines which handler is matched given the
 * conditions present for each request.
 */
export class Router {
  private routes$$q: Route[] = [];

  handle$$q(
    conditions: Condition[] | null | undefined,
    handler: Handler
  ): this {
    this.routes$$q.push({
      conditions$$q: conditions,
      handler$$q: handler,
    });
    return this;
  }

  connect$$q(url: PathCondition, handler: Handler): this {
    return this.handle$$q([Connect, Path(url)], handler);
  }

  delete$$q(url: PathCondition, handler: Handler): this {
    return this.handle$$q([Delete, Path(url)], handler);
  }

  get$$q(url: PathCondition, handler: Handler): this {
    return this.handle$$q([Get, Path(url)], handler);
  }

  head$$q(url: PathCondition, handler: Handler): this {
    return this.handle$$q([Head, Path(url)], handler);
  }

  options$$q(url: PathCondition, handler: Handler): this {
    return this.handle$$q([Options, Path(url)], handler);
  }

  patch$$q(url: PathCondition, handler: Handler): this {
    return this.handle$$q([Patch, Path(url)], handler);
  }

  post$$q(url: PathCondition, handler: Handler): this {
    return this.handle$$q([Post, Path(url)], handler);
  }

  put$$q(url: PathCondition, handler: Handler): this {
    return this.handle$$q([Put, Path(url)], handler);
  }

  trace$$q(url: PathCondition, handler: Handler): this {
    return this.handle$$q([Trace, Path(url)], handler);
  }

  all$$q(handler: Handler): this {
    return this.handle$$q(null, handler);
  }

  route$$q(request: Request): Response | Promise<Response> {
    const route = this.resolve$$q(request);

    if (route) {
      return route.handler$$q(request);
    }

    return createResponseNotFound();
  }

  /**
   * resolve returns the matching route for a request that returns
   * true for all conditions (if any).
   */
  resolve$$q(request: Request): Route | undefined {
    return this.routes$$q.find((route) =>
      (route.conditions$$q || []).every((condition) => condition(request))
    );
  }
}
