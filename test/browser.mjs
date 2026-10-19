import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createDemoServer } from '../bin/serve.js';
import { message } from '../src/i18n.js';
const server = createDemoServer();
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const browser = await chromium.launch({ headless: true });
const origin = 'http://127.0.0.1:' + server.address().port;
const output = new URL('../output/', import.meta.url);
await mkdir(output, { recursive: true });
try {
  for (const locale of ['fr', 'en', 'es']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(origin + '/?lang=' + locale);
    await page.waitForSelector('body[data-ready="true"]');
    assert.equal(await page.locator('html').getAttribute('lang'), locale);
    assert.equal(await page.locator('h1').textContent(), message('title', locale));
    assert.equal(await page.locator('#notice').textContent(), message('notice', locale));
    const initial = JSON.parse(await page.locator('#report').textContent());
    assert.equal(initial.locale, locale);
    assert.ok(await page.locator('#chart svg').count());
    assert.equal(initial.numerics.smallRatioThreshold, 0.05);
    assert.ok(
      (await page.locator('#findings').textContent()).includes(message('numericalMethod', locale)),
    );
    const edge = structuredClone(initial.inputs);
    Object.assign(edge, {
      busVoltageV: 10000,
      clampVoltageV: 20000,
      inductanceUh: 100000,
      faultResistanceOhm: 1e-5,
      loadCurrentA: 1e-6,
      detectionUs: 0,
    });
    edge.devices = edge.devices.map((d) => ({ ...d, openingUs: 0, onResistanceOhm: 1e-9 }));
    await page
      .locator('summary')
      .filter({ hasText: message('inputData', locale) })
      .evaluate((el) => (el.parentElement.open = true));
    await page.locator('#input').fill(JSON.stringify(edge));
    await page.locator('#apply').click();
    const stable = JSON.parse(await page.locator('#report').textContent());
    assert.ok(Math.abs(stable.devices[0].clampEnergyJ / 1e-13 - 1) < 1e-10);
    assert.equal(stable.locale, locale);
    await page.locator('#reset').click();
    const peak = initial.devices[2].peakCurrentA;
    await page.locator('#control-detectionUs').fill('100');
    await page.locator('#form button[type=submit]').click();
    assert.ok(
      JSON.parse(await page.locator('#report').textContent()).devices[2].peakCurrentA > peak,
    );
    const download = page.waitForEvent('download');
    await page.locator('#download').click();
    const file = await download;
    const data = JSON.parse(await readFile(await file.path(), 'utf8'));
    assert.equal(data.locale, locale);
    const svgDownload = page.waitForEvent('download');
    await page.locator('#download-svg').click();
    assert.match(await readFile(await (await svgDownload).path(), 'utf8'), /<svg/);
    await page.locator('#reset').click();
    await page
      .locator('summary')
      .filter({ hasText: message('inputData', locale) })
      .evaluate((el) => (el.parentElement.open = true));
    await page.locator('#input').fill('{broken');
    await page.locator('#apply').click();
    assert.equal(await page.locator('#status').textContent(), message('invalidJson', locale));
    assert.equal(JSON.parse(await page.locator('#report').textContent()).locale, locale);
    await page.locator('#reset').click();
    const user = JSON.parse(await page.locator('#input').inputValue());
    user.origin = 'user';
    await page
      .locator('summary')
      .filter({ hasText: message('inputData', locale) })
      .evaluate((el) => (el.parentElement.open = true));
    await page.locator('#input').fill(JSON.stringify(user));
    await page.locator('#apply').click();
    assert.equal(JSON.parse(await page.locator('#report').textContent()).locale, locale);
    await page.locator('#locale').selectOption(locale === 'fr' ? 'en' : 'fr');
    await page.locator('#locale').selectOption(locale);
    assert.equal(await page.locator('h1').textContent(), message('title', locale));
    assert.equal(await page.locator('body').evaluate((el) => el.scrollWidth <= innerWidth), true);
    await page.locator('#reset').click();
    await page
      .locator('summary')
      .filter({ hasText: message('inputData', locale) })
      .evaluate((el) => (el.parentElement.open = false));
    await page.screenshot({
      path: new URL('switchbench' + '-' + locale + '.png', output).pathname,
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.locator('body').evaluate((el) => el.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    await page.close();
  }
  const response = await fetch(origin + '/bin/cli.js');
  assert.equal(response.status, 404);
  console.log(
    'FR : parcours navigateur FR/EN/ES vérifiés. EN: FR/EN/ES browser flows verified. ES: flujos FR/EN/ES verificados.',
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
