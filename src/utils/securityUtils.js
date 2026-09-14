/**
 * Security utilities to prevent XSS (Cross-Site Scripting),
 * code injection, and request spamming/abuse.
 */

/**
 * Sanitizes and validates external URLs to prevent javascript: or data: injection.
 * Only allows http: and https: protocols.
 * Returns '#' if the URL is dangerous or invalid.
 *
 * @param {string} url - The URL to sanitize
 * @returns {string} - The safe URL or '#'
 */
export const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  
  // Explicitly block dangerous script injection schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return '#';
  }

  // Prepend https:// if user entered domain without protocol
  if (!/^https?:\/\//i.test(trimmed)) {
    // If it looks like a valid relative URL or anchor, allow it
    if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }

  return trimmed;
};

/**
 * Clean and truncate plain text input.
 *
 * @param {string} text - Raw input string
 * @param {number} [maxLength=1000] - Maximum allowed length
 * @returns {string} - Cleaned string
 */
export const sanitizeText = (text, maxLength = 1000) => {
  if (typeof text !== 'string') return '';
  return text.trim().slice(0, maxLength);
};

/**
 * Creates an in-memory throttle check to prevent rapid button spamming / double submission.
 * Returns true if action is allowed, false if blocked by rate limit.
 *
 * @param {number} [waitMs=800] - Time in milliseconds between allowed calls
 * @returns {Function} - Guard function: () => boolean
 */
export const createClickGuard = (waitMs = 800) => {
  let lastCall = 0;
  return () => {
    const now = Date.now();
    if (now - lastCall < waitMs) {
      return false; // Throttled
    }
    lastCall = now;
    return true; // Allowed
  };
};
