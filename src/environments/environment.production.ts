export const environment = {
  production: true,
  /**
   * Same-origin, under the server's /api prefix: the NestJS process serves both
   * this app and the API from one domain, so a relative base is all that is
   * needed and no CORS is involved.
   *
   * The prefix is not optional — every server route is mounted under it, so an
   * empty value here 404s every call. If the API is ever moved to its own host,
   * put the full origin in front ('https://api.example.com/api') and add that
   * origin to CORS_ORIGIN on the server, which also means restoring the
   * refresh cookie's SameSite=None.
   */
  apiBaseUrl: '/api',
};
