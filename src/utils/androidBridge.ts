// Android Device Bridge: Real Phone Control, Intents, Hardware Toggles

let wakeLockSentinel: any = null;
let torchTrack: MediaStreamTrack | null = null;
let torchStream: MediaStream | null = null;

/**
 * Triggers native Android phone call via `tel:` intent protocol
 */
export function triggerPhoneCall(phoneNumber: string) {
  const sanitized = phoneNumber.replace(/[^0-9+]/g, '');
  if (!sanitized) return false;
  // Trigger native phone dialer directly
  window.location.href = `tel:${sanitized}`;
  return true;
}

/**
 * Dispatches WhatsApp message via `wa.me` intent
 */
export function triggerWhatsAppMessage(phoneNumber: string, message: string) {
  const sanitized = phoneNumber.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(message || 'Hello');
  
  if (sanitized) {
    const url = `https://wa.me/${sanitized}?text=${encoded}`;
    window.open(url, '_blank');
  } else {
    // Open WhatsApp app directly
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  }
  return true;
}

/**
 * Dispatches native SMS message via `sms:` intent
 */
export function triggerSmsMessage(phoneNumber: string, message: string) {
  const sanitized = phoneNumber.replace(/[^0-9+]/g, '');
  const encoded = encodeURIComponent(message || '');
  window.location.href = `sms:${sanitized}?body=${encoded}`;
  return true;
}

/**
 * Launches Android applications using app scheme intents with browser fallbacks
 */
export function launchAndroidApp(appName: string, query?: string): { success: boolean; url: string; label: string } {
  const target = appName.toLowerCase().trim();
  let url = '';
  let label = appName;

  switch (target) {
    case 'youtube':
      url = query ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` : 'vnd.youtube://';
      label = 'YouTube';
      break;
    case 'whatsapp':
      url = 'whatsapp://send';
      label = 'WhatsApp';
      break;
    case 'spotify':
    case 'music':
      url = 'spotify://';
      label = 'Spotify';
      break;
    case 'maps':
    case 'google maps':
    case 'navigation':
      url = query ? `https://www.google.com/maps/search/${encodeURIComponent(query)}` : 'https://maps.google.com';
      label = 'Google Maps';
      break;
    case 'chrome':
    case 'browser':
      url = query ? `https://www.google.com/search?q=${encodeURIComponent(query)}` : 'https://www.google.com';
      label = 'Chrome Browser';
      break;
    case 'gmail':
    case 'mail':
    case 'email':
      url = 'googlegmail://';
      label = 'Gmail';
      break;
    case 'calculator':
      // Open Android Calculator intent or web calculator
      url = 'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_CALCULATOR;end';
      label = 'Calculator';
      break;
    case 'clock':
    case 'alarm':
    case 'timer':
      url = 'intent:#Intent;action=android.intent.action.SET_ALARM;end';
      label = 'Clock & Alarm';
      break;
    case 'settings':
      url = 'intent:#Intent;action=android.settings.SETTINGS;end';
      label = 'Device Settings';
      break;
    case 'playstore':
    case 'store':
      url = 'market://';
      label = 'Google Play Store';
      break;
    case 'telegram':
      url = 'tg://resolve?domain=';
      label = 'Telegram';
      break;
    case 'instagram':
      url = 'instagram://app';
      label = 'Instagram';
      break;
    case 'contacts':
    case 'phone':
      url = 'content://contacts/people';
      label = 'Phone Contacts';
      break;
    default:
      url = `https://www.google.com/search?q=${encodeURIComponent(appName)}`;
      label = appName;
  }

  try {
    const isIntent = url.startsWith('intent:') || url.startsWith('market:') || url.startsWith('vnd.') || url.startsWith('whatsapp:');
    if (isIntent) {
      window.location.href = url;
    } else {
      window.open(url, '_blank');
    }
    return { success: true, url, label };
  } catch (e) {
    console.error('Failed to launch app:', e);
    return { success: false, url, label };
  }
}

/**
 * Real Flashlight / Torch toggle using Web MediaStream API
 */
export async function setDeviceTorch(enable: boolean): Promise<boolean> {
  try {
    if (!enable) {
      if (torchTrack) {
        await (torchTrack as any).applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
        torchTrack.stop();
        torchTrack = null;
      }
      if (torchStream) {
        torchStream.getTracks().forEach((t) => t.stop());
        torchStream = null;
      }
      return false;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }

    torchStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        advanced: [{ torch: true } as any],
      } as any,
    });

    const track = torchStream.getVideoTracks()[0];
    if (track) {
      const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.torch) {
        await (track as any).applyConstraints({ advanced: [{ torch: true }] });
        torchTrack = track;
        return true;
      }
      // Keep track open even if capabilities doesn't report torch
      torchTrack = track;
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Torch control unavailable on this device browser:', err);
    return false;
  }
}

/**
 * Screen WakeLock API: Prevents Android screen from sleeping while Jarvis runs
 */
export async function toggleScreenWakeLock(enable: boolean): Promise<boolean> {
  try {
    if (!('wakeLock' in navigator)) return false;

    if (enable) {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    } else {
      if (wakeLockSentinel) {
        await wakeLockSentinel.release();
        wakeLockSentinel = null;
      }
      return false;
    }
  } catch (err) {
    console.warn('Wake Lock error:', err);
    return false;
  }
}

/**
 * Haptic Vibration feedback
 */
export function triggerHaptic(pattern: number[] = [100, 50, 100]): boolean {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      return navigator.vibrate(pattern);
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Battery Telemetry lookup
 */
export async function readBatteryStatus(): Promise<{ level: number; charging: boolean } | null> {
  if (typeof window !== 'undefined' && 'getBattery' in navigator) {
    try {
      const b: any = await (navigator as any).getBattery();
      return {
        level: Math.round(b.level * 100),
        charging: Boolean(b.charging),
      };
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Native Notification alert for reminders
 */
export async function sendDeviceNotification(title: string, body: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;

  try {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
      } as any);
      return true;
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/icon-192.png',
          vibrate: [200, 100, 200],
        } as any);
        return true;
      }
    }
  } catch (err) {
    console.warn('Notification trigger error:', err);
  }
  return false;
}
