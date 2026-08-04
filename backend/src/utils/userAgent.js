/**
 * @fileoverview User-agent classification helper.
 *
 * BUSINESS PURPOSE:
 * Reduces a raw User-Agent header to the few buckets analytics reports on. The
 * header itself is never stored, only the classification derived from it.
 *
 * SEPARATION OF CONCERNS (WHY):
 * Every caller goes through classifyUserAgent, so a more accurate parser can
 * replace the matching below without touching anything else in the application.
 *
 * @module utils/userAgent
 */
import {
  BROWSER,
  OPERATING_SYSTEM,
  DEVICE_TYPE,
} from '../constants/analytics.js';

/**
 * Detects the browser family.
 * Order matters: Edge and Opera both advertise Chrome, and Chrome advertises Safari.
 * @function detectBrowser
 */
const detectBrowser = (userAgent) => {
  if (/edg(e|a|ios)?\//.test(userAgent)) {
    return BROWSER.EDGE;
  }

  if (/opr\/|opera/.test(userAgent)) {
    return BROWSER.OPERA;
  }

  if (/firefox\/|fxios\//.test(userAgent)) {
    return BROWSER.FIREFOX;
  }

  if (/chrome\/|chromium\/|crios\//.test(userAgent)) {
    return BROWSER.CHROME;
  }

  if (/safari\//.test(userAgent)) {
    return BROWSER.SAFARI;
  }

  return BROWSER.UNKNOWN;
};

/**
 * Detects the operating system.
 * Android is checked before Linux because Android agents also report Linux.
 * @function detectOperatingSystem
 */
const detectOperatingSystem = (userAgent) => {
  if (/windows/.test(userAgent)) {
    return OPERATING_SYSTEM.WINDOWS;
  }

  if (/android/.test(userAgent)) {
    return OPERATING_SYSTEM.ANDROID;
  }

  if (/iphone|ipad|ipod|crios\/|fxios\/|edgios\//.test(userAgent)) {
    return OPERATING_SYSTEM.IOS;
  }

  if (/mac os x|macintosh/.test(userAgent)) {
    return OPERATING_SYSTEM.MACOS;
  }

  if (/linux|x11/.test(userAgent)) {
    return OPERATING_SYSTEM.LINUX;
  }

  return OPERATING_SYSTEM.UNKNOWN;
};

/**
 * Detects the device form factor.
 * An Android agent without the mobile token is a tablet by convention.
 * @function detectDeviceType
 */
const detectDeviceType = (userAgent) => {
  if (/ipad|tablet|playbook|silk/.test(userAgent)) {
    return DEVICE_TYPE.TABLET;
  }

  if (/android/.test(userAgent) && !/mobile/.test(userAgent)) {
    return DEVICE_TYPE.TABLET;
  }

  if (/mobi|iphone|ipod|blackberry|iemobile|opera mini/.test(userAgent)) {
    return DEVICE_TYPE.MOBILE;
  }

  return DEVICE_TYPE.DESKTOP;
};

/**
 * Classifies a User-Agent header into browser, operating system, and device.
 * A missing or blank header yields the unknown bucket for all three.
 * @function classifyUserAgent
 */
export const classifyUserAgent = (userAgent) => {
  if (typeof userAgent !== 'string' || !userAgent.trim()) {
    return {
      browser: BROWSER.UNKNOWN,
      operatingSystem: OPERATING_SYSTEM.UNKNOWN,
      deviceType: DEVICE_TYPE.UNKNOWN,
    };
  }

  const normalized = userAgent.toLowerCase();

  return {
    browser: detectBrowser(normalized),
    operatingSystem: detectOperatingSystem(normalized),
    deviceType: detectDeviceType(normalized),
  };
};
