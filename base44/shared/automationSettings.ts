// ERA Core — Automation toggles + tier gates.
//
// Single source of truth for reading BusinessConfig.automation_settings and deciding
// whether a given automated message may send. Two kinds of gates live here:
//
//   1. Channel-tier gates (emailAutomationsEnabled / smsAutomationsEnabled) — does the
//      tenant's plan tier permit the channel at all? Used for booking confirmations,
//      which are always-on within the channel tier (no per-message toggle).
//   2. Tier + per-toggle gates (emailAutomationAllowed / smsAutomationAllowed) — tier
//      AND a specific automation_settings toggle. Used for welcome / reminder /
//      review-request automations, which a tenant can turn off individually.
//
// All toggles default to ON (a toggle is off only when explicitly set to false), so a
// new tenant gets every automation until they choose to disable one. SMS toggles are
// inert below the Growth tier: smsAutomationsEnabled returns false, so smsAutomationAllowed
// is false regardless of the toggle value — the UI hides the SMS block for Basic/Foundation.

import { hasFeature } from './planFeatures.ts';

export interface AutomationSettings {
  welcome_email: boolean;
  reminder_email: boolean;
  review_request_email: boolean;
  reminder_sms: boolean;
  review_request_sms: boolean;
}

const TOGGLE_KEYS: (keyof AutomationSettings)[] = [
  'welcome_email',
  'reminder_email',
  'review_request_email',
  'reminder_sms',
  'review_request_sms',
];

// Read automation_settings off a BusinessConfig with defaults (all on unless explicitly false).
export function getAutomationSettings(cfg: any): AutomationSettings {
  const a = (cfg && cfg.automation_settings) || {};
  const out = {} as AutomationSettings;
  for (const k of TOGGLE_KEYS) out[k] = a[k] !== false;
  return out;
}

// Channel-tier gates (no per-toggle).
export function emailAutomationsEnabled(cfg: any): boolean {
  return hasFeature(cfg?.plan_tier || 'basic', 'email_automations');
}
export function smsAutomationsEnabled(cfg: any): boolean {
  return hasFeature(cfg?.plan_tier || 'basic', 'sms_automations');
}

// Tier + per-toggle gates.
export function emailAutomationAllowed(cfg: any, toggle: keyof AutomationSettings): boolean {
  return emailAutomationsEnabled(cfg) && getAutomationSettings(cfg)[toggle] === true;
}
export function smsAutomationAllowed(cfg: any, toggle: keyof AutomationSettings): boolean {
  return smsAutomationsEnabled(cfg) && getAutomationSettings(cfg)[toggle] === true;
}