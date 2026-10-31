import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  build: {
    format: 'directory'
  },
  devToolbar: {
    enabled: false
  },
  compressHTML: true,
  site: 'https://putria.dev'
});
