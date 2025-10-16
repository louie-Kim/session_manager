import { expect, test } from '@playwright/test';

test.describe('Session Manager smoke test', () => {
  test('renders landing page header', async ({ page }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL ?? 'http://localhost:3000';

    try {
      await page.goto('/');
    } catch (error) {
      test.skip(
        `Session Manager is not reachable at ${baseURL}. Launch pnpm dev:web before running Playwright. (${error instanceof Error ? error.message : String(error)})`,
      );
    }

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Codex Session Manager');
    await expect(page.getByText('Inspect Codex CLI sessions, view metadata, and resume work')).toBeVisible();
  });
});
