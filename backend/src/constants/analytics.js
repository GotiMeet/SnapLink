/**
 * @fileoverview Analytics classification and reporting constants.
 *
 * @module constants/analytics
 */

// Browser families the user-agent classifier recognises.
export const BROWSER = Object.freeze({
  CHROME: 'chrome',
  EDGE: 'edge',
  FIREFOX: 'firefox',
  SAFARI: 'safari',
  OPERA: 'opera',
  UNKNOWN: 'unknown',
});

export const OPERATING_SYSTEM = Object.freeze({
  WINDOWS: 'windows',
  MACOS: 'macos',
  LINUX: 'linux',
  ANDROID: 'android',
  IOS: 'ios',
  UNKNOWN: 'unknown',
});

export const DEVICE_TYPE = Object.freeze({
  DESKTOP: 'desktop',
  MOBILE: 'mobile',
  TABLET: 'tablet',
  UNKNOWN: 'unknown',
});

// How a visitor reached the link. Anything else counts as a normal click, which
// keeps the redirect backward compatible with callers that send no source.
export const VISIT_SOURCE = Object.freeze({
  CLICK: 'click',
  QR: 'qr',
});

// Buckets used when a visit carries no referrer or no readable language.
export const REFERRER_DIRECT = 'direct';
export const LANGUAGE_UNKNOWN = 'unknown';

// Bounds a report so one request cannot scan unlimited history.
export const DEFAULT_REPORT_DAYS = 30;
export const MAX_REPORT_DAYS = 366;

// Caps a single map key so a hostile header cannot grow a document without limit.
export const MAX_COUNT_KEY_LENGTH = 100;
