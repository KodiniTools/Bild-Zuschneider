/**
 * Unit-Setup: Wie in index.html gibt es ein #overlay-root als Teleport-Ziel für
 * UiDialog und ColorField. Tests, die document.body leeren, bekommen es vor
 * jedem Test zurück.
 */
import { beforeEach } from 'vitest';

beforeEach(() => {
  // Specs mit @vitest-environment node haben kein DOM
  if (typeof document === 'undefined') return;
  if (!document.getElementById('overlay-root')) {
    const root = document.createElement('div');
    root.id = 'overlay-root';
    document.body.appendChild(root);
  }
});
