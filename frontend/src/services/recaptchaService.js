import { getApiBaseUrl } from './apiClient';

const API_BASE = getApiBaseUrl();
const SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '';
const DEMO_MODE = !SITE_KEY;

export function isRecaptchaDemoMode() {
  return DEMO_MODE;
}

export function getRecaptchaSiteKey() {
  return SITE_KEY;
}

/**
 * Verify reCAPTCHA token via backend (Google siteverify).
 * Falls back to demo validation when keys/server are not configured.
 */
export async function verifyRecaptcha({ token, demoChecked }) {
  if (DEMO_MODE) {
    if (!demoChecked) {
      return { ok: false, error: 'Please confirm you are not a robot.' };
    }
    return { ok: true, mode: 'demo' };
  }

  if (!token) {
    return { ok: false, error: 'Please complete the reCAPTCHA challenge.' };
  }

  try {
    const url = API_BASE ? `${API_BASE}/auth/verify-recaptcha/` : '/api/v1/auth/verify-recaptcha/';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { ok: false, error: data.error || 'reCAPTCHA verification failed. Please try again.' };
    }
    return { ok: true, mode: 'recaptcha' };
  } catch {
    return {
      ok: false,
      error: 'Unable to verify security check. Ensure the Django API is running on port 8000.'
    };
  }
}
