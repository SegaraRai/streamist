import type { MenuOption } from 'naive-ui';
import type { ComputedRef, Ref } from 'vue';
import type { ResourceArtist } from '$/types';
import {
  nCreateDropdownIcon,
  nCreateDropdownTextColorStyle,
} from '~/logic/naiveUI/dropdown';
import { cleanupDividers } from './utils';

export interface NDropdownArtistCreateOptions {
  readonly artist$$q: Readonly<Ref<ResourceArtist | null | undefined>>;
  readonly openEditArtistDialog$$q?: () => void;
  readonly openMergeArtistDialog$$q?: () => void;
  readonly closeMenu$$q: () => void;
}

export function useNDropdownArtist({
  artist$$q,
  openEditArtistDialog$$q,
  openMergeArtistDialog$$q,
  closeMenu$$q,
}: NDropdownArtistCreateOptions): ComputedRef<MenuOption[]> {
  const { t } = useI18n();

  const delayedCloseMenu = (): void => {
    setTimeout((): void => closeMenu$$q(), 0);
  };

  return computed((): MenuOption[] => {
    if (!artist$$q.value) {
      return [];
    }

    const menuItems: MenuOption[] = [];

    // Edit
    if (openEditArtistDialog$$q) {
      menuItems.push({
        key: 'edit',
        label: t('dropdown.artist.Edit'),
        icon: nCreateDropdownIcon('mdi-pencil'),
        props: {
          onClick: (): void => {
            delayedCloseMenu();
            openEditArtistDialog$$q();
          },
        },
      });
    }

    // Merge
    if (openMergeArtistDialog$$q) {
      menuItems.push({
        key: 'merge',
        label: t('dropdown.artist.Merge'),
        icon: nCreateDropdownIcon('mdi-merge'),
        props: {
          style: nCreateDropdownTextColorStyle('warning'),
          onClick: (): void => {
            delayedCloseMenu();
            openMergeArtistDialog$$q();
          },
        },
      });
    }

    return cleanupDividers(menuItems);
  });
}
