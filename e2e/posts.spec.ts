import { expect, test } from '@playwright/test';
import { createPost, createUser } from '../test/helpers';

/**
 * End-to-end tests for the posts page.
 *
 * These drive a real browser against a real server and a real database, so they
 * are the only tests that prove the component, the Route Handler and the
 * database work together.
 *
 * Keep them to the happy path. Error and empty states are much cheaper to check
 * in `__tests__/api/posts.test.ts`, and a large end-to-end suite gets slow and
 * flaky. Prefer `getByRole` and `getByLabel` over CSS selectors, and never add
 * a fixed wait — Playwright waits for you.
 */

test('shows posts that already exist', async ({ page }) => {
  const post = await createPost({ title: `Existing post ${Date.now()}` });

  await page.goto('/posts');

  await expect(page.getByRole('heading', { name: post.title })).toBeVisible();
});

test('creates a post from the form', async ({ page }) => {
  const author = await createUser();
  const title = `New post ${Date.now()}`;

  await page.goto('/posts');

  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Content').fill('Written by Playwright');
  await page.getByLabel('Author ID').fill(author.id);
  await page.getByRole('button', { name: 'Create post' }).click();

  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.getByText('Written by Playwright')).toBeVisible();
});
