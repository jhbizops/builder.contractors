export const SESSION_COOKIE_NAME = "builder.sid";
export const DEFAULT_SESSION_MAX_AGE = 1000 * 60 * 60 * 24;
export const REMEMBER_ME_SESSION_MAX_AGE = 1000 * 60 * 60 * 24 * 30;

// Session hardening notes:
// - The app rotates the session identifier on successful login/register via req.session.regenerate.
// - Cookie security in production assumes HTTPS is terminated before this app and x-forwarded-proto is set.
// - rolling=true in express-session keeps maxAge sliding while users remain active.
