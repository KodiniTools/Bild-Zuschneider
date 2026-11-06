import { watch } from 'vue';
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { i18n } from '@/i18n';
import { updateSeoMeta } from '@/composables/useSeoMeta';
import type { Locale } from '@/utils/localeSeo';
import HomeView from '@/views/HomeView.vue';

/**
 * Routen des Bild-Zuschneiders. Das Werkzeug liegt direkt auf `/` (Entscheidung
 * Schritt 0). Jede Route trägt ihre SEO-Texte in `meta.seo` (DE + EN); Canonical
 * und hreflang setzt useSeoMeta pro Route und Sprache.
 */
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      seo: {
        path: '/',
        title: 'Bilder online zuschneiden',
        description:
          'Bilder kostenlos im Browser zuschneiden: feste Seitenverhältnisse, exakte Pixelmaße, Drehen und Spiegeln. JPG, PNG, WebP und AVIF – lokal verarbeitet, ohne Upload.',
        en: {
          title: 'Crop Images Online',
          description:
            'Crop images for free in your browser: fixed aspect ratios, exact pixel sizes, rotate and flip. JPG, PNG, WebP and AVIF – processed locally, no upload.',
        },
      },
    },
  },
  {
    path: '/guide',
    name: 'guide',
    component: () => import('@/views/GuideView.vue'),
    meta: {
      seo: {
        path: '/guide',
        title: 'Anleitung',
        description:
          'Schritt für Schritt: Bild laden, Ausschnitt und Seitenverhältnis wählen, drehen, Format und Qualität einstellen und herunterladen.',
        en: {
          title: 'Guide',
          description:
            'Step by step: load an image, choose the crop and aspect ratio, rotate, set format and quality, and download.',
        },
      },
    },
  },
  {
    path: '/faq',
    name: 'faq',
    component: () => import('@/views/FaqView.vue'),
    meta: {
      seo: {
        path: '/faq',
        title: 'Häufig gestellte Fragen (FAQ)',
        description:
          'Antworten zum Bild-Zuschneider: unterstützte Formate, Datenschutz, Seitenverhältnisse, Qualität und Bildgröße.',
        en: {
          title: 'Frequently Asked Questions (FAQ)',
          description:
            'Answers about Image Cropper: supported formats, privacy, aspect ratios, quality and image size.',
        },
      },
    },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: {
      seo: {
        path: '/about',
        title: 'Über den Bild-Zuschneider',
        description:
          'Der Bild-Zuschneider von KodiniTools verarbeitet Bilder ausschließlich lokal im Browser – kein Upload, keine Speicherung, DSGVO-konform.',
        en: {
          title: 'About Image Cropper',
          description:
            'Image Cropper by KodiniTools processes images entirely in your browser – no upload, no storage, GDPR-compliant.',
        },
      },
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: {
      seo: {
        path: '/404',
        title: 'Seite nicht gefunden',
        description: 'Die angeforderte Seite wurde nicht gefunden.',
        noIndex: true,
        en: { title: 'Page not found', description: 'The requested page was not found.' },
      },
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 };
  },
  routes,
});

const activeLocale = () => i18n.global.locale.value as Locale;

// SEO-Meta bei jedem Routenwechsel ...
router.afterEach((to) => {
  if (to.meta.seo) updateSeoMeta(to.meta.seo, activeLocale());
});

// ... und bei jedem Sprachwechsel für die aktuelle Route
watch(activeLocale, (locale) => {
  const seo = router.currentRoute.value.meta.seo;
  if (seo) updateSeoMeta(seo, locale);
});

export default router;
