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

export function isEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}

export function isPhone(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length >= 7) {
    return `+${digits}`;
  }

  return digits;
}

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

  return { normalized: trimmed.toLowerCase(), type: "unknown" };
}

// ─── Crypto (FIXED) ───────────────────────────────────────────────────────────

// Ensure crypto works in both browser and Node (Vercel)
const cryptoObj: Crypto =
  typeof globalThis.crypto !== "undefined"
    ? globalThis.crypto
    : // @ts-ignore (Node fallback)
      require("crypto").webcrypto;

/**
 * Computes SHA-256 hash of a string.
 */
export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  // ✅ FORCE a real ArrayBuffer (fixes Vercel + TS permanently)
  const buffer = data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength
  );

  const hashBuffer = await cryptoObj.subtle.digest("SHA-256", buffer);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function hashContact(normalized: string): Promise<string> {
  return sha256(normalized);
}

// ─── Full Pipeline ────────────────────────────────────────────────────────────

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

// ─── Parsing ──────────────────────────────────────────────────────────────────

export function parseContactList(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

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

// ─── Utilities ────────────────────────────────────────────────────────────────

export function resolveMatchedContacts(
  allContacts: Contact[],
  matchedHashes: string[]
): Contact[] {
  const hashSet = new Set(matchedHashes);
  return allContacts.filter((c) => hashSet.has(c.hash));
}

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
