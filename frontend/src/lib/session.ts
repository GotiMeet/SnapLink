/**
 * A one-line signal from the network layer to the auth layer.
 *
 * WHY THIS EXISTS:
 * When a request 401s and the refresh attempt also fails, the session is
 * genuinely over. The API client needs to tell the app, but it must not import
 * the router (routing in the network layer) or the query client (a circular
 * import, since queries are built on the API client). A module-level callback
 * keeps the dependency pointing one way: api.ts emits, AuthProvider listens.
 *
 * Without this, a mid-session expiry on some background query would leave a
 * stale authenticated user in context and no redirect would ever happen.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to session expiry. Returns an unsubscribe function. */
export const onSessionExpired = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const emitSessionExpired = (): void => {
  listeners.forEach((listener) => listener());
};
