import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from '@/views/HomeView.vue';

/**
 * Routen des Bild-Zuschneiders. Das Werkzeug liegt direkt auf `/`
 * (Entscheidung Schritt 0); SEO-Meta pro Route folgt in Schritt 3.
 */
export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/guide', name: 'guide', component: () => import('@/views/GuideView.vue') },
  { path: '/faq', name: 'faq', component: () => import('@/views/FaqView.vue') },
  { path: '/about', name: 'about', component: () => import('@/views/AboutView.vue') },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 };
  },
  routes,
});

export default router;
