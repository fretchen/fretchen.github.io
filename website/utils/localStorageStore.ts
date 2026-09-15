/**
 * One localStorage key as an external store for `useSyncExternalStore`.
 *
 * localStorage is client-only, so a plain `useState` initialiser would disagree with the
 * server-rendered markup; `useSyncExternalStore` with an explicit server snapshot makes that
 * impossible. Subscribing to `storage` also keeps two open tabs in agreement.
 *
 * Deliberately raw strings in and out: what a stored value *means* — a default, a validity check,
 * a parsed Set — differs per preference and stays at the call site. This file only owns the part
 * that is identical every time, and that is easy to get subtly wrong when copied.
 */
export interface LocalStorageStore {
  subscribe: (onChange: () => void) => () => void;
  read: () => string | null;
  write: (value: string) => void;
}

export function createLocalStorageStore(key: string): LocalStorageStore {
  const listeners = new Set<() => void>();

  // Arrow properties, not method shorthand: these references are handed straight to
  // useSyncExternalStore, so they must not depend on being called as a method.
  return {
    subscribe: (onChange: () => void) => {
      listeners.add(onChange);
      window.addEventListener("storage", onChange);
      return () => {
        listeners.delete(onChange);
        window.removeEventListener("storage", onChange);
      };
    },

    read: () => window.localStorage.getItem(key),

    write: (value: string) => {
      window.localStorage.setItem(key, value);
      // `storage` only fires in *other* tabs, so notify this one explicitly.
      listeners.forEach((listener) => listener());
    },
  };
}
