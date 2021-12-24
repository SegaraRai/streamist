import colors from 'windicss/colors';
import { defineConfig } from 'windicss/helpers';
import aspectRatio from 'windicss/plugin/aspect-ratio';
import filters from 'windicss/plugin/filters';
import lineClamp from 'windicss/plugin/line-clamp';
import scrollSnap from 'windicss/plugin/scroll-snap';
import typography from 'windicss/plugin/typography';

export default defineConfig({
  darkMode: 'class',
  // https://windicss.org/posts/v30.html#attributify-mode
  attributify: true,

  plugins: [aspectRatio, filters, lineClamp, scrollSnap, typography()],
  theme: {
    screens: {
      sm: '600px',
      md: '960px',
      lg: '1280px',
      xl: '1920px',
      '2xl': '2560px',
      g_2xs_xs: '300px',
      g_xs_sm: '450px',
      g_sm_md: '780px',
      g_md_lg: '1120px',
      g_lg_xl: '1600px',
      g_xl_2xl: '2240px',
    },
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '65ch',
            color: 'inherit',
            a: {
              color: 'inherit',
              opacity: 0.75,
              fontWeight: '500',
              textDecoration: 'underline',
              '&:hover': {
                opacity: 1,
                color: colors.teal[600],
              },
            },
            b: { color: 'inherit' },
            strong: { color: 'inherit' },
            em: { color: 'inherit' },
            h1: { color: 'inherit' },
            h2: { color: 'inherit' },
            h3: { color: 'inherit' },
            h4: { color: 'inherit' },
            code: { color: 'inherit' },
          },
        },
      },
    },
  },
});
