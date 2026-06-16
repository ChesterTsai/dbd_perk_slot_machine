import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './i18n'

const app = createApp(App)
  .use(router)
  .use(i18n)

// vue-router 4 resolves the initial navigation asynchronously; wait for it
// so App.vue's mounted hook sees the query params (e.g. ?lang=de) like it
// did with vue-router 3
router.isReady().then(() => app.mount('#app'))
