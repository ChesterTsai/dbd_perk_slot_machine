import { createRouter, createWebHistory } from 'vue-router'
import type { RouteLocationNormalized } from 'vue-router'
import Home from './views/Home.vue'
import Survivor from './views/Survivor.vue'
import Killer from './views/Killer.vue'
import NotFoundComponent from './views/NotFoundComponent.vue'
import perkNames from './generated/perks.json'

const confParams = (route: RouteLocationNormalized) => ({
  color: route.query.color === '1',
  sids: route.query.sids ? (route.query.sids as string).split(',') : [],
  kids: route.query.kids ? (route.query.kids as string).split(',') : [],
  lang: route.query.lang ? (route.query.lang as string).charAt(0).toUpperCase() + (route.query.lang as string).toLowerCase().slice(1) : 'En',
  killerPerkNames: perkNames.killer,
  survivorPerkNames: perkNames.survivor
})

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      props: confParams
    },
    {
      path: '/survivor',
      name: 'survivor',
      component: Survivor,
      props: confParams
    },
    {
      path: '/killer',
      name: 'killer',
      component: Killer,
      props: confParams
    },
    { path: '/:pathMatch(.*)*', component: NotFoundComponent }
  ]
})
