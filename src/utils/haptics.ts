// src/utils/haptics.ts
// Tiny haptics facade. Lazy-requires expo-haptics so unit tests don't need
// to mock the native module, and so a missing install gracefully no-ops.
let mod: any = null;
function get(): any {
  if (mod !== null) return mod;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    mod = require('expo-haptics');
  } catch {
    mod = false;
  }
  return mod;
}

export function tapLight(): void {
  const h = get();
  if (!h?.impactAsync) return;
  try {
    h.impactAsync(h.ImpactFeedbackStyle?.Light ?? 'light');
  } catch {
    /* ignore */
  }
}

export function tapMedium(): void {
  const h = get();
  if (!h?.impactAsync) return;
  try {
    h.impactAsync(h.ImpactFeedbackStyle?.Medium ?? 'medium');
  } catch {
    /* ignore */
  }
}

export function notifySuccess(): void {
  const h = get();
  if (!h?.notificationAsync) return;
  try {
    h.notificationAsync(h.NotificationFeedbackType?.Success ?? 'success');
  } catch {
    /* ignore */
  }
}
