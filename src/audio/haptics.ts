/**
 * Lightweight cross-platform Haptic Feedback Engine for mobile play.
 * Provides subtle tactile feedback on checker selection, moves, hits, and dice rolls.
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning';

class HapticsEngine {
  private enabled: boolean = true;

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public trigger(type: HapticType = 'light') {
    if (!this.enabled || typeof window === 'undefined') return;

    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        switch (type) {
          case 'selection':
            navigator.vibrate(10);
            break;
          case 'light':
            navigator.vibrate(15);
            break;
          case 'medium':
            navigator.vibrate(28);
            break;
          case 'heavy':
            navigator.vibrate([35, 30, 45]);
            break;
          case 'success':
            navigator.vibrate([15, 40, 25]);
            break;
          case 'warning':
            navigator.vibrate([30, 40, 30]);
            break;
        }
      }
    } catch {
      // Graceful fallback if device permissions restrict vibration
    }
  }
}

export const haptics = new HapticsEngine();
