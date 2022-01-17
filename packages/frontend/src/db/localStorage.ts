import type { Serializer } from '@vueuse/core';
import type { ResourceUser } from '$/types';

function _useLocalStorageDB() {
  const serializer: Serializer<any> = {
    read: (v: string): any => (v ? JSON.parse(v) : undefined),
    write: (v: any): string => (v !== undefined ? JSON.stringify(v) : ''),
  };
  const dbUser = useLocalStorage<ResourceUser | null>('db.user', null, {
    writeDefaults: false,
    serializer,
  });
  return {
    dbUser$$q: dbUser,
    dbUserId$$q: eagerComputed(() => dbUser.value?.id ?? null),
    dbMaxTrackId$$q: eagerComputed(() => dbUser.value?.maxTrackId ?? null),
    dbLastUpdate$$q: useLocalStorage<number>('db.lastUpdate', 0, {
      writeDefaults: false,
      serializer: {
        read: (v: string): number => (v ? parseInt(v, 10) : 0),
        write: (v: number): string => String(v),
      },
    }),
    dbNextSince$$q: useLocalStorage<number>('db.nextSince', 0, {
      writeDefaults: false,
      serializer: {
        read: (v: string): number => (v ? parseInt(v, 10) : 0),
        write: (v: number): string => String(v),
      },
    }),
    dbUpdating$$q: useLocalStorage<boolean>('db.updating', false, {
      writeDefaults: true,
      serializer: {
        read: (v: string): boolean => v === '1',
        write: (v: boolean): string => (v ? '1' : '0'),
      },
    }),
  };
}

export const useLocalStorageDB = createSharedComposable(_useLocalStorageDB);
