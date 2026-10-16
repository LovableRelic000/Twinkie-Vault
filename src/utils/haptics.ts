import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Unified Haptic Feedback Engine
 * Leverages native @capacitor/haptics when on Wear OS / Android,
 * and falls back seamlessly to navigator.vibrate in browser environments.
 */

class HapticEngine {
  private enabled: boolean = true;
  private hasCapacitor: boolean = false;

  constructor() {
    const saved = localStorage.getItem('twinkie_vault_haptics');
    if (saved !== null) {
      this.enabled = saved === 'true';
    }
    // Check if running in Capacitor native runtime
    if (typeof window !== 'undefined' && (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()) {
      this.hasCapacitor = true;
    }
  }

  public setEnabled(enable: boolean) {
    this.enabled = enable;
    localStorage.setItem('twinkie_vault_haptics', String(enable));
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  private vibrate(pattern: number | number[]) {
    if (!this.enabled || typeof window === 'undefined') return;

    if (this.hasCapacitor) {
      if (Array.isArray(pattern)) {
        const totalDuration = pattern.reduce((acc, curr) => acc + curr, 0);
        Haptics.vibrate({ duration: totalDuration }).catch(() => {});
      } else {
        Haptics.vibrate({ duration: pattern }).catch(() => {});
      }
      return;
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Safe fallback if permission blocked
      }
    }
  }

  /**
   * Normal Step: 10ms micro-tick (light physical detent)
   */
  public tick() {
    if (!this.enabled) return;
    if (this.hasCapacitor) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {
        this.vibrate(10);
      });
    } else {
      this.vibrate(10);
    }
  }

  /**
   * Proximity / Warm Zone: 25ms pulse (±1 or ±2 numbers from target)
   */
  public warm() {
    if (!this.enabled) return;
    if (this.hasCapacitor) {
      Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {
        this.vibrate(25);
      });
    } else {
      this.vibrate(25);
    }
  }

  /**
   * Gate Alignment: Heavy 80ms thud (exact target number)
   */
  public gateAligned() {
    if (!this.enabled) return;
    if (this.hasCapacitor) {
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {
        this.vibrate(80);
      });
    } else {
      this.vibrate(80);
    }
  }

  /**
   * Locking a Tumbler: [40, 50, 90]ms double-pulse
   */
  public tumblerLock() {
    this.vibrate([40, 50, 90]);
  }

  /**
   * Wrong Direction Penalty: [60, 40, 60]ms error buzz
   */
  public errorBuzz() {
    this.vibrate([60, 40, 60]);
  }

  /**
   * Vault Open / Level Cleared: [100, 50, 100, 50, 200]ms celebration pulse
   */
  public vaultUnlocked() {
    this.vibrate([100, 50, 100, 50, 200]);
  }
}

export const haptics = new HapticEngine();
