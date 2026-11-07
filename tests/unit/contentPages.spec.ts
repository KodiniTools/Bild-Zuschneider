import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { i18n } from '@/i18n';
import { routes } from '@/router';
import AboutView from '@/views/AboutView.vue';
import FaqView from '@/views/FaqView.vue';
import GuideView from '@/views/GuideView.vue';
import HomeSeoText from '@/components/content/HomeSeoText.vue';

const router = createRouter({ history: createMemoryHistory(), routes });
const global = { plugins: [i18n, router] };

beforeEach(() => {
  i18n.global.locale.value = 'de';
});

describe('FaqView', () => {
  it('öffnet und schließt Antworten mit aria-expanded', async () => {
    const wrapper = mount(FaqView, { global });
    const questions = wrapper.findAll('.faq__question');
    expect(questions).toHaveLength(10);
    expect(questions[0]!.attributes('aria-expanded')).toBe('true');
    expect(questions[1]!.attributes('aria-expanded')).toBe('false');
    await questions[1]!.trigger('click');
    expect(questions[1]!.attributes('aria-expanded')).toBe('true');
    expect(wrapper.get(`#${questions[1]!.attributes('aria-controls')}`).isVisible()).toBe(true);
    await questions[0]!.trigger('click');
    expect(questions[0]!.attributes('aria-expanded')).toBe('false');
    wrapper.unmount();
  });

  it('setzt FAQPage-JSON-LD in der aktuellen Sprache und entfernt es wieder', async () => {
    const wrapper = mount(FaqView, { global });
    const data = () => JSON.parse(document.getElementById('faq-jsonld')!.textContent!);
    expect(data()['@type']).toBe('FAQPage');
    expect(data().mainEntity).toHaveLength(10);
    expect(data().mainEntity[0].name).toBe('Wird mein Bild hochgeladen?');
    i18n.global.locale.value = 'en';
    await nextTick();
    expect(data().mainEntity[0].name).toBe('Is my image uploaded?');
    wrapper.unmount();
    expect(document.getElementById('faq-jsonld')).toBeNull();
  });

  it('jede Frage ist eine h2 (Überschriftenfolge)', () => {
    const wrapper = mount(FaqView, { global });
    expect(wrapper.findAll('h2.faq__heading')).toHaveLength(10);
    wrapper.unmount();
  });
});

describe('GuideView / AboutView / HomeSeoText', () => {
  it('Anleitung: fünf nummerierte Schritte und eine Tastentabelle', () => {
    const wrapper = mount(GuideView, { global });
    expect(wrapper.findAll('.guide-steps__item')).toHaveLength(5);
    expect(wrapper.findAll('tbody tr')).toHaveLength(7);
    expect(wrapper.text()).toContain('Strg + Z');
  });

  it('Über: verlinkt die verwandten Werkzeuge', () => {
    const wrapper = mount(AboutView, { global });
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'));
    expect(hrefs).toEqual(['/bildkonverter/', '/bilderseriebearbeiten/']);
  });

  it('SEO-Text: Funktionen und Links zu Anleitung und FAQ', () => {
    const wrapper = mount(HomeSeoText, { global });
    expect(wrapper.findAll('.home-seo__features li')).toHaveLength(6);
    const links = wrapper.findAll('a').map((a) => a.text());
    expect(links).toEqual(['Anleitung', 'FAQ']);
  });
});
