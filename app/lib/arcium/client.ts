"use client";

// ==============================
// TYPES
// ==============================

export type PSIJobStatus = {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  result?: string[];
};

export class ArciumError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArciumError";
  }
}

// ==============================
// MOCK STORE (for demo PSI)
// ==============================

const demoJobStore: Record<string, string[]> = {};

// ==============================
// ENCRYPT
// ==============================

export async function encryptContactHashes(
  hashes: string[],
  publicKey: string
): Promise<{
  encryptedHashes: string[];
  publicKey: string;
}> {
  if (!hashes || hashes.length === 0) {
    throw new ArciumError("No hashes provided");
  }

  const encryptedHashes = hashes.map((h) => `enc::${h}`);

  return {
    encryptedHashes,
    publicKey,
  };
}

// ==============================
// SUBMIT JOB
// ==============================

export async function submitPSIJob(input: {
  partyA: { encryptedHashes: string[]; publicKey: string };
  partyB: { encryptedHashes: string[]; publicKey: string };
}): Promise<string> {
  const jobId = `psi-${Date.now()}`;

  const setA = new Set(input.partyA.encryptedHashes);
  const setB = new Set(input.partyB.encryptedHashes);

  // ✅ FIX: no spread operator on Set (avoids TS build error)
  const intersection: string[] = [];

  setA.forEach((value) => {
    if (setB.has(value)) {
      intersection.push(value);
    }
  });

  demoJobStore[jobId] = intersection;

  return jobId;
}

// ==============================
// WAIT FOR RESULT
// ==============================

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
      status: result ? "completed" : "running",
      progress: result ? 100 : Math.min(elapsed * 10, 90),
      result,
    };

    if (onUpdate) onUpdate(status);

    if (result) {
      return result;
    }

    await new Promise((r) => setTimeout(r, 1000));
    elapsed++;
  }

  throw new ArciumError("PSI job timed out");
}
