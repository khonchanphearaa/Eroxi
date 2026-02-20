/**
 * CRC-16-CCITT Implementation (Bakong KHQR Standard)
 * ──────────────────────────────────────────────────
 * Calculates CRC-16-CCITT checksum for EMVCo QR codes
 * Polynomial: 0x1021
 * Initial Value: 0xFFFF
 * Final XOR: 0x0000
 * Reflect Input: false
 * Reflect Output: false
 * 
 * Reference: EMVCo QR Code Specification
 */

/**
 * Calculate CRC-16-CCITT checksum
 * @param {string} data - Input data (QR code string)
 * @returns {number} CRC-16 checksum value
 */
export default function crc16(data) {
  let crc = 0xFFFF;
  const poly = 0x1021;

  for (let i = 0; i < data.length; i++) {
    const byte = data.charCodeAt(i);
    crc ^= byte << 8;

    for (let j = 0; j < 8; j++) {
      crc <<= 1;
      if (crc & 0x10000) {
        crc ^= poly;
      }
      crc &= 0xFFFF;
    }
  }

  return crc;
}
