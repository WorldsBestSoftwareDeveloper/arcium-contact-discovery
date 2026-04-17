/**
 * Contact Processing Utilities
 *
 * Client-side contact normalization and hashing.
 * All hashing is deterministic: SHA-256(normalized_contact)
 * Contacts are hashed BEFORE encryption — raw data never leaves the device.
 */

export interface Contact {
  id: string;
  raw: string;
  normalized: string;
  hash: string;
  type: "email" | "phone" | "unknown";
}

export interface ProcessedContacts {
  contacts: Contact[];
  hashes: string[];
  stats: {
    total: number;
    emails: number;
    phones: number;
    duplicatesRemoved: number;
  };
}

// ─── Normalization ────────────────────────────────────────────────────────────

/**
 * Detects whether a string is an email address.
 */
export function isEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}

/**
 * Detects whether a string looks like a phone number.
 */
export function isPhone(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Normalizes an email: lowercase, trimmed.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Normalizes a phone number to E.164 format.
 * Assumes US number if no country code is detected.
 */
export function normalizePhone(phone: string): string {
  // Strip all non-digit chars
  const digits = phone.replace(/\D/g, "");

  // If 11 digits starting with 1 → already has US country code
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // If 10 digits → US number
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Otherwise use digits as-is with leading +
  if (digits.length >= 7) {
    return `+${digits}`;
  }

  return digits;
}

/**
 * Normalizes a contact string based on its detected type.
 */
export function normalizeContact(
  raw: string
): { normalized: string; type: "email" | "phone" | "unknown" } {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { normalized: "", type: "unknown" };
  }

  if (isEmail(trimmed)) {
    return { normalized: normalizeEmail(trimmed), type: "email" };
  }

  if (isPhone(trimmed)) {
    return { normalized: normalizePhone(trimmed), type: "phone" };
  }

  // Fallback: lowercase + trim
  return { normalized: trimmed.toLowerCase(), type: "unknown" };
}

// ─── Hashing ─────────────────────────────────────────────────────────────────

/**
 * Computes SHA-256 hash of a string.
 * Returns hex-encoded hash string.
 *
 * Uses Web Crypto API (available in all modern browsers and Node.js 18+).
 */
export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Hashes a normalized contact string.
 * Input: "alice@example.com"
 * Output: "2c624232cdd221771294dfbb310acbc8..." (64 hex chars)
 */
export async function hashContact(normalized: string): Promise<string> {
  return sha256(normalized);
}

// ─── Full Pipeline ────────────────────────────────────────────────────────────

/**
 * Processes raw contact strings:
 * 1. Normalize (email/phone formatting)
 * 2. Deduplicate
 * 3. Hash with SHA-256
 *
 * Returns Contact objects with metadata and final hash list.
 */
export async function processContacts(
  rawInputs: string[]
): Promise<ProcessedContacts> {
  const seenNormalized = new Set<string>();
  const contacts: Contact[] = [];
  let duplicatesRemoved = 0;
  let emails = 0;
  let phones = 0;

  for (const raw of rawInputs) {
    if (!raw.trim()) continue;

    const { normalized, type } = normalizeContact(raw);
    if (!normalized) continue;

    // Deduplicate on normalized value
    if (seenNormalized.has(normalized)) {
      duplicatesRemoved++;
      continue;
    }
    seenNormalized.add(normalized);

    const hash = await hashContact(normalized);

    contacts.push({
      id: hash.slice(0, 8),
      raw,
      normalized,
      hash,
      type,
    });

    if (type === "email") emails++;
    if (type === "phone") phones++;
  }

  return {
    contacts,
    hashes: contacts.map((c) => c.hash),
    stats: {
      total: contacts.length,
      emails,
      phones,
      duplicatesRemoved,
    },
  };
}

/**
 * Parses a pasted contact list (newline or comma separated).
 */
export function parseContactList(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Parses a CSV file content (expects first column = contact).
 */
export function parseContactCSV(csvContent: string): string[] {
  const lines = csvContent.split("\n");
  const contacts: string[] = [];

  for (const line of lines) {
    const cols = line.split(",");
    if (cols.length > 0 && cols[0].trim()) {
      contacts.push(cols[0].trim().replace(/^["']|["']$/g, ""));
    }
  }

  return contacts;
}

/**
 * Given a set of matched hashes, find the original Contact entries.
 * Used to map Arcium results back to human-readable contacts.
 */
export function resolveMatchedContacts(
  allContacts: Contact[],
  matchedHashes: string[]
): Contact[] {
  const hashSet = new Set(matchedHashes);
  return allContacts.filter((c) => hashSet.has(c.hash));
}

/**
 * Obfuscates a contact for display (e.g., "a***@example.com").
 */
export function obfuscateContact(contact: Contact): string {
  if (contact.type === "email") {
    const [local, domain] = contact.normalized.split("@");
    const masked =
      local.length <= 2
        ? "***"
        : local[0] + "*".repeat(local.length - 2) + local[local.length - 1];
    return `${masked}@${domain}`;
  }

  if (contact.type === "phone") {
    const n = contact.normalized;
    return n.slice(0, 3) + "***" + n.slice(-3);
  }

  return contact.normalized.slice(0, 3) + "***";
}
