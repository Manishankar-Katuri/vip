type Listener = (version: string) => void;

declare global {
  // Retain listeners through Next development module reloads.
  var vipOperationalListeners: Set<Listener> | undefined;
}

const listeners = globalThis.vipOperationalListeners ?? new Set<Listener>();

if (process.env.NODE_ENV !== "production") {
  globalThis.vipOperationalListeners = listeners;
}

export function publishOperationalUpdate() {
  const version = new Date().toISOString();
  for (const listener of listeners) listener(version);
}

export function subscribeToOperationalUpdates(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
