/**
 * Browser storage that never throws. Storage can be missing or denied (private windows, blocked
 * site data, previews), so every access is wrapped; callers fall back to the copyable save code.
 */
function store(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

export function storageGet(key: string): string | null {
  try { return store()?.getItem(key) ?? null; } catch { return null; }
}

/** Returns false when the value could not be stored. */
export function storageSet(key: string, value: string): boolean {
  try { const s = store(); if (!s) return false; s.setItem(key, value); return true; } catch { return false; }
}

export function storageRemove(key: string): void {
  try { store()?.removeItem(key); } catch { /* storage unavailable */ }
}

export function storageAvailable(): boolean {
  const probe = '__kit_probe__';
  if (!storageSet(probe, '1')) return false;
  storageRemove(probe);
  return true;
}
