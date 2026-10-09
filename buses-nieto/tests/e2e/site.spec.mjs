import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const SCANIA_WA = 'https://wa.me/5493549442500?text=Hola%20Buses%20Nieto%2C%20me%20interesa%20la%20unidad%20Scania%20Metalsur%202014%20(scania-metalsur-2014).';

// Every page load is watched for CSP violations, script errors and third-party requests (S7).
test.beforeEach(async ({ page }, testInfo) => {
  const problems = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('request', (request) => {
    const { hostname } = new URL(request.url());
    if (hostname !== '127.0.0.1') problems.push(`request a tercero: ${request.url()}`);
  });
  testInfo.problems = problems;
});

// eslint-disable-next-line no-empty-pattern -- Playwright needs the fixtures object even when unused.
test.afterEach(async ({}, testInfo) => {
  if (!testInfo.allowProblems) expect(testInfo.problems).toEqual([]);
});

async function openHome(page) {
  await page.goto('/');
  await expect(page.locator('#results-count')).toHaveText(/\d+ unidad/);
}

test('S1: sections appear in the dealer-site order and nav anchors resolve', async ({ page }) => {
  await openHome(page);
  await expect(page.locator('h1')).toHaveCount(1);
  const order = ['inicio', 'destacada', 'unidades', 'servicios', 'vender', 'vendidas', 'nosotros', 'contacto'];
  const tops = await Promise.all(order.map((id) => page.locator(`#${id}`).evaluate((el) => el.getBoundingClientRect().top + window.scrollY)));
  expect(tops).toEqual([...tops].sort((a, b) => a - b));
  for (const href of await page.locator('#site-nav a').evaluateAll((links) => links.map((a) => a.getAttribute('href')))) {
    await expect(page.locator(href)).toHaveCount(1);
  }
  await expect(page.locator('footer a[href="terminos.html"]')).toBeVisible();
});

test('S2: both WhatsApp lines are visible and linked', async ({ page }) => {
  await openHome(page);
  const contact = page.locator('#contacto');
  await expect(contact.getByRole('link', { name: /3549 442500/ })).toHaveAttribute('href', /^https:\/\/wa\.me\/5493549442500/);
  await expect(contact.getByRole('link', { name: /11 2511 3132/ })).toHaveAttribute('href', /^https:\/\/wa\.me\/5491125113132/);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('S3: the featured unit is readable from static HTML', async ({ page }) => {
    await page.goto('/');
    const featured = page.locator('#destacada');
    for (const text of ['Scania', 'Metalsur', 'Modelo 2014', 'Cama suite', 'Gomas 70%', 'Excelente estado', 'Listo para trabajar', 'U$S 90.000', 'Dólares estadounidenses', 'Posibilidad de financiación – Tomamos permutas', '2014', '43', 'Diésel']) {
      await expect(featured).toContainText(text);
    }
    await expect(featured.getByRole('link', { name: /Consultar por WhatsApp/ })).toHaveAttribute('href', SCANIA_WA);
  });
});

test('S3/S5: the flyer unit is in the catalog with its price and WhatsApp enquiry', async ({ page }) => {
  await openHome(page);
  const card = page.locator('#unit-grid [data-unit="scania-metalsur-2014"]');
  await expect(card).toContainText('U$S 90.000');
  const link = card.getByRole('link', { name: /Consultar/ });
  await expect(link).toHaveAttribute('href', SCANIA_WA);
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
});

test('S4: filters, search, sorting and the empty state', async ({ page }) => {
  await openHome(page);
  await page.selectOption('#f-type', 'minibus');
  await expect(page.locator('#results-count')).toHaveText('1 unidad');
  await page.click('#clear-filters');
  await page.selectOption('#f-sort', 'price-asc');
  await expect(page.locator('#unit-grid .unit-card__price').first()).toHaveText('U$S 24.000');
  await page.fill('#f-q', 'zzzz');
  await expect(page.locator('#empty-state')).toBeVisible();
  await expect(page.locator('#empty-state')).toContainText('No encontramos unidades con esos filtros');
  await page.click('#clear-filters');
  await expect(page.locator('#empty-state')).toBeHidden();
});

test('S4: the hero search applies its filters to the catalog', async ({ page }) => {
  await openHome(page);
  await page.selectOption('#hero-brand', 'Scania');
  await page.selectOption('#hero-price', '100000');
  await page.click('#hero-search button[type="submit"]');
  await expect(page.locator('#results-count')).toHaveText('1 unidad');
  await expect(page.locator('#f-brand')).toHaveValue('Scania');
});

test('S6: the sell form explains errors, then opens WhatsApp with the summary', async ({ page, context }) => {
  await context.route('https://wa.me/**', (route) => route.fulfill({ body: 'ok' }));
  await openHome(page);
  const form = page.locator('#sell-form');
  await form.getByRole('button', { name: /Enviar por WhatsApp/ }).click();
  await expect(page.locator('#sell-nombre-error')).toHaveText('Ingresá tu nombre.');
  await expect(page.locator('#sell-nombre')).toBeFocused();
  await expect(page.locator('#sell-asientos-error')).toHaveText('Ingresá la cantidad de asientos (1 a 90).');

  await page.fill('#sell-nombre', 'Juan Pérez');
  await page.fill('#sell-telefono', '3549 44-2500');
  await page.fill('#sell-unidad', 'Mercedes-Benz O500 Italbus');
  await page.fill('#sell-anio', '2012');
  await page.fill('#sell-asientos', '46');
  const popup = page.waitForEvent('popup');
  await form.getByRole('button', { name: /Enviar por WhatsApp/ }).click();
  const url = new URL((await popup).url());
  expect(url.origin + url.pathname).toBe('https://wa.me/5493549442500');
  expect(url.searchParams.get('text')).toContain('Unidad: Mercedes-Benz O500 Italbus');
  await expect(page.locator('#sell-status')).toContainText('abrimos WhatsApp');
});

test('S8: the unit dialog opens, browses photos, closes with Escape and returns focus', async ({ page }) => {
  await openHome(page);
  const trigger = page.locator('#unit-grid [data-open-unit="scania-metalsur-2014"]');
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Scania Metalsur 2014' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Ver foto 5 de 7' }).click();
  await expect(dialog.locator('.unit-dialog__main')).toHaveAttribute('src', /05-tablero\.webp$/);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('S8: no serious or critical accessibility violations, page and dialog', async ({ page }) => {
  await openHome(page);
  const scan = () => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const blocking = (result) => result.violations.filter((v) => ['serious', 'critical'].includes(v.impact)).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  expect(blocking(await scan())).toEqual([]);
  await page.locator('[data-open-unit="scania-metalsur-2014"]').first().click();
  expect(blocking(await scan())).toEqual([]);
});

test('S8: no horizontal scroll and a working menu on small screens', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'solo mobile');
  await openHome(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
  const toggle = page.getByRole('button', { name: 'Menú' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#site-nav').getByRole('link', { name: 'Vendidas' }).click();
  await expect(page.locator('#site-nav')).toBeHidden();
});

test('S10: example units are labelled as such', async ({ page }) => {
  await openHome(page);
  await expect(page.locator('#unit-grid [data-unit$="-ejemplo"] .badge--demo').first()).toHaveText('Unidad de ejemplo');
  await expect(page.locator('#unit-grid [data-unit="scania-metalsur-2014"] .badge--demo')).toHaveCount(0);
});

test('S7: a broken catalog file degrades gracefully', async ({ page }, testInfo) => {
  testInfo.allowProblems = true;
  await page.route('**/data/units.json', (route) => route.fulfill({ status: 500, body: '' }));
  await page.goto('/');
  await expect(page.locator('#results-count')).toContainText('No pudimos cargar el catálogo');
  await expect(page.locator('#destacada')).toContainText('U$S 90.000');
});

test('S1: the terms page loads with its own heading', async ({ page }) => {
  await page.goto('/terminos.html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Términos y condiciones');
});
