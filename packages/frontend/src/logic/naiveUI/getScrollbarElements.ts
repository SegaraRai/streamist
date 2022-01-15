import type { ScrollbarInst } from 'naive-ui';
import type { ScrollbarInst as InternalScrollbarInst } from 'naive-ui/lib/_internal/scrollbar';

export function getNaiveUIScrollbarElements(scrollbarInst: ScrollbarInst) {
  const internalInst = (scrollbarInst as any)
    .scrollbarInstRef as InternalScrollbarInst;
  return {
    container$$q: internalInst.containerRef,
    content$$q: internalInst.contentRef,
  };
}
