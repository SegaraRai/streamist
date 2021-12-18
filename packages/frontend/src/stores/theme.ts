import { acceptHMRUpdate, defineStore } from 'pinia';

export type Theme = 'light' | 'dark';

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: 'dark' as Theme,
  }),
  getters: {
    bgClass: (state) => {
      return state.theme === 'light' ? 'white' : 'gray darken-4';
    },
    headerTheme: (state) => state.theme,
    leftSidebarTheme: (state) => state.theme,
    rightSidebarTheme: (state) => state.theme,
    contentTheme: (state) => state.theme,
    footerTheme: (state) => state.theme,
    dialogTheme: (state) => state.theme,
  },
  actions: {
    toggle() {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useThemeStore, import.meta.hot));
}
