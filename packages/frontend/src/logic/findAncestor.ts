/**
 * 条件を満たす要素を祖先に辿って検索する \
 * `element`自体も含む
 * @param element 要素
 * @param condition 条件を満たすかを検査するコールバック関数、満たすなら`true`を返す
 * @returns 条件を満たす祖先要素、存在しない場合は`null`
 */
export function findAncestor(
  element: HTMLElement | null | undefined,
  condition: (element: HTMLElement) => boolean
): HTMLElement | null {
  while (element && !condition(element)) {
    element = element.parentElement;
  }
  return element || null;
}
