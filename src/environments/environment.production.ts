export const environment = {
  production: true,
  /**
   * Empty means same-origin: requests go to /auth/... on whatever host serves
   * the app, which is right when the API is proxied under the same domain.
   *
   * If the API lives elsewhere (a separate host from a Vercel frontend), set the
   * full origin here — e.g. 'https://api.pulse.example.com' — and add that origin
   * to CORS_ORIGIN on the server. Leaving it empty fails visibly with 404s on
   * your own domain; the previous hardcoded localhost failed invisibly by
   * calling the visitor's own machine.
   */
  apiBaseUrl: '',
};
