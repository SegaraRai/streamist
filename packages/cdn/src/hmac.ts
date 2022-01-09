import { arrayBufferToHex } from '$shared/arrayBufferToHex';

/**
 * HMAC生成用のキーの`PromiseLike` \
 * わざわざ`PromiseLike`にしているのは並列処理で重複して生成が行われないようにするため
 */
let hmacKeyPromise: PromiseLike<CryptoKey> | undefined;

/**
 * HMACのMAC値を計算する
 * @param message メッセージ
 * @returns MAC値
 */
export async function calculateHMAC(
  secret: string,
  message: string
): Promise<string> {
  if (!hmacKeyPromise) {
    hmacKeyPromise = crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      {
        name: 'HMAC',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );
  }

  return arrayBufferToHex(
    await crypto.subtle.sign(
      'HMAC',
      await hmacKeyPromise,
      new TextEncoder().encode(message)
    )
  );
}
