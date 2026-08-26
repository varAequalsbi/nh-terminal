import { describe, expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';

describe('mobile calendar layout regression', () => {
  test('impact filters and time pills cannot wrap character-by-character', async () => {
    const css = await readFile('src/components/Market/market.css', 'utf8');
    const mobileRules = css.slice(css.lastIndexOf('@media (max-width: 650px)'));

    expect(mobileRules).toContain('.calendar-filters button.compact');
    expect(mobileRules).toContain('white-space: nowrap');
    expect(mobileRules).toContain('overflow-wrap: normal');
    expect(mobileRules).toContain('.cal-time');
    expect(mobileRules).toContain('flex: 0 0 86px');
  });

  test('calendar details and mobile dropdowns remain responsive', async () => {
    const css = await readFile('src/components/Market/market.css', 'utf8');
    expect(css).toContain('.event-details');
    expect(css).toContain('.calendar-data-state');
    expect(css).toContain('.calendar-filters select');
    expect(css).toContain('grid-template-columns:1fr');
  });
});
