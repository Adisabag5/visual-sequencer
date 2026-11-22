import { expect, Locator, Page, test as base } from '@playwright/test';

/**
 * Fixtures for the API-backed specs: the ones that need a real server and a
 * real database, not just the grid.
 *
 * Each worker presents its own client IP. Sign-in and sign-up are rate limited
 * to 10/min per IP, and five workers signing up in parallel would otherwise
 * share one budget and start handing each other 429s — a flake that would look
 * like an auth bug. The server trusts X-Forwarded-For because the e2e run sets
 * TRUST_PROXY=1, which is the same mechanism nginx uses in production, so this
 * needs no test-only branch in the server.
 */
export const test = base.extend<{ clientIp: string }>({
  /**
   * A distinct client IP per test, derived from its id so it is stable across
   * runs and unique across tests.
   *
   * Sign-in and sign-up allow 10/min per IP. Sharing one IP across the suite
   * trips that after the tenth test and the rest fail at signup — which reads
   * like an auth bug rather than a budget. Per worker was not enough either:
   * one worker can own more than ten tests. Per test, each signup is the only
   * call on its own budget.
   *
   * The server trusts X-Forwarded-For because the run sets TRUST_PROXY=1, the
   * same mechanism nginx uses in production — so this needs no test-only
   * branch in the server.
   */
  // Playwright reads this parameter to work out which fixtures a fixture
  // depends on, so it has to be an object pattern even when it needs none —
  // a named parameter makes it throw. That collides with no-empty-pattern.
  // eslint-disable-next-line no-empty-pattern
  clientIp: async ({}, use, testInfo) => {
    let hash = 0;
    for (const ch of testInfo.testId) hash = (hash * 31 + ch.charCodeAt(0)) % 64516;

    await use(`10.90.${1 + Math.floor(hash / 254)}.${1 + (hash % 254)}`);
  },

  context: async ({ browser, clientIp }, use) => {
    const context = await browser.newContext({
      extraHTTPHeaders: { 'X-Forwarded-For': clientIp },
    });

    await use(context);
    await context.close();
  },
});

export { expect };

/** A fresh account per test, so tests never collide over one row. */
export function freshEmail(): string {
  return `e2e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}@example.invalid`;
}

const PASSWORD = 'e2e-Password-123';

/** Create an account through the UI and land back on the sequencer. */
export async function signUp(page: Page, email = freshEmail()): Promise<string> {
  await page.goto('/auth');
  await page.getByRole('button', { name: 'Create one' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign up' }).click();

  await expect(sessionButton(page)).toHaveText(/sign out/i);

  return email;
}

export async function signIn(page: Page, email: string, password = PASSWORD): Promise<void> {
  await page.goto('/auth');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

export function sessionButton(page: Page): Locator {
  return page.locator('.session-btn');
}

export function header(page: Page): Locator {
  return page.locator('header');
}

/** Close the kit panel, which starts open and covers the transport. */
export async function closeKitPanel(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Close kit panel' }).click();
}

export async function openLibrary(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Open library' }).click();
}

/** The orb button for one step of one track (0-based). */
export function orb(page: Page, trackIndex: number, stepIndex: number): Locator {
  return page
    .locator('app-track-row')
    .nth(trackIndex)
    .locator('app-step-orb button')
    .nth(stepIndex);
}

/** Save the grid, naming it when the first save asks. */
export async function save(page: Page, title?: string): Promise<void> {
  await page.locator('app-save-control button').first().click();

  if (title !== undefined) {
    await page.getByLabel('Beat title').fill(title);
    await page.getByRole('button', { name: 'Confirm title' }).click();
  }

  await expect(page.locator('app-save-control')).toContainText(/saved/i);
}

export function beatRows(page: Page): Locator {
  return page.locator('app-beat-row');
}

/**
 * Scope to the Library panel. The Kit panel's cards also say "LOAD →", and the
 * save control also has a "Cancel", so an unscoped role query matches several
 * things and Playwright rightly refuses to guess.
 */
export function library(page: Page): Locator {
  return page.locator('app-library-panel aside');
}

/** The Load button on a beat row, not on a kit card. */
export function loadBeat(page: Page): Locator {
  return page.locator('.beat-load').first();
}
