import {
  beatRows,
  closeKitPanel,
  expect,
  header,
  library,
  loadBeat,
  openLibrary,
  orb,
  save,
  sessionButton,
  signUp,
  test,
} from './fixtures';

/**
 * Saving and the library, against a real server. These are the paths that were
 * only ever checked by hand before: the store's unit tests fake the API, and
 * the server's e2e never opens a browser.
 */
test.describe('saving a beat', () => {
  test.beforeEach(async ({ page }) => {
    await signUp(page);
    await closeKitPanel(page);
  });

  test('the first save asks for a name, then confirms', async ({ page }) => {
    await orb(page, 2, 3).click();
    await save(page, 'First Beat');

    await expect(header(page)).toContainText('First Beat');
    await expect(page.locator('app-save-control')).toContainText(/1 beats?/);
  });

  test('the beat survives a reload and is still the one being edited', async ({ page }) => {
    await orb(page, 2, 3).click();
    await save(page, 'Survivor');

    await page.reload();
    await closeKitPanel(page);

    // only the id is persisted; the beat is fetched back, which is also the
    // check that it still exists and is still ours
    await expect(header(page)).toContainText('Survivor');
  });

  test('saving again updates it rather than making a second one', async ({ page }) => {
    await orb(page, 2, 3).click();
    await save(page, 'Only One');

    await orb(page, 2, 7).click();
    await save(page); // no title prompt expected

    await openLibrary(page);
    await expect(beatRows(page)).toHaveCount(1);
  });

  test('the header shows unsaved changes once the grid moves on', async ({ page }) => {
    await orb(page, 2, 3).click();
    await save(page, 'Dirty Later');
    await expect(header(page)).not.toContainText('unsaved');

    await orb(page, 2, 11).click();

    await expect(header(page)).toContainText('unsaved');
  });

  test('signing out lets go of the beat', async ({ page }) => {
    await orb(page, 2, 3).click();
    await save(page, 'Not Yours Now');

    await sessionButton(page).click();

    await expect(sessionButton(page)).toHaveText(/sign in/i);
    await expect(header(page)).not.toContainText('Not Yours Now');
  });
});

test.describe('the library', () => {
  test.beforeEach(async ({ page }) => {
    await signUp(page);
    await closeKitPanel(page);
    await orb(page, 2, 3).click();
    await save(page, 'Library Beat');
    await openLibrary(page);
  });

  test('lists the saved beat and marks it as the one on the grid', async ({ page }) => {
    await expect(beatRows(page)).toHaveCount(1);
    await expect(beatRows(page).first()).toContainText('Library Beat');
    await expect(beatRows(page).first()).toContainText(/on the grid/i);
  });

  test('loading restores the pattern that was saved', async ({ page }) => {
    await orb(page, 2, 3).click(); // undo the saved step
    await expect(orb(page, 2, 3)).toHaveAttribute('aria-pressed', 'false');

    await loadBeat(page).click();
    await library(page).getByRole('button', { name: 'Load anyway' }).click();

    await expect(orb(page, 2, 3)).toHaveAttribute('aria-pressed', 'true');
  });

  test('warns before loading over unsaved changes', async ({ page }) => {
    await orb(page, 2, 9).click();

    await loadBeat(page).click();

    await expect(library(page)).toContainText(/unsaved changes/i);
  });

  test('cancelling the warning leaves the grid alone', async ({ page }) => {
    await orb(page, 2, 9).click();
    await loadBeat(page).click();

    await library(page).getByRole('button', { name: 'Cancel' }).click();

    await expect(orb(page, 2, 9)).toHaveAttribute('aria-pressed', 'true');
  });

  test('renaming updates the row and the header', async ({ page }) => {
    await page.getByRole('button', { name: /^Rename / }).click();
    await page.getByLabel('Beat title').fill('Renamed Beat');
    await page.getByRole('button', { name: 'Confirm new title' }).click();

    await expect(beatRows(page).first()).toContainText('Renamed Beat');
    await expect(header(page)).toContainText('Renamed Beat');
  });

  test('deleting asks first, and cancelling keeps the beat', async ({ page }) => {
    await page.getByRole('button', { name: /^Delete / }).click();

    // the confirmation replaces the list while it is up, so the row is not on
    // screen to count — what matters is that it comes back untouched
    await expect(library(page)).toContainText(/cannot be undone/i);

    await library(page).getByRole('button', { name: 'Cancel' }).click();

    await expect(beatRows(page)).toHaveCount(1);
    await expect(beatRows(page).first()).toContainText('Library Beat');
  });

  test('deleting the beat on the grid removes it and detaches it', async ({ page }) => {
    await page.getByRole('button', { name: /^Delete / }).click();
    await library(page).getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(beatRows(page)).toHaveCount(0);
    await expect(header(page)).not.toContainText('Library Beat');
    // the grid itself is untouched — only the link to the saved row is gone
    await expect(orb(page, 2, 3)).toHaveAttribute('aria-pressed', 'true');
  });
});
