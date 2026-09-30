/**
 * Foundation card (admin_only): signup is gone, the shell requires a session,
 * and admin screens are reachable only by ADMIN. Every /api/** call is mocked.
 */
import { test, expect, type Page } from '@playwright/test';

async function mockApi(page: Page, role: 'USER' | 'ADMIN'): Promise<void> {
  let user: { id: string; email: string; name: string; role: string } | null = null;
  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const method = req.method().toUpperCase();
    const apiPath = new URL(req.url()).pathname.replace(/^.*\/api\//, '');
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (method === 'POST' && apiPath === 'auth/login') {
      user = { id: '1', email: `${role.toLowerCase()}@example.com`, name: role, role };
      return json(user);
    }
    if (method === 'GET' && (apiPath === 'users/me' || apiPath === 'auth/me')) {
      return user ? json(user) : json({ message: 'Unauthorized' }, 401);
    }
    if (method === 'GET') return json([]);
    return json({ ok: true });
  });
}

async function login(page: Page): Promise<void> {
  await page.goto('/#/login');
  await page.locator('#email').fill('someone@example.com');
  await page.locator('#password').fill('password1234');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/#\/(dashboard|admin)/, { timeout: 10_000 });
}

test.use({ serviceWorkers: 'block' });

test('signup deep links land on the login page', async ({ page }) => {
  await mockApi(page, 'USER');
  for (const url of ['/#/signup', '/#/signup/1', '/#/signup/2']) {
    await page.goto(url);
    await expect(page).toHaveURL(/#\/login/);
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('app-signup')).toHaveCount(0);
  }
});

test('signed-out visitors are sent to login from protected routes', async ({ page }) => {
  await mockApi(page, 'USER');
  for (const r of ['dashboard', 'settings', 'admin/users']) {
    await page.goto(`/#/${r}`);
    await expect(page, r).toHaveURL(/#\/login/);
  }
});

test('non-admins are bounced from admin screens to the dashboard', async ({ page }) => {
  await mockApi(page, 'USER');
  await login(page);
  for (const r of ['admin', 'admin/overview', 'admin/users', 'admin/app-settings']) {
    await page.goto(`/#/${r}`);
    await expect(page, r).toHaveURL(/#\/dashboard/);
  }
});

test('admins reach admin screens', async ({ page }) => {
  await mockApi(page, 'ADMIN');
  await login(page);
  for (const r of ['admin/overview', 'admin/users', 'admin/app-settings']) {
    await page.goto(`/#/${r}`);
    await expect(page, r).toHaveURL(new RegExp(`#/${r}`));
  }
});
