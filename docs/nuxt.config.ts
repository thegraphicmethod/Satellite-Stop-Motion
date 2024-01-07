import { resolve } from 'path';
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: true ,
  modules: [
    '@nuxt/content',
    '@nuxtjs/tailwindcss',
  ],
  content: {
    markdown: {
      // Object syntax can be used to override default options
      toc: {
         depth: 2, 
         searchDepth: 1 
      }
    }
}
})
