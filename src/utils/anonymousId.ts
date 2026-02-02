const ANONYMOUS_ID_KEY = 'drum-machine-anonymous-id';

/**
 * Get or create a persistent anonymous ID for upvoting patterns.
 * The ID is stored in localStorage and persists across sessions.
 * Returns a 32-character hex string (16 random bytes).
 */
export function getAnonymousId(): string {
  let id = localStorage.getItem(ANONYMOUS_ID_KEY);
  if (!id) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    id = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(ANONYMOUS_ID_KEY, id);
  }
  return id;
}

/**
 * Check if the user has an anonymous ID stored.
 */
export function hasAnonymousId(): boolean {
  return localStorage.getItem(ANONYMOUS_ID_KEY) !== null;
}
