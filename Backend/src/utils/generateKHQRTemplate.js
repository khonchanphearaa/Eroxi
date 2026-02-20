/**
 * generateKHQRTemplate.js
 * Place this file in: src/utils/generateKHQRTemplate.js
 *
 * Install dependency: npm install canvas
 * (qrcode is already installed)
 *
 * Official Bakong KHQR card design:
 * ┌──────────────────────────────┐
 * │▓▓▓▓ KHQR ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← red header, diagonal bottom edge
 * │   ┌──────────────────┐      │
 * │   │   [QR CODE]      │      │  ← white card body
 * │   └──────────────────┘      │
 * │   Merchant Name             │
 * │   ៛ 5,000  /  $ 1.50        │
 * │   Invoice #1001             │
 * │- - - - - - - - - - - - - - │
 * │   National Bank of Cambodia │
 * └──────────────────────────────┘
 */

import { createCanvas } from "canvas";
import QRCode from "qrcode";

/**
 * @param {object} opts
 * @param {string} opts.qrString       Raw KHQR EMVCo string
 * @param {string} opts.merchantName   Displayed on card
 * @param {number} opts.amount         Payment amount
 * @param {string} opts.currency       "KHR" or "USD"
 * @param {string} [opts.description]  Optional note
 * @returns {Promise<string>}          base64 PNG (data:image/png;base64,...)
 */
export async function generateKHQRTemplate({ qrString, merchantName, amount, currency, description }) {
    const W       = 440;
    const H       = 600;
    const RADIUS  = 18;
    const HDR_H   = 100;
    const QR_SIZE = 256;
    const QR_PAD  = 12;
    const QR_X    = (W - QR_SIZE) / 2;
    const QR_Y    = HDR_H + 36;

    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext("2d");

    // White card with shadow
    ctx.shadowColor   = "rgba(0,0,0,0.22)";
    ctx.shadowBlur    = 24;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle     = "#FFFFFF";
    roundRect(ctx, 4, 4, W - 8, H - 8, RADIUS);
    ctx.fill();
    ctx.shadowColor   = "transparent";
    ctx.shadowBlur    = 0;

    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, 0, 0, W, H, RADIUS);
    ctx.fill();

    // Red header clipped to top rounded corners
    ctx.save();
    roundRect(ctx, 0, 0, W, H, RADIUS);
    ctx.clip();

    ctx.fillStyle = "#CC1F2D";
    ctx.fillRect(0, 0, W, HDR_H);

    // Diagonal accent stripe at bottom of header
    ctx.beginPath();
    ctx.moveTo(0, HDR_H);
    ctx.lineTo(W * 0.6, HDR_H);
    ctx.lineTo(W, HDR_H - 22);
    ctx.lineTo(W, HDR_H);
    ctx.closePath();
    ctx.fillStyle = "#A8151E";
    ctx.fill();
    ctx.restore();

    // KHQR text
    ctx.fillStyle    = "#FFFFFF";
    ctx.font         = "bold 38px Arial";
    ctx.textAlign    = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("KHQR", 28, HDR_H / 2 - 9);

    // Khmer subtitle
    ctx.font      = "14px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.fillText("ស្កេនដើម្បីទូទាត់", 28, HDR_H / 2 + 17);

    // "Scan to Pay" right side
    ctx.textAlign = "right";
    ctx.font      = "12px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.fillText("Scan to Pay", W - 20, HDR_H / 2);

    // QR shadow box
    ctx.shadowColor   = "rgba(0,0,0,0.12)";
    ctx.shadowBlur    = 16;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle     = "#FFFFFF";
    roundRect(ctx, QR_X - QR_PAD, QR_Y - QR_PAD, QR_SIZE + QR_PAD * 2, QR_SIZE + QR_PAD * 2, 10);
    ctx.fill();
    ctx.shadowColor   = "transparent";
    ctx.shadowBlur    = 0;
    ctx.shadowOffsetY = 0;

    // Draw QR onto canvas
    const qrCanvas = createCanvas(QR_SIZE, QR_SIZE);
    await QRCode.toCanvas(qrCanvas, qrString, {
        errorCorrectionLevel: "M",
        width:  QR_SIZE,
        margin: 1,
        color:  { dark: "#000000", light: "#FFFFFF" },
    });
    ctx.drawImage(qrCanvas, QR_X, QR_Y, QR_SIZE, QR_SIZE);

    // Dashed divider
    const divY = QR_Y + QR_SIZE + QR_PAD + 28;
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "#DDDDDD";
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(32, divY);
    ctx.lineTo(W - 32, divY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Merchant name
    ctx.fillStyle    = "#1A1A2E";
    ctx.font         = "bold 20px Arial";
    ctx.textAlign    = "center";
    ctx.textBaseline = "top";
    ctx.fillText(clip(merchantName, 30), W / 2, divY + 16);

    // Amount
    ctx.fillStyle = "#CC1F2D";
    ctx.font      = "bold 28px Arial";
    ctx.fillText(fmtAmount(amount, currency), W / 2, divY + 46);

    // Description
    if (description) {
        ctx.fillStyle = "#888888";
        ctx.font      = "13px Arial";
        ctx.fillText(clip(description, 44), W / 2, divY + 86);
    }

    // Footer
    ctx.fillStyle = "#BBBBBB";
    ctx.font      = "11px Arial";
    ctx.fillText("National Bank of Cambodia · bakong.nbc.gov.kh", W / 2, H - 18);

    return canvas.toDataURL("image/png");
}

function fmtAmount(amount, currency) {
    return String(currency).toUpperCase() === "KHR"
        ? `\u17db ${Number(amount).toLocaleString("en-US")}`
        : `$ ${parseFloat(amount).toFixed(2)}`;
}

function clip(str, max) {
    if (!str) return "";
    return str.length > max ? str.slice(0, max - 1) + "\u2026" : str;
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h,     x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y,         x + r, y);
    ctx.closePath();
}