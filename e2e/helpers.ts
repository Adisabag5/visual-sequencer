import { expect, Locator, Page } from '@playwright/test';

/** The localStorage key the app persists to (schema v2). */
export const STORAGE_KEY = 'pulse.state';

/** The slice of the persisted v2 schema the assertions read. */
export interface SavedStateV2 {
  version: number;
  bpm: number;
  activeKit: string | null;
  tracks: { voice: string; steps: { on: boolean; pitch: number }[] }[];
}

/** Open the app and wait for it to render. Each test gets a fresh context (empty storage). */
export async function openApp(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pulse' })).toBeVisible();
}

/** The header meta line, e.g. "Musical 8 · 8 · 16" or "Custom kit · 8 · 16". */
export function kitLabel(page: Page): Locator {
  return page.locator('header p.font-mono');
}

/** Close the slide-out kit panel (it starts open) so it can't overlap the grid. */
export async function closeKitPanel(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Close kit panel' }).click();
}

export function playButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Play / Stop' });
}

/** The orb button for one step of one track (0-based indices). */
export function orb(page: Page, trackIndex: number, stepIndex: number): Locator {
  return page
    .locator('app-track-row')
    .nth(trackIndex)
    .locator('app-step-orb button')
    .nth(stepIndex);
}

/** Every orb currently toggled on, across all tracks. */
export function orbsOn(page: Page): Locator {
  return page.locator('app-step-orb button[aria-pressed="true"]');
}

/** Assert the transport shows the given tempo. */
export async function expectBpm(page: Page, bpm: number): Promise<void> {
  await expect(
    page.locator('app-transport-bar').getByText(String(bpm), { exact: true }),
  ).toBeVisible();
}

/**
 * Wait until the debounced auto-save has written a state matching the predicate.
 * Reload only after this resolves, or the edit under test may not be persisted yet.
 */
export async function expectSaved(
  page: Page,
  matches: (state: SavedStateV2) => boolean,
): Promise<void> {
  await expect
    .poll(async () => {
      const raw = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
      if (raw === null) return false;
      try {
        return matches(JSON.parse(raw) as SavedStateV2);
      } catch {
        return false;
      }
    })
    .toBe(true);
}
