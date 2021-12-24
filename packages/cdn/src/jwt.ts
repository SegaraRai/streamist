import { decodeBase64 } from '$shared/base64';
import {
  algorithm,
  cdnAudience,
  clockTolerance,
  issuer,
} from '$shared/config/jwt';
import { hasAudience } from '$shared/jwt';

export interface JWTRawData {
  /** ヘッダー部 */
  header$$q: string;
  /** ペイロード部 */
  payload$$q: string;
  /** 署名部 */
  signature$$q: string;
}

export interface JWTHeader {
  alg: string;
  typ: string;
}

export interface JWTPayload {
  iss?: string;
  sub?: string;
  aud?: string;
  exp?: number;
  nbf?: number;
  iat?: number;
}

export interface JWTToken {
  /** 生のJWT */
  raw$$q: JWTRawData;
  /** パースしたヘッダー部 */
  header$$q: JWTHeader;
  /** パースしたペイロード部 */
  payload$$q: JWTPayload;
  /** デコードしたペイロード部 */
  signature$$q: ArrayBuffer;
}

/**
 * JWT検証用の公開鍵の`PromiseLike` \
 * `Promise`にしているのは並列処理を行う場合に複数の生成処理が走らないようにするため \
 * `PromiseLike`にしているのは`crypto.subtle.importKey`が返すものが`PromiseLike`なため
 */
let publicKeyPromise: PromiseLike<CryptoKey> | null = null;

/**
 * JWTをパースする \
 * この関数では有効期限や署名の検証は行わない \
 * JWTが不正な場合は`null`を返す
 * @param strJWT JWT
 * @returns パースしたJWTまたは`null`
 */
export function parse(strJWT: string): JWTToken | null {
  try {
    const [header, payload, signature, ...extraData] = strJWT
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .split('.');
    if (!header || !payload || !signature || extraData.length > 0) {
      // throw new Error('invalid JWT');
      return null;
    }

    // NOTE: JSONがLatin1範囲外の文字を含む場合、atobは使用できないため変更すること
    // 現状はLatin1文字しか用いられないはず

    return {
      header$$q: JSON.parse(atob(header)) as JWTHeader,
      payload$$q: JSON.parse(atob(payload)) as JWTPayload,
      signature$$q: decodeBase64(signature),
      raw$$q: {
        header$$q: header,
        payload$$q: payload,
        signature$$q: signature,
      },
    };
  } catch (_error) {
    // 失敗したらnullを返す
    // JSON.parseとか諸々で例外が出る可能性があるため
  }

  return null;
}

/**
 * パースしたJWTの種類、有効期限、発行元、発行先、署名を検証し、JWTが有効かどうかを返す
 * @param jwt パースしたJWT
 * @returns JWTが有効なら`true`、無効なら`false`
 */
export async function isValid(jwt: JWTToken): Promise<boolean> {
  try {
    const currentTime = Math.floor(Date.now() / 1000);

    // check header
    /// /////////////////////////////////////////////////////////////////////////////

    if (!jwt.header$$q) {
      throw new Error('invalid header provided');
    }

    // check typ
    if (jwt.header$$q.typ !== 'JWT') {
      throw new Error('invalid typ provided');
    }

    // check alg
    if (jwt.header$$q.alg !== algorithm) {
      throw new Error('invalid alg provided');
    }

    // check payload
    /// /////////////////////////////////////////////////////////////////////////////

    // check expiration
    // We don't issue JWT tokens without "exp" claim
    if (
      !jwt.payload$$q.exp ||
      jwt.payload$$q.exp + clockTolerance <= currentTime
    ) {
      throw new Error('token expired');
    }

    // check nbf (if any)
    if (
      jwt.payload$$q.nbf != null &&
      jwt.payload$$q.nbf - clockTolerance > currentTime
    ) {
      throw new Error('token not yet available');
    }

    // check iat
    // We don't issue JWT tokens without "iat" claim
    if (
      !jwt.payload$$q.iat ||
      jwt.payload$$q.iat - clockTolerance > currentTime
    ) {
      throw new Error('invalid iat provided');
    }

    // check issuer
    // We don't issue JWT tokens without "iss" claim
    if (jwt.payload$$q.iss !== issuer) {
      throw new Error('invalid iss provided');
    }

    // check audience
    // We don't issue JWT tokens without "aud" claim
    if (!hasAudience(jwt.payload$$q.aud, cdnAudience)) {
      throw new Error('invalid aud provided');
    }

    // check signature
    /// /////////////////////////////////////////////////////////////////////////////

    // check signature
    if (!jwt.signature$$q || !(jwt.signature$$q instanceof ArrayBuffer)) {
      throw new Error('invalid signature provided');
    }

    // prepare key for verifying signature
    if (!publicKeyPromise) {
      publicKeyPromise = crypto.subtle.importKey(
        'spki',
        Uint8Array.from(SECRET_JWK_PUBLIC_KEY_SPKI_ARRAY),
        {
          name: 'ECDSA',
          namedCurve: 'P-521',
        },
        false,
        ['verify']
      );
    }

    // check signature
    if (
      !(await crypto.subtle.verify(
        {
          name: 'ECDSA',
          hash: 'SHA-256',
        },
        await publicKeyPromise,
        jwt.signature$$q,
        new TextEncoder().encode(
          `${jwt.raw$$q.header$$q}.${jwt.raw$$q.payload$$q}`
        )
      ))
    ) {
      throw new Error('invalid signature provided');
    }

    // OK
    /// /////////////////////////////////////////////////////////////////////////////

    return true;
  } catch (_error) {
    // 失敗したらfalse
  }

  return false;
}
