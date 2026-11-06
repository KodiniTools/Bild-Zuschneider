import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import AppIcon from '@/components/ui/AppIcon.vue';
import { iconMap, type IconName } from '@/components/ui/iconMap';

describe('AppIcon', () => {
  it('rendert ein dekoratives Lucide-SVG mit stroke-width 1.75 und 16 px', () => {
    const wrapper = mount(AppIcon, { props: { name: 'crop' } });
    const svg = wrapper.get('svg');
    expect(svg.attributes('aria-hidden')).toBe('true');
    expect(svg.attributes('stroke-width')).toBe('1.75');
    expect(svg.attributes('width')).toBe('16');
    expect(svg.classes()).toContain('app-icon');
  });

  it('übernimmt Größe und Dreh-Animation', () => {
    const wrapper = mount(AppIcon, { props: { name: 'loader-circle', size: 20, spin: true } });
    expect(wrapper.get('svg').attributes('width')).toBe('20');
    expect(wrapper.get('svg').classes()).toContain('app-icon--spin');
  });

  it.each(Object.keys(iconMap) as IconName[])('rendert %s', (name) => {
    expect(mount(AppIcon, { props: { name } }).find('svg').exists()).toBe(true);
  });
});
