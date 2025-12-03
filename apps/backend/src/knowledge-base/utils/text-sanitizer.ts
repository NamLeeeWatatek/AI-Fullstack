/**
 * Text Sanitizer Utilities
 * Clean and validate text before storing in database
 */

/**
 * Remove null bytes and other invalid characters for PostgreSQL UTF8
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';

  return (
    text
      // Remove null bytes (0x00)
      .replace(/\0/g, '')
      // Remove other control characters except newlines and tabs
      .replace(/[\x01-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
      // Remove invalid UTF-8 sequences
      .replace(/[\uD800-\uDFFF]/g, '')
      // Normalize whitespace
      .replace(/\r\n/g, '\n')
      // Remove excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/**
 * Validate if text is safe for database storage
 */
export function isValidText(text: string): boolean {
  if (!text) return true;

  // Check for null bytes
  if (text.includes('\0')) return false;

  // Check for invalid UTF-8
  try {
    // Try to encode/decode to check validity
    const encoded = new TextEncoder().encode(text);
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(encoded);
    return decoded === text;
  } catch {
    return false;
  }
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\.{2,}/g, '.')
    .trim();
}

/**
 * Truncate text to max length safely (don't break UTF-8)
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Truncate and ensure we don't break UTF-8 surrogate pairs
  let truncated = text.substring(0, maxLength);

  // Check if we're in the middle of a surrogate pair
  const lastChar = truncated.charCodeAt(truncated.length - 1);
  if (lastChar >= 0xd800 && lastChar <= 0xdbff) {
    // High surrogate, remove it
    truncated = truncated.substring(0, truncated.length - 1);
  }

  return truncated;
}

/**
 * Extract clean text from various formats
 */
export function extractCleanText(content: string, mimeType?: string): string {
  let cleaned = sanitizeText(content);

  // Additional cleaning based on mime type
  if (mimeType?.includes('html')) {
    // Remove HTML tags
    cleaned = cleaned.replace(/<[^>]*>/g, ' ');
    // Decode HTML entities
    cleaned = cleaned
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
  }

  if (mimeType?.includes('json')) {
    try {
      // Pretty print JSON
      const parsed = JSON.parse(cleaned);
      cleaned = JSON.stringify(parsed, null, 2);
    } catch {
      // If not valid JSON, keep as is
    }
  }

  return cleaned;
}

/**
 * Detect and handle different encodings
 */
export function normalizeEncoding(buffer: Buffer): string {
  try {
    // Try UTF-8 first
    const utf8Text = buffer.toString('utf-8');
    if (isValidText(utf8Text)) {
      return sanitizeText(utf8Text);
    }
  } catch {
    // UTF-8 failed
  }

  try {
    // Try Latin1/ISO-8859-1
    const latin1Text = buffer.toString('latin1');
    return sanitizeText(latin1Text);
  } catch {
    // Latin1 failed
  }

  // Fallback: remove non-ASCII characters
  return sanitizeText(buffer.toString('ascii', 0, buffer.length));
}

/**
 * Validate and sanitize metadata object
 */
export function sanitizeMetadata(
  metadata: Record<string, any> | null | undefined,
): Record<string, any> {
  if (!metadata) return {};

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const sanitizedKey = sanitizeText(key);

    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeText(value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[sanitizedKey] = value;
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.map((item) =>
        typeof item === 'string' ? sanitizeText(item) : item,
      );
    } else if (value && typeof value === 'object') {
      sanitized[sanitizedKey] = sanitizeMetadata(value);
    }
  }

  return sanitized;
}
