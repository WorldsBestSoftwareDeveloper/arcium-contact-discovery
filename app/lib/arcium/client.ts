"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PSIJobStatus = {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  result?: string[];
};

export interface EncryptedContactSet {
  jobId: string;
  encryptedHashes: string[];
  publicKey: string;
  timestamp: number;
}

export interface ArciumComputeRequest {
  partyA: { encryptedHashes: string[]; publicKey: string };
  partyB: { encryptedHashes: string[]; publicKey: string };
  poolId?: string;
}

export class ArciumError extends Error {
  statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "ArciumError";
    this.statusCode = statusCode;
  }
}

// ─── Demo job store ───────────────────────────────────────────────────────────

// Keyed by jobId, stores the ORIGINAL (non-prefixed) intersected hashes
const demoJobStore: Record<string, string[]> = {};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEMO_PREFIX = "enc::";

function addPrefix(hash: string): string {
  return `${DEMO_PREFIX}${hash}`;
}

function stripPrefix(encrypted: string): string {
  return encrypted.startsWith(DEMO_PREFIX)
    ? encrypted.slice(DEMO_PREFIX.length)
    : encrypted;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Encrypt ──────────────────────────────────────────────────────────────────

/**
 * Simulates Arcium encryption by prefixing each hash.
 * In production this calls Arcium's encryption endpoint.
 * The prefix is deterministic so both parties' identical hashes
 * still match after encryption.
 */
export async function encryptContactHashes(
  hashes: string[],
  walletPublicKey: string
): Promise<EncryptedContactSet> {
  if (!hashes || hashes.length === 0) {
    throw new ArciumError("No hashes provided to encrypt");
  }

  await sleep(400); // Simulate encryption latency

  return {
    jobId: `enc-job-${Date.now()}`,
    // ✅ Deterministic prefix — same plaintext hash → same encrypted value
    // This is what makes matching work: enc::abc123 === enc::abc123
    encryptedHashes: hashes.map(addPrefix),
    publicKey: walletPublicKey,
    timestamp: Date.now(),
  };
}

// ─── Submit PSI job ───────────────────────────────────────────────────────────

/**
 * Computes the intersection of two encrypted hash sets.
 * In production this runs inside Arcium's secure enclaves.
 *
 * IMPORTANT: Returns the intersection as ORIGINAL hashes (prefix stripped),
 * so resolveMatchedContacts can look them up in the contacts array.
 */
export async function submitPSIJob(
  request: ArciumComputeRequest
): Promise<string> {
  await sleep(600); // Simulate submission latency

  const jobId = `psi-${Date.now()}`;

  const setA = new Set(request.partyA.encryptedHashes);

  // Find common encrypted hashes, then strip the prefix before storing
  const intersection: string[] = [];
  request.partyB.encryptedHashes.forEach((encHash) => {
    if (setA.has(encHash)) {
      // ✅ Strip prefix so matchedHashes are raw SHA-256 hashes
      // that resolveMatchedContacts can compare against contact.hash
      intersection.push(stripPrefix(encHash));
    }
  });

  demoJobStore[jobId] = intersection;

  return jobId;
}

// ─── Wait for result ──────────────────────────────────────────────────────────

/**
 * Polls for PSI job completion.
 * Returns the raw (non-prefixed) intersection hashes.
 */
export async function waitForPSIResult(
  jobId: string,
  onUpdate?: (status: PSIJobStatus) => void,
  timeoutSeconds = 30
): Promise<string[]> {
  let elapsed = 0;

  while (elapsed < timeoutSeconds) {
    const result = demoJobStore[jobId];

    const status: PSIJobStatus = {
      jobId,
      status: result !== undefined ? "completed" : "running",
      progress: result !== undefined ? 100 : Math.min(elapsed * 15, 85),
      result,
    };

    onUpdate?.(status);

    if (result !== undefined) {
      return result;
    }

    await sleep(1000);
    elapsed++;
  }

  throw new ArciumError("PSI job timed out");
}

/**
 * Checks Arcium API connectivity.
 */
export async function checkArciumConnection(): Promise<boolean> {
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_ARCIUM_API_URL ?? "https://api.arcium.com";
    const apiKey = process.env.ARCIUM_API_KEY ?? "";
    const response = await fetch(`${apiUrl}/v1/health`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
