import { expect, test } from '@playwright/test';
import { closeKitPanel, expectBpm, expectSaved, openApp, orb, orbsOn, playButton } from './helpers';

/**
 * Core sequencer flow (CLAUDE.md): toggle steps → play → inspect → clear →
 * reload restores. The kit panel starts open, so each test closes it first
 * to keep the grid fully clickable.
 */
test.describe('core flow', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await closeKitPanel(page);
  });

  test('steps toggle on and off', async ({ page }) => {
    await page.getByRole('button', { name: 'Clear' }).click();
    const step = orb(page, 0, 3);
    await expect(step).toHaveAttribute('aria-pressed', 'false');
    await step.click();
    await expect(step).toHaveAttribute('aria-pressed', 'true');
    await step.click();
    await expect(step).toHaveAttribute('aria-pressed', 'false');
  });

  test('play advances the playhead; stop halts it', async ({ page }) => {
    await playButton(page).click();
    await expect(page.locator('app-transport-bar .play-square')).toBeVisible();

    // Exactly one ruler column is lit, and it moves as the transport runs.
    const playheadColumn = () =>
      page
        .locator('.ruler-slot')
        .evaluateAll((slots) => slots.findIndex((s) => s.classList.contains('ruler-playhead')));
    await expect(page.locator('.ruler-playhead')).toHaveCount(1);
    const first = await playheadColumn();
    await expect.poll(playheadColumn).not.toBe(first);

    await playButton(page).click();
    await expect(page.locator('app-transport-bar .play-triangle')).toBeVisible();
    await expect(page.locator('.ruler-playhead')).toHaveCount(0);
  });

  test('clear turns every step off', async ({ page }) => {
    // The default kit ships with a preset pattern, so the grid starts non-empty.
    expect(await orbsOn(page).count()).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(orbsOn(page)).toHaveCount(0);
  });

  test('pattern and tempo survive a reload', async ({ page }) => {
    await page.getByRole('button', { name: 'Clear' }).click();
    await orb(page, 0, 0).click();
    await orb(page, 2, 5).click();
    await page.getByRole('button', { name: 'Increase BPM' }).click();
    await page.getByRole('button', { name: 'Increase BPM' }).click();
    await expectBpm(page, 122);

    await expectSaved(
      page,
      (s) => s.bpm === 122 && s.tracks[0].steps[0].on && s.tracks[2].steps[5].on,
    );
    await page.reload();

    await expectBpm(page, 122);
    await expect(orbsOn(page)).toHaveCount(2);
    await expect(orb(page, 0, 0)).toHaveAttribute('aria-pressed', 'true');
    await expect(orb(page, 2, 5)).toHaveAttribute('aria-pressed', 'true');
  });
});
