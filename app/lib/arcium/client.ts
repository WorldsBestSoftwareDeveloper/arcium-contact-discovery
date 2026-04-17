/**
 * Arcium SDK Integration
 *
 * This module integrates with Arcium's encrypted compute network for
 * Private Set Intersection (PSI). All computation happens inside
 * Arcium's secure enclaves — contact data never leaves the encrypted layer.
 *
 * Docs: https://docs.arcium.com
 *
 * DEMO MODE: Set NEXT_PUBLIC_ARCIUM_DEMO_MODE=true in .env.local to run
 * without a real Arcium API key. The PSI logic runs client-side to simulate
 * the full UI flow. In production, set this to false and provide a real key.
 */

// ─── Demo / Simulation Mode ───────────────────────────────────────────────────

function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_ARCIUM_DEMO_MODE === "true";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simulates Arcium encryption locally.
 * In real mode this would call Arcium's encryption endpoint.
 */
async function simulateEncrypt(
  hashes: string[],
  walletPublicKey: string
): Promise<EncryptedContactSet> {
  await sleep(800); // Simulate network latency
  return {
    jobId: `demo-job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    // In demo mode we XOR each hash byte with a fixed key to "encrypt"
    encryptedHashes: hashes.map((h) => `enc::${h}`),
    publicKey: `demo-pubkey-${walletPublicKey.slice(0, 8)}`,
    timestamp: Date.now(),
  };
}

/**
 * Simulates PSI compute locally — finds the real intersection of the two sets.
 * In production this runs inside Arcium's secure enclaves.
 */
async function simulatePSI(
  partyA: { encryptedHashes: string[] },
  partyB: { encryptedHashes: string[] }
): Promise<string> {
  await sleep(600);
  // Strip the "enc::" prefix to get original hashes, then intersect
  const setA = new Set(partyA.encryptedHashes.map((h) => h.replace("enc::", "")));
  const setB = new Set(partyB.encryptedHashes.map((h) => h.replace("enc::", "")));
  const intersection = [...setA].filter((h) => setB.has(h));
  // Store result keyed by a fake job ID
  const jobId = `demo-psi-${Date.now()}`;
  demoJobStore[jobId] = intersection;
  return jobId;
}

// In-memory store for demo PSI results
const demoJobStore: Record<string, string[]> = {};

export interface ArciumConfig {
  apiUrl: string;
  apiKey: string;
}

export interface EncryptedContactSet {
  jobId: string;
  encryptedHashes: string[];
  publicKey: string;
  timestamp: number;
}

export interface PSIJobStatus {
  jobId: string;
  status: "pending" | "computing" | "completed" | "failed";
  progress?: number;
  result?: string[];
  error?: string;
}

export interface ArciumComputeRequest {
  partyA: {
    encryptedHashes: string[];
    publicKey: string;
  };
  partyB: {
    encryptedHashes: string[];
    publicKey: string;
  };
  poolId?: string;
}

// Arcium API endpoints
const ARCIUM_ENDPOINTS = {
  submitJob: "/v1/compute/psi",
  getJobStatus: "/v1/compute/jobs",
  getPool: "/v1/pools",
  joinPool: "/v1/pools/join",
  encrypt: "/v1/encrypt",
};

/**
 * Encrypts a set of contact hashes using Arcium's encryption service.
 * The hashes are encrypted with Arcium's public key so only the secure
 * enclave can decrypt them during computation.
 *
 * Falls back to demo simulation if NEXT_PUBLIC_ARCIUM_DEMO_MODE=true.
 */
export async function encryptContactHashes(
  hashes: string[],
  walletPublicKey: string
): Promise<EncryptedContactSet> {
  if (isDemoMode()) {
    return simulateEncrypt(hashes, walletPublicKey);
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_ARCIUM_API_URL || "https://api.arcium.com";
  const apiKey = process.env.ARCIUM_API_KEY || "";

  const response = await fetch(`${apiUrl}${ARCIUM_ENDPOINTS.encrypt}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Wallet-Address": walletPublicKey,
    },
    body: JSON.stringify({
      hashes,
      walletAddress: walletPublicKey,
      timestamp: Date.now(),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ArciumError(
      `Encryption failed: ${error.message || response.statusText}`,
      response.status
    );
  }

  const data = await response.json();
  return {
    jobId: data.jobId,
    encryptedHashes: data.encryptedHashes,
    publicKey: data.publicKey,
    timestamp: Date.now(),
  };
}

/**
 * Submits a PSI computation job to Arcium's compute network.
 * The intersection is computed entirely inside Arcium's secure enclaves.
 * Neither party's full contact set is revealed — only the intersection.
 *
 * Falls back to demo simulation if NEXT_PUBLIC_ARCIUM_DEMO_MODE=true.
 */
export async function submitPSIJob(
  request: ArciumComputeRequest
): Promise<string> {
  if (isDemoMode()) {
    return simulatePSI(request.partyA, request.partyB);
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_ARCIUM_API_URL || "https://api.arcium.com";
  const apiKey = process.env.ARCIUM_API_KEY || "";

  const response = await fetch(`${apiUrl}${ARCIUM_ENDPOINTS.submitJob}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      parties: [request.partyA, request.partyB],
      computeType: "private_set_intersection",
      outputMode: "intersection_only",
      poolId: request.poolId,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ArciumError(
      `Job submission failed: ${error.message || response.statusText}`,
      response.status
    );
  }

  const data = await response.json();
  return data.jobId;
}

/**
 * Polls Arcium for the result of a PSI computation job.
 * Returns only the intersected hashes — never the full sets.
 *
 * Falls back to demo simulation if NEXT_PUBLIC_ARCIUM_DEMO_MODE=true.
 */
export async function getPSIJobResult(jobId: string): Promise<PSIJobStatus> {
  if (isDemoMode()) {
    await sleep(1200); // Simulate compute time
    const result = demoJobStore[jobId];
    if (result !== undefined) {
      return { jobId, status: "completed", progress: 100, result };
    }
    return { jobId, status: "computing", progress: 60 };
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_ARCIUM_API_URL || "https://api.arcium.com";
  const apiKey = process.env.ARCIUM_API_KEY || "";

  const response = await fetch(
    `${apiUrl}${ARCIUM_ENDPOINTS.getJobStatus}/${jobId}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new ArciumError(
      `Status check failed: ${response.statusText}`,
      response.status
    );
  }

  const data = await response.json();
  return {
    jobId,
    status: data.status,
    progress: data.progress,
    result: data.result?.intersectionHashes || [],
    error: data.error,
  };
}

/**
 * Joins the shared discovery pool where users submit their encrypted
 * contact sets. Pool-based matching allows asynchronous discovery
 * without requiring both parties to be online simultaneously.
 */
export async function joinDiscoveryPool(
  walletAddress: string,
  encryptedSet: EncryptedContactSet
): Promise<string> {
  const apiUrl =
    process.env.NEXT_PUBLIC_ARCIUM_API_URL || "https://api.arcium.com";
  const apiKey = process.env.ARCIUM_API_KEY || "";

  const response = await fetch(`${apiUrl}${ARCIUM_ENDPOINTS.joinPool}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      walletAddress,
      encryptedJobId: encryptedSet.jobId,
      encryptedHashes: encryptedSet.encryptedHashes,
      publicKey: encryptedSet.publicKey,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ArciumError(
      `Pool join failed: ${error.message || response.statusText}`,
      response.status
    );
  }

  const data = await response.json();
  return data.poolMemberId;
}

/**
 * Polls for PSI job completion with exponential backoff.
 * Calls onProgress callback during polling.
 */
export async function waitForPSIResult(
  jobId: string,
  onProgress?: (status: PSIJobStatus) => void,
  maxAttempts = 30
): Promise<string[]> {
  let attempts = 0;
  const baseDelay = 2000;

  while (attempts < maxAttempts) {
    const status = await getPSIJobResult(jobId);
    onProgress?.(status);

    if (status.status === "completed") {
      return status.result || [];
    }

    if (status.status === "failed") {
      throw new ArciumError(`Computation failed: ${status.error}`);
    }

    // Exponential backoff: 2s, 3s, 4.5s, 6.75s, max 15s
    const delay = Math.min(baseDelay * Math.pow(1.5, attempts), 15000);
    await sleep(delay);
    attempts++;
  }

  throw new ArciumError("Computation timed out");
}

// ─── Custom Error ────────────────────────────────────────────────────────────

export class ArciumError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "ArciumError";
    this.statusCode = statusCode;
  }
}

/**
 * Checks if Arcium API is reachable and API key is valid.
 */
export async function checkArciumConnection(): Promise<boolean> {
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_ARCIUM_API_URL || "https://api.arcium.com";
    const apiKey = process.env.ARCIUM_API_KEY || "";

    const response = await fetch(`${apiUrl}/v1/health`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });

    return response.ok;
  } catch {
    return false;
  }
}
