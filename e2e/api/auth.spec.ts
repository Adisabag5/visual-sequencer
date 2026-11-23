import {
  closeKitPanel,
  expect,
  freshEmail,
  header,
  sessionButton,
  signIn,
  signUp,
  test,
} from './fixtures';

/**
 * The session, through the browser against a real server. The server's own e2e
 * already proves the endpoints; what only this can prove is that the pieces
 * meet — the cookie is actually stored and returned, the boot refresh exchanges
 * it for a token, and the UI reflects all of it.
 */
test.describe('signing in and out', () => {
  test('signing up leaves you signed in on the sequencer', async ({ page }) => {
    await signUp(page);

    await expect(page).toHaveURL(/\/$/);
    await expect(sessionButton(page)).toHaveText(/sign out/i);
  });

  test('the session survives a reload', async ({ page }) => {
    await signUp(page);
    await page.reload();

    // nothing is persisted but the httpOnly cookie: staying signed in means the
    // boot refresh traded it for a new access token
    await expect(sessionButton(page)).toHaveText(/sign out/i);
  });

  test('signing out ends it, and a reload does not bring it back', async ({ page }) => {
    await signUp(page);
    await sessionButton(page).click();
    await expect(sessionButton(page)).toHaveText(/sign in/i);

    await page.reload();

    await expect(sessionButton(page)).toHaveText(/sign in/i);
  });

  test('signing back in works', async ({ page }) => {
    const email = await signUp(page);
    await sessionButton(page).click();
    await expect(sessionButton(page)).toHaveText(/sign in/i);

    await signIn(page, email);

    await expect(sessionButton(page)).toHaveText(/sign out/i);
  });

  test('a wrong password is refused, and says nothing specific', async ({ page }) => {
    const email = await signUp(page);
    await sessionButton(page).click();

    await signIn(page, email, 'not-the-password');

    // the server refuses to reveal whether the email exists, so the UI must not
    // invent a more specific message than it was given
    await expect(page.locator('.auth-error')).toHaveText(/email or password is incorrect/i);
    await expect(page).toHaveURL(/\/auth$/);
  });

  test('an unknown email is refused the same way', async ({ page }) => {
    await page.goto('/auth');
    await signIn(page, freshEmail(), 'whatever-123');

    await expect(page.locator('.auth-error')).toHaveText(/email or password is incorrect/i);
  });

  test('a duplicate signup is reported as such', async ({ page }) => {
    const email = await signUp(page);
    await sessionButton(page).click();

    await page.goto('/auth');
    await page.getByRole('button', { name: 'Create one' }).click();
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('e2e-Password-123');
    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect(page.locator('.auth-error')).toHaveText(/already registered/i);
  });

  test('the library invites a signed-out visitor to sign in', async ({ page }) => {
    await page.goto('/');
    await closeKitPanel(page);
    await page.getByRole('button', { name: 'Open library' }).click();

    await expect(page.locator('app-library-panel aside')).toContainText(
      /saved beats live with your account/i,
    );
  });

  test('the sequencer works signed out', async ({ page }) => {
    await page.goto('/');
    await closeKitPanel(page);

    // the instrument has never needed an account; only saving does
    await expect(header(page)).toContainText('Pulse');
    await expect(sessionButton(page)).toHaveText(/sign in/i);
  });
});
