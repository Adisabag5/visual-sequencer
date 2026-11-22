import { defineConfig, devices } from '@playwright/test';

/**
 * Where the sequencer-server checkout lives. The folder is still named
 * nest-server locally; CI points this at wherever it checks the repo out.
 */
const API_DIR = process.env.PULSE_API_DIR ?? '../nest-server';

/** Only the API specs need a server and a database, so only they start one. */
const withApi = process.env.PULSE_SKIP_API !== '1';

const angular = {
  command: 'pnpm start',
  url: 'http://localhost:4200',
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
};

/**
 * NODE_ENV=test rather than production on purpose: it turns synchronize back
 * on, so the throwaway database builds its own schema and the run needs no
 * migration step. TRUST_PROXY lets each worker present its own client IP —
 * see e2e/api/fixtures.ts for why that matters.
 */
const api = {
  // Locally the Nest CLI is right there; CI builds first and runs the compiled
  // output, so serving needs nothing on PATH beyond node.
  command: process.env.PULSE_API_CMD ?? 'pnpm start',
  cwd: API_DIR,
  url: 'http://localhost:3000/api/health',
  reuseExistingServer: !process.env.CI,
  timeout: 180_000,
  env: {
    NODE_ENV: 'test',
    DB_NAME: process.env.PULSE_E2E_DB ?? 'pulse_e2e',
    TRUST_PROXY: '1',
  },
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: { baseURL: 'http://localhost:4200' },

  projects: [
    {
      // The instrument on its own: no server, no database, milliseconds.
      name: 'app',
      testIgnore: /api\//,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Everything that needs a real server behind it.
      name: 'api',
      testMatch: /api\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: withApi ? [angular, api] : [angular],
});
