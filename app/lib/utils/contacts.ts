/**
 * Contact Processing Utilities
 *
 * Client-side normalization and SHA-256 hashing.
 * Raw contact data never leaves the device.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Detection ────────────────────────────────────────────────────────────────

export function isEmail(input: string): boolean {
  // Must contain exactly one @, with non-empty local + domain parts
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}

export function isPhone(input: string): boolean {
  const trimmed = input.trim();
  // Reject if it looks like an email at all
  if (trimmed.includes("@")) return false;
  const digits = trimmed.replace(/\D/g, "");
  // Must be 7–15 digits and contain at least one digit character at start/end
  return digits.length >= 7 && digits.length <= 15 && /^\+?[\d\s\-().]+$/.test(trimmed);
}

// ─── Normalization ────────────────────────────────────────────────────────────

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  // Already has US country code: 1XXXXXXXXXX
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  // US 10-digit number
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  // International with leading +
  if (digits.length >= 7) {
    return `+${digits}`;
  }
  return digits;
}

export function normalizeContact(
  raw: string
): { normalized: string; type: "email" | "phone" | "unknown" } {
  const trimmed = raw.trim();

  if (!trimmed) return { normalized: "", type: "unknown" };

  // Email takes priority — checked first before phone
  if (isEmail(trimmed)) {
    return { normalized: normalizeEmail(trimmed), type: "email" };
  }

  if (isPhone(trimmed)) {
    return { normalized: normalizePhone(trimmed), type: "phone" };
  }

  return { normalized: trimmed.toLowerCase(), type: "unknown" };
}

// ─── Hashing ──────────────────────────────────────────────────────────────────

// Works in both browser (Web Crypto) and Node/Vercel (webcrypto)
const cryptoObj: Crypto =
  typeof globalThis.crypto !== "undefined"
    ? globalThis.crypto
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    : (require("crypto").webcrypto as Crypto);

export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(input);
  // Explicit ArrayBuffer slice — required for strict TS on Vercel
  const buffer = encoded.buffer.slice(
    encoded.byteOffset,
    encoded.byteOffset + encoded.byteLength
  ) as ArrayBuffer;
  const hashBuffer = await cryptoObj.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashContact(normalized: string): Promise<string> {
  return sha256(normalized);
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

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
    contacts.push({ id: hash.slice(0, 8), raw, normalized, hash, type });

    if (type === "email") emails++;
    if (type === "phone") phones++;
  }

  return {
    contacts,
    hashes: contacts.map((c) => c.hash),
    stats: { total: contacts.length, emails, phones, duplicatesRemoved },
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
  return csvContent
    .split("\n")
    .map((line) => line.split(",")[0]?.trim().replace(/^["']|["']$/g, "") ?? "")
    .filter(Boolean);
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
    const atIndex = contact.normalized.indexOf("@");
    if (atIndex < 0) return contact.normalized.slice(0, 3) + "***";
    const local = contact.normalized.slice(0, atIndex);
    const domain = contact.normalized.slice(atIndex);
    const masked =
      local.length <= 2
        ? "***"
        : local[0] + "*".repeat(local.length - 2) + local[local.length - 1];
    return `${masked}${domain}`;
  }

  if (contact.type === "phone") {
    const n = contact.normalized;
    return n.slice(0, 3) + "***" + n.slice(-3);
  }

  return contact.normalized.slice(0, 3) + "***";
}
