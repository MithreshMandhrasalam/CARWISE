// ═══════════════════════════════════════════════════════════════
// CARWISE — Secure Magic Byte & Dimension Inspector
// Zero external dependencies, pure Buffer validation
// ═══════════════════════════════════════════════════════════════

/**
 * Supported MIME Types and Canonical View Types
 */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const CANONICAL_VIEW_TYPES = [
  'FRONT',
  'REAR',
  'LEFT',
  'RIGHT',
  'FRONT_LEFT',
  'FRONT_RIGHT',
  'REAR_LEFT',
  'REAR_RIGHT',
  'INTERIOR',
  'DASHBOARD',
  'ENGINE_BAY',
  'TYRES',
];

const MANDATORY_VIEW_TYPES = ['FRONT', 'REAR', 'LEFT', 'RIGHT'];

/**
 * Normalizes input view type string to canonical uppercase enum format
 */
function normalizeViewType(input) {
  if (!input || typeof input !== 'string') return null;
  const cleaned = input.trim().toUpperCase().replace(/-/g, '_');
  if (cleaned === 'ENGINE') return 'ENGINE_BAY';
  if (CANONICAL_VIEW_TYPES.includes(cleaned)) return cleaned;
  return null;
}

/**
 * Inspects buffer magic bytes and extracts image dimensions securely
 */
function validateImageBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return { valid: false, error: 'File buffer is too small or invalid.' };
  }

  // 1. JPEG Detection: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    const dimensions = parseJpegDimensions(buffer);
    return {
      valid: true,
      mimeType: 'image/jpeg',
      extension: 'jpg',
      width: dimensions.width,
      height: dimensions.height,
    };
  }

  // 2. PNG Detection: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    if (buffer.length < 24) {
      return { valid: false, error: 'Corrupt PNG header.' };
    }
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return {
      valid: true,
      mimeType: 'image/png',
      extension: 'png',
      width,
      height,
    };
  }

  // 3. WebP Detection: RIFF (0-3) + WEBP (8-11)
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    const dimensions = parseWebPDimensions(buffer);
    return {
      valid: true,
      mimeType: 'image/webp',
      extension: 'webp',
      width: dimensions.width,
      height: dimensions.height,
    };
  }

  return {
    valid: false,
    error: 'Unsupported image format. Only authentic JPEG, PNG, and WebP images are permitted.',
  };
}

/**
 * Parse JPEG dimensions by scanning SOF markers (SOF0: 0xFFC0, SOF2: 0xFFC2)
 */
function parseJpegDimensions(buffer) {
  let offset = 2;
  const maxOffset = Math.min(buffer.length, 65536); // Scan within first 64KB for safety

  while (offset < maxOffset - 8) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }

    const marker = buffer[offset + 1];

    // SOF0, SOF1, SOF2 markers contain image height and width
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width: width || 800, height: height || 600 };
    }

    // Skip variable-length marker segment
    if (marker !== 0xd8 && marker !== 0xd9 && marker !== 0x00 && marker !== 0xff) {
      const length = buffer.readUInt16BE(offset + 2);
      offset += 2 + length;
    } else {
      offset += 2;
    }
  }

  return { width: 800, height: 600 };
}

/**
 * Parse WebP dimensions from VP8 / VP8L / VP8X chunks
 */
function parseWebPDimensions(buffer) {
  if (buffer.length < 30) return { width: 800, height: 600 };

  const chunkType = buffer.toString('ascii', 12, 16);

  if (chunkType === 'VP8 ') {
    // Lossy WebP: dimensions at offset 26
    const width = buffer.readUInt16LE(26) & 0x3fff;
    const height = buffer.readUInt16LE(28) & 0x3fff;
    return { width: width || 800, height: height || 600 };
  } else if (chunkType === 'VP8L') {
    // Lossless WebP: 14 bits width, 14 bits height in 4 bytes starting at offset 21
    const b1 = buffer[21];
    const b2 = buffer[22];
    const b3 = buffer[23];
    const b4 = buffer[24];
    const width = 1 + (((b2 & 0x3f) << 8) | b1);
    const height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
    return { width: width || 800, height: height || 600 };
  } else if (chunkType === 'VP8X') {
    // Extended WebP: 24-bit width at 24, 24-bit height at 27
    const width = 1 + buffer.readUIntLE(24, 3);
    const height = 1 + buffer.readUIntLE(27, 3);
    return { width: width || 800, height: height || 600 };
  }

  return { width: 800, height: 600 };
}

module.exports = {
  ALLOWED_MIME_TYPES,
  CANONICAL_VIEW_TYPES,
  MANDATORY_VIEW_TYPES,
  normalizeViewType,
  validateImageBuffer,
};
