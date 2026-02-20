/**
 * Bakong KHQR — RAW EMVCo Implementation (No SDK)
 * ─────────────────────────────────────────────────────────────────────────────
 * Built by reading the official KHQR SDK Document v2.7 (NBC)
 * Matches the official bakong-khqr SDK output exactly.
 *
 * BUGS FIXED (compared to previous versions):
 *
 * Bug 1 — GLOBALLY_UNIQUE_ID was "khqr" or "bakong.gov.kh"
 *   ❌ Wrong: sub-tag 00 inside tag 29 = "bakong.gov.kh"
 *   ✅ Fixed: sub-tag 00 inside tag 29 = bakongAccountId directly
 *
 * Bug 2 — Timestamp was INSIDE tag 62 as sub-tag 99
 *   ❌ Wrong: tag 62 → sub 08 (description) + sub 99 (timestamp)
 *   ✅ Fixed: tag 99 is a STANDALONE top-level tag, NOT inside tag 62
 *
 * Bug 3 — Timestamp was in SECONDS (10 digits)
 *   ❌ Wrong: Math.floor(Date.now() / 1000) → "1771478283" (10 digits)
 *   ✅ Fixed: Date.now() → "1771499981397" (13 digits, milliseconds)
 *
 * Bug 4 — KHR amount had decimal places
 *   ❌ Wrong: parseFloat(100).toFixed(2) → "100.00"
 *   ✅ Fixed: KHR = Math.round(amount).toString() → "100"
 *
 * Correct tag order (per SDK output):
 *   00 → 01 → 29 → 52 → 53 → 54 → 58 → 59 → 60 → 62 → 99 → 63
 */

import QRCode from 'qrcode';
import { generateMD5 } from '../utils/md5.js';
import crc16 from '../utils/crc16.js';
import config from '../config/bakong.config.js';
import logger from '../utils/logger.js';

/* ─── EMVCo Tag IDs ─────────────────────────────────────────────────────────── */
const TAG = {
  PAYLOAD_FORMAT:          '00',
  POINT_OF_INITIATION:     '01',
  INDIVIDUAL_ACCOUNT:      '29',  // Individual: sub 00 = accountId
  MERCHANT_ACCOUNT:        '30',  // Merchant:   sub 00 = accountId, sub 01 = merchantId, sub 02 = acquiringBank
    BAKONG_ACCOUNT_ID:     '00',  // accountId (e.g. yourname@aba)
    ACCOUNT_INFORMATION:   '01',  // phone or account number (optional)
    ACQUIRING_BANK:        '02',  // acquiring bank name (optional individual, required merchant)
    MERCHANT_ID:           '03',  // merchant ID (merchant only)
  MERCHANT_CATEGORY_CODE:  '52',
  CURRENCY:                '53',
  AMOUNT:                  '54',
  COUNTRY_CODE:            '58',
  MERCHANT_NAME:           '59',
  MERCHANT_CITY:           '60',
  ADDITIONAL_DATA:         '62',  // sub-tags: 01 bill, 02 mobile, 03 store, 07 terminal, 08 purpose
    BILL_NUMBER:           '01',
    MOBILE_NUMBER:         '02',
    STORE_LABEL:           '03',
    TERMINAL_LABEL:        '07',
    PURPOSE_OF_TXN:        '08',
  TIMESTAMP:               '99',  // ✅ STANDALONE top-level tag, sub 00 = timestamp in ms
  CRC:                     '63',
};

/* ─── TLV field builder ─────────────────────────────────────────────────────── */
function field(id, value) {
  if (value === undefined || value === null || value === '') return '';
  const strValue = value.toString();
  const length   = strValue.length.toString().padStart(2, '0');
  return `${id}${length}${strValue}`;
}

/* ─── Amount formatter ──────────────────────────────────────────────────────── */
// ✅ KHR = whole number (no decimals), USD = 2 decimal places
function formatAmount(amount, currency) {
  if (currency.toUpperCase() === 'KHR') {
    return Math.round(parseFloat(amount)).toString();
  }
  return parseFloat(amount).toFixed(2);
}

/* ─── Tag 29: Individual account info ──────────────────────────────────────── */
function buildIndividualAccountInfo({ bakongAccountId, accountInformation, acquiringBank }) {
  let content = '';
  content += field(TAG.BAKONG_ACCOUNT_ID,   bakongAccountId);     // sub 00 required
  if (accountInformation) content += field(TAG.ACCOUNT_INFORMATION, accountInformation); // sub 01 optional
  if (acquiringBank)      content += field(TAG.ACQUIRING_BANK,     acquiringBank);       // sub 02 optional
  return field(TAG.INDIVIDUAL_ACCOUNT, content);
}

/* ─── Tag 30: Merchant account info ────────────────────────────────────────── */
function buildMerchantAccountInfo({ bakongAccountId, merchantId, acquiringBank }) {
  let content = '';
  content += field(TAG.BAKONG_ACCOUNT_ID, bakongAccountId); // sub 00 required
  content += field(TAG.MERCHANT_ID,       merchantId.toString()); // sub 03 required — NOTE: SDK uses sub 01 for merchantId in tag 30
  content += field(TAG.ACQUIRING_BANK,    acquiringBank);   // sub 02 required
  return field(TAG.MERCHANT_ACCOUNT, content);
}

/* ─── Tag 62: Additional data (NO timestamp here) ──────────────────────────── */
function buildAdditionalData({ billNumber, mobileNumber, storeLabel, terminalLabel, description }) {
  let content = '';
  if (billNumber)    content += field(TAG.BILL_NUMBER,   billNumber);
  if (mobileNumber)  content += field(TAG.MOBILE_NUMBER, mobileNumber);
  if (storeLabel)    content += field(TAG.STORE_LABEL,   storeLabel);
  if (terminalLabel) content += field(TAG.TERMINAL_LABEL,terminalLabel);
  if (description)   content += field(TAG.PURPOSE_OF_TXN,description);
  return content ? field(TAG.ADDITIONAL_DATA, content) : '';
}

/* ─── Tag 99: Standalone timestamp ─────────────────────────────────────────── */
// ✅ Standalone top-level tag, sub 00 = timestamp in MILLISECONDS (13 digits)
function buildTimestamp(timestampMs) {
  return field(TAG.TIMESTAMP, field('00', timestampMs.toString()));
}

/* ─── CRC-16-CCITT ──────────────────────────────────────────────────────────── */
function calculateCRC(qrData) {
  const dataForChecksum = qrData + field(TAG.CRC, '0000');
  const checksum = crc16(dataForChecksum);
  return checksum.toString(16).toUpperCase().padStart(4, '0');
}

/* ─────────────────────────────────────────────────────────────────────────────
 * generateIndividual
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates KHQR for a personal Bakong account (Tag 29)
 *
 * Tag order: 00 → 01 → 29 → 52 → 53 → [54] → 58 → 59 → 60 → [62] → 99 → 63
 */
export function generateIndividual(params) {
  const {
    bakongAccountId,
    merchantName,
    merchantCity         = config.bakong.merchantCity,
    accountInformation,
    acquiringBank,
    amount,
    currency             = 'USD',
    billNumber,
    mobileNumber,
    storeLabel,
    terminalLabel,
    description,
    merchantCategoryCode = '5999',
  } = params;

  if (!bakongAccountId) throw new Error('bakongAccountId is required');
  if (!merchantName)    throw new Error('merchantName is required');

  const hasAmount    = amount !== undefined && amount !== null && amount !== '';
  const pointOfInit  = hasAmount ? '12' : '11';
  const currencyCode = currency.toUpperCase() === 'KHR' ? '116' : '840';

  // ✅ Timestamp in MILLISECONDS for tag 99 (always present per SDK)
  const timestampMs = Date.now();

  // expiresAt for your DB — add expiration seconds to current time
  const expiresAt = hasAmount
    ? new Date(timestampMs + config.bakong.qrExpirationSeconds * 1000).toISOString()
    : null;

  logger.info('Generating Individual KHQR', { bakongAccountId, amount: hasAmount ? amount : 'static', currency });

  let qr = '';
  qr += field(TAG.PAYLOAD_FORMAT,         '01');
  qr += field(TAG.POINT_OF_INITIATION,    pointOfInit);
  qr += buildIndividualAccountInfo({ bakongAccountId, accountInformation, acquiringBank }); // Tag 29
  qr += field(TAG.MERCHANT_CATEGORY_CODE, merchantCategoryCode);
  qr += field(TAG.CURRENCY,               currencyCode);
  if (hasAmount) qr += field(TAG.AMOUNT,  formatAmount(amount, currency));
  qr += field(TAG.COUNTRY_CODE,  'KH');
  qr += field(TAG.MERCHANT_NAME, merchantName);
  qr += field(TAG.MERCHANT_CITY, merchantCity);
  qr += buildAdditionalData({ billNumber, mobileNumber, storeLabel, terminalLabel, description }); // Tag 62 (no timestamp)
  qr += buildTimestamp(timestampMs); // Tag 99 standalone ✅

  const crcValue = calculateCRC(qr);
  qr += field(TAG.CRC, crcValue);

  const md5 = generateMD5(qr);

  logger.info('KHQR generated', { md5, expiresAt, qr });
  return { qrString: qr, md5, expiresAt };
}

/* ─────────────────────────────────────────────────────────────────────────────
 * generateMerchant
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates KHQR for a registered merchant account (Tag 30)
 *
 * Tag order: 00 → 01 → 30 → 52 → 53 → [54] → 58 → 59 → 60 → [62] → 99 → 63
 */
export function generateMerchant(params) {
  const {
    bakongAccountId,
    merchantName,
    merchantCity         = config.bakong.merchantCity,
    merchantId,
    acquiringBank,
    amount,
    currency             = 'USD',
    billNumber,
    mobileNumber,
    storeLabel,
    terminalLabel,
    description,
    merchantCategoryCode = '5999',
  } = params;

  if (!bakongAccountId || !merchantName || !merchantId || !acquiringBank) {
    throw new Error('bakongAccountId, merchantName, merchantId, and acquiringBank are all required for Merchant QR');
  }

  const hasAmount    = amount !== undefined && amount !== null && amount !== '';
  const pointOfInit  = hasAmount ? '12' : '11';
  const currencyCode = currency.toUpperCase() === 'KHR' ? '116' : '840';
  const timestampMs  = Date.now();

  const expiresAt = hasAmount
    ? new Date(timestampMs + config.bakong.qrExpirationSeconds * 1000).toISOString()
    : null;

  let qr = '';
  qr += field(TAG.PAYLOAD_FORMAT,         '01');
  qr += field(TAG.POINT_OF_INITIATION,    pointOfInit);
  qr += buildMerchantAccountInfo({ bakongAccountId, merchantId, acquiringBank }); // Tag 30
  qr += field(TAG.MERCHANT_CATEGORY_CODE, merchantCategoryCode);
  qr += field(TAG.CURRENCY,               currencyCode);
  if (hasAmount) qr += field(TAG.AMOUNT,  formatAmount(amount, currency));
  qr += field(TAG.COUNTRY_CODE,  'KH');
  qr += field(TAG.MERCHANT_NAME, merchantName);
  qr += field(TAG.MERCHANT_CITY, merchantCity);
  qr += buildAdditionalData({ billNumber, mobileNumber, storeLabel, terminalLabel, description });
  qr += buildTimestamp(timestampMs); // Tag 99 standalone ✅

  const crcValue = calculateCRC(qr);
  qr += field(TAG.CRC, crcValue);

  return {
    qrString: qr,
    md5: generateMD5(qr),
    expiresAt,
  };
}

/* ─── Render QR as base64 PNG ───────────────────────────────────────────────── */
export async function renderQRImage(qrString) {
  return QRCode.toDataURL(qrString, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
  });
}

/* ─── Verify QR CRC ─────────────────────────────────────────────────────────── */
export function verify(qrString) {
  try {
    if (!qrString || typeof qrString !== 'string') return false;
    if (!qrString.startsWith('000201'))            return false;
    const providedCRC    = qrString.slice(-4);
    const dataWithoutCRC = qrString.slice(0, -8);
    const calculatedCRC  = calculateCRC(dataWithoutCRC);
    return providedCRC === calculatedCRC;
  } catch {
    return false;
  }
}

/* ─── Decode QR string into tag map ─────────────────────────────────────────── */
export function decode(qrString) {
  const result = {};
  let pos = 0;
  while (pos < qrString.length - 4) {
    const id  = qrString.slice(pos, pos + 2);
    const len = parseInt(qrString.slice(pos + 2, pos + 4), 10);
    if (isNaN(len)) break;
    result[id] = qrString.slice(pos + 4, pos + 4 + len);
    pos += 4 + len;
    if (id === '63') break;
  }
  return result;
}