import { expect, test } from '@playwright/test';
import { closeKitPanel, expectBpm, expectSaved, kitLabel, openApp, orb, orbsOn } from './helpers';

/**
 * Kit system (v2): preset kits, per-track voice swapping in the Custom view,
 * and persistence of kit + voices + pattern + tempo across reloads.
 */
test.describe('kit system', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  test('first run loads the default kit', async ({ page }) => {
    await expect(kitLabel(page)).toHaveText('Musical 8 · 8 · 16');
    await expect(
      page.locator('.kit-card', { hasText: 'Musical 8' }).getByText('LOADED'),
    ).toBeVisible();
  });

  test('loading a preset kit updates the header and the grid', async ({ page }) => {
    const clubCard = page.locator('.kit-card', { hasText: 'Club / Techno' });
    await clubCard.click();

    await expect(kitLabel(page)).toHaveText('Club / Techno · 8 · 16');
    await expect(clubCard.getByText('LOADED')).toBeVisible();

    // The preset's voices and pattern land in the grid.
    await closeKitPanel(page);
    await expect(page.locator('app-track-row').nth(3).getByText('Rimshot')).toBeVisible();
    expect(await orbsOn(page).count()).toBeGreaterThan(0);
  });

  test('swapping a voice in the Custom view marks the kit custom', async ({ page }) => {
    await page.getByRole('button', { name: 'Custom' }).click();
    await page.getByLabel('Voice for track 1', { exact: true }).selectOption('marimba');

    await expect(kitLabel(page)).toHaveText('Custom kit · 8 · 16');
    await closeKitPanel(page);
    await expect(page.locator('app-track-row').nth(0).getByText('Marimba')).toBeVisible();
  });

  test('reload restores kit, pattern, and tempo', async ({ page }) => {
    await page.locator('.kit-card', { hasText: 'Lo-fi / Organic' }).click();
    await closeKitPanel(page);
    await orb(page, 0, 1).click(); // off in the Lo-fi preset — a manual edit on top of it
    await page.getByRole('button', { name: 'Decrease BPM' }).click();
    await expectBpm(page, 116);

    await expectSaved(
      page,
      (s) => s.activeKit === 'lofi' && s.bpm === 116 && s.tracks[0].steps[1].on,
    );
    await page.reload();

    await expect(kitLabel(page)).toHaveText('Lo-fi / Organic · 8 · 16');
    await expectBpm(page, 116);
    await expect(orb(page, 0, 0)).toHaveAttribute('aria-pressed', 'true'); // from the preset
    await expect(orb(page, 0, 1)).toHaveAttribute('aria-pressed', 'true'); // the manual edit
  });

  test('reload restores custom voices', async ({ page }) => {
    await page.getByRole('button', { name: 'Custom' }).click();
    await page.getByLabel('Voice for track 1', { exact: true }).selectOption('eight08');

    await expectSaved(page, (s) => s.activeKit === null && s.tracks[0].voice === 'eight08');
    await page.reload();

    await expect(kitLabel(page)).toHaveText('Custom kit · 8 · 16');
    // A custom kit reopens the panel on the Custom view, with the swap intact.
    await expect(page.getByLabel('Voice for track 1', { exact: true })).toHaveValue('eight08');
  });
});
