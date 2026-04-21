"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  processContacts,
  resolveMatchedContacts,
  type Contact,
  type ProcessedContacts,
} from "@/app/lib/utils/contacts";
import {
  encryptContactHashes,
  submitPSIJob,
  waitForPSIResult,
  type PSIJobStatus,
  ArciumError,
} from "@/app/lib/arcium/client";
import {
  signSessionOnChain,
  type SessionSignatureResult,
} from "@/app/lib/solana/session";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PSIPhase =
  | "idle"
  | "signing"
  | "processing"
  | "encrypting"
  | "computing"
  | "resolving"
  | "done"
  | "error";

export interface PSIState {
  phase: PSIPhase;
  processed: ProcessedContacts | null;
  jobId: string | null;
  computeStatus: PSIJobStatus | null;
  matches: Contact[];
  sessionSignature: SessionSignatureResult | null;
  error: string | null;
}

export interface UsePSIReturn {
  state: PSIState;
  runDiscovery: (myRaw: string[], partnerRaw: string[]) => Promise<void>;
  processOnly: (raw: string[]) => Promise<void>;
  reset: () => void;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: PSIState = {
  phase: "idle",
  processed: null,
  jobId: null,
  computeStatus: null,
  matches: [],
  sessionSignature: null,
  error: null,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePSI(): UsePSIReturn {
  const { publicKey, signTransaction } = useWallet();
  const [state, setState] = useState<PSIState>(initialState);

  const updateState = useCallback((updates: Partial<PSIState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Hash-only preview (no compute)
  const processOnly = useCallback(
    async (raw: string[]) => {
      updateState({ phase: "processing", error: null });
      try {
        const processed = await processContacts(raw);
        updateState({ processed, phase: "idle" });
      } catch (err) {
        updateState({
          phase: "error",
          error: err instanceof Error ? err.message : "Processing failed",
        });
      }
    },
    [updateState]
  );

  // Full PSI flow
  const runDiscovery = useCallback(
    async (myRaw: string[], partnerRaw: string[]) => {
      if (!publicKey || !signTransaction) {
        updateState({ phase: "error", error: "Wallet not connected" });
        return;
      }

      const walletAddress = publicKey.toBase58();

      try {
        // ── 0. Sign on-chain session memo ─────────────────────────────────────
        updateState({
          phase: "signing",
          error: null,
          matches: [],
          sessionSignature: null,
          jobId: null,
          computeStatus: null,
        });

        const encoder = new TextEncoder();
        const sortedRaw = [...myRaw].sort().join(",");
        const encoded = encoder.encode(sortedRaw);
        // Explicit ArrayBuffer slice to satisfy strict TS / Vercel build
        const buffer = encoded.buffer.slice(
          encoded.byteOffset,
          encoded.byteOffset + encoded.byteLength
        ) as ArrayBuffer;

        const fingerprintBuffer = await crypto.subtle.digest("SHA-256", buffer);
        const fingerprintHex = Array.from(new Uint8Array(fingerprintBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        const sessionSignature = await signSessionOnChain(
          publicKey,
          signTransaction,
          fingerprintHex
        );

        updateState({ sessionSignature });

        // ── 1. Normalize + hash contacts client-side ──────────────────────────
        updateState({ phase: "processing" });

        const [myProcessed, partnerProcessed] = await Promise.all([
          processContacts(myRaw),
          processContacts(partnerRaw),
        ]);

        updateState({ processed: myProcessed });

        // ── 2. Encrypt both hash sets ─────────────────────────────────────────
        updateState({ phase: "encrypting" });

        const [myEncrypted, partnerEncrypted] = await Promise.all([
          encryptContactHashes(myProcessed.hashes, walletAddress),
          encryptContactHashes(partnerProcessed.hashes, "partner-pubkey"),
        ]);

        // ── 3. Submit PSI compute job ─────────────────────────────────────────
        updateState({ phase: "computing" });

        const jobId = await submitPSIJob({
          partyA: {
            encryptedHashes: myEncrypted.encryptedHashes,
            publicKey: myEncrypted.publicKey,
          },
          partyB: {
            encryptedHashes: partnerEncrypted.encryptedHashes,
            publicKey: partnerEncrypted.publicKey,
          },
        });

        updateState({ jobId });

        // ── 4. Poll for result ────────────────────────────────────────────────
        // matchedHashes are raw SHA-256 hashes (prefix already stripped in submitPSIJob)
        const matchedHashes = await waitForPSIResult(
          jobId,
          (status) => updateState({ computeStatus: status }),
          30
        );

        // ── 5. Resolve hashes → Contact objects ───────────────────────────────
        updateState({ phase: "resolving" });

        const matches = resolveMatchedContacts(
          myProcessed.contacts,
          matchedHashes
        );

        updateState({
          phase: "done",
          matches,
          computeStatus: {
            jobId,
            status: "completed",
            result: matchedHashes,
            progress: 100,
          },
        });
      } catch (err) {
        updateState({
          phase: "error",
          error:
            err instanceof ArciumError
              ? `Arcium: ${err.message}`
              : err instanceof Error
              ? err.message
              : "Unknown error occurred",
        });
      }
    },
    [publicKey, signTransaction, updateState]
  );

  const reset = useCallback(() => setState(initialState), []);

  return { state, runDiscovery, processOnly, reset };
}
