/**
 * `fetch`で得られる`Response`はimmutableで`headers`等を変更できないので、変更可能な`Response`を再作成する \
 * cf. https://developers.cloudflare.com/workers/examples/alter-headers
 * @param originalResponse `fetch`で得られた`Response`
 * @returns `originalResponse`と同じ内容を持ったmutableな`Response`
 */
export function convertToMutableResponse(originalResponse: Response): Response {
  return new Response(originalResponse.body, originalResponse);
}
