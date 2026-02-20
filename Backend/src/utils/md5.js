/**
 * MD5 Hash Implementation (RAW - No SDK)
 * ──────────────────────────────────────
 * Used for generating unique transaction identifiers from KHQR QR strings
 * Output: 32-character hexadecimal string (128-bit hash)
 * 
 * Reference: https://en.wikipedia.org/wiki/MD5
 */

import CryptoJS from 'crypto-js';

/**
 * Generate MD5 hash of input string
 * @param {string} input - String to hash
 * @returns {string} 32-character hex MD5 hash
 */
export function generateMD5(input) {
    if (!input || typeof input !== 'string') {
        throw new Error('Input must be a non-empty string');
    }
    return CryptoJS.MD5(input).toString();
}

/**
 * Validate MD5 hash format
 * @param {string} hash - MD5 hash to validate
 * @returns {boolean} True if valid MD5 format
 */
export function isValidMD5Format(hash) {
    if (!hash || typeof hash !== 'string') {
        return false;
    }
    // MD5 is 32 hexadecimal characters
    return /^[a-f0-9]{32}$/i.test(hash);
}

/**
 * Default export for backward compatibility
 */
export default generateMD5;