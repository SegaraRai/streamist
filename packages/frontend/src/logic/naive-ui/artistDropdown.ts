import type { MenuOption } from 'naive-ui';
import type { ComputedRef, Ref } from 'vue';
import type { ResourceArtist } from '$/types';
import { nCreateDropdownIcon, nCreateDropdownTextColorStyle } from './dropdown';

export interface ArtistDropdownCreateOptions {
  readonly artist$$q: Readonly<Ref<ResourceArtist | null | undefined>>;
  readonly openEditArtistDialog$$q?: () => void;
  readonly openMergeArtistDialog$$q?: () => void;
  readonly closeMenu$$q: () => void;
}

export function createArtistDropdown({
  artist$$q,
  openEditArtistDialog$$q,
  openMergeArtistDialog$$q,
  closeMenu$$q,
}: ArtistDropdownCreateOptions): ComputedRef<MenuOption[]> {
  const { t } = useI18n();

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
            openEditArtistDialog$$q();
            closeMenu$$q();
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
            openMergeArtistDialog$$q();
            closeMenu$$q();
          },
        },
      });
    }

    return menuItems;
  });
}
