export type VueDraggableChangeEvent<T> =
  | {
      added: {
        element: T;
        newIndex: number;
      };
      removed: undefined;
      moved: undefined;
    }
  | {
      added: undefined;
      removed: {
        element: T;
        oldIndex: number;
      };
      moved: undefined;
    }
  | {
      added: undefined;
      removed: undefined;
      moved: {
        element: T;
        oldIndex: number;
        newIndex: number;
      };
    };
