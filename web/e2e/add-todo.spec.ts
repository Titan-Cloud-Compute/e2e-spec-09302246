/**
 * Story card: add-todo — GIVEN an empty to-do list, WHEN the user submits a
 * new task title, THEN the task appears in the list. Every /api/** call is
 * mocked (hermetic).
 */
import { test, expect, type Page } from '@playwright/test';

async function mockApi(page: Page): Promise<{ posted: unknown[] }> {
  const state = { posted: [] as unknown[] };
  let user: { id: string; email: string; name: string; role: string } | null = null;
  const todos: { id: string; title: string; createdAt: string }[] = [];
  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const method = req.method().toUpperCase();
    const apiPath = new URL(req.url()).pathname.replace(/^.*\/api\//, '');
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (method === 'POST' && apiPath === 'auth/login') {
      user = { id: '1', email: 'user@example.com', name: 'User', role: 'USER' };
      return json(user);
    }
    if (method === 'GET' && (apiPath === 'users/me' || apiPath === 'auth/me')) {
      return user ? json(user) : json({ message: 'Unauthorized' }, 401);
    }
    if (apiPath === 'todos') {
      if (!user) return json({ message: 'Unauthorized' }, 401);
      if (method === 'GET') return json(todos);
      if (method === 'POST') {
        const body = req.postDataJSON() as { title: string };
        state.posted.push(body);
        const todo = { id: `t${todos.length + 1}`, title: body.title, createdAt: new Date().toISOString() };
        todos.push(todo);
        return json(todo, 201);
      }
    }
    if (method === 'GET') return json([]);
    return json({ ok: true });
  });
  return state;
}

async function login(page: Page): Promise<void> {
  await page.goto('/#/login');
  await page.locator('#email').fill('user@example.com');
  await page.locator('#password').fill('password1234');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/#\/dashboard/, { timeout: 10_000 });
}

test.use({ serviceWorkers: 'block' });

test('sidebar links to the To-dos page', async ({ page }) => {
  await mockApi(page);
  await login(page);
  await page.locator('aside.sidebar nav.sidebar-nav').getByText('To-dos').click();
  await expect(page).toHaveURL(/#\/todos/);
  await expect(page.getByTestId('todo-title-input')).toBeVisible();
});

test('user adds a task to an empty list and it appears', async ({ page }) => {
  const state = await mockApi(page);
  await login(page);
  await page.goto('/#/todos');
  await expect(page.getByTestId('todo-empty')).toBeVisible();
  await expect(page.locator('main.main-content app-todos [data-placeholder]')).toHaveCount(0);

  await page.getByTestId('todo-title-input').fill('Buy milk');
  await page.getByTestId('todo-add-button').click();

  await expect(page.getByTestId('todo-list')).toContainText('Buy milk');
  await expect(page.getByTestId('todo-empty')).toHaveCount(0);
  await expect(page.getByTestId('todo-title-input')).toHaveValue('');
  expect(state.posted).toEqual([{ title: 'Buy milk' }]);
});

test('To-dos page requires a session', async ({ page }) => {
  await mockApi(page);
  await page.goto('/#/todos');
  await expect(page).toHaveURL(/#\/login/, { timeout: 10_000 });
});
