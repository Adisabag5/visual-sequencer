/** Development. Swapped for environment.production.ts by an angular.json fileReplacement. */
export const environment = {
  production: false,
  /**
   * Must match PORT in sequencer-server/.env, plus the server's /api prefix — every
   * server route is mounted under it, so without the prefix every call 404s.
   */
  apiBaseUrl: 'http://localhost:3000/api',
};
