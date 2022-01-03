export function calcMenuPositionByEvent(
  event: MouseEvent
): [x: number, y: number] {
  return [event.clientX, event.clientY];
}

export function calcMenuPositionByElement(
  element: HTMLElement
): [x: number, y: number] {
  const rect = element.getBoundingClientRect();
  return [(rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2];
}
