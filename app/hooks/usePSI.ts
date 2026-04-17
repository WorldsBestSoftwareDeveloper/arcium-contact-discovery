/**
 * usePSI — Private Set Intersection orchestration hook
 *
 * Coordinates:
 * 0. Solana wallet signs a memo tx (on-chain session proof)
 * 1. Client-side contact normalization + hashing
 * 2. Arcium encryption
 * 3. Arcium PSI compute
 * 4. Result resolution back to original contacts
 */

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
  runDiscovery: (
    myRawContacts: string[],
    partnerRawContacts: string[]
  ) => Promise<void>;
  processOnly: (rawContacts: string[]) => Promise<void>;
  reset: () => void;
}

const initialState: PSIState = {
  phase: "idle",
  processed: null,
  jobId: null,
  computeStatus: null,
  matches: [],
  sessionSignature: null,
  error: null,
};

export function usePSI(): UsePSIReturn {
  const { publicKey, signTransaction } = useWallet();
  const [state, setState] = useState<PSIState>(initialState);

  const updateState = useCallback((updates: Partial<PSIState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const processOnly = useCallback(
    async (rawContacts: string[]) => {
      updateState({ phase: "processing", error: null });
      try {
        const processed = await processContacts(rawContacts);
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

  const runDiscovery = useCallback(
    async (myRawContacts: string[], partnerRawContacts: string[]) => {
      // prevent duplicate runs
      if (state.phase !== "idle" && state.phase !== "error") return;

      if (!publicKey || !signTransaction) {
        updateState({ phase: "error", error: "Wallet not connected" });
        return;
      }

      const walletAddress = publicKey.toBase58();

      try {
        // reset session state
        updateState({
          phase: "signing",
          error: null,
          matches: [],
          sessionSignature: null,
          jobId: null,
          computeStatus: null,
        });

        // -----------------------------
        // FIXED CRYPTO FINGERPRINT (Vercel-safe)
        // -----------------------------
        const encoder = new TextEncoder();
        const data = encoder.encode(
          myRawContacts.sort().join(",")
        );

        const buffer = new Uint8Array(data).slice().buffer;

        const contactFingerprint = await crypto.subtle.digest(
          "SHA-256",
          buffer
        );

        const fingerprintHex = Array.from(
          new Uint8Array(contactFingerprint)
        )
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        // sign session on-chain
        const sessionSignature = await signSessionOnChain(
          publicKey,
          signTransaction,
          fingerprintHex
        );

        updateState({ sessionSignature });

        // Step 1: Normalize + hash contacts
        updateState({ phase: "processing" });

        const [myProcessed, partnerProcessed] = await Promise.all([
          processContacts(myRawContacts),
          processContacts(partnerRawContacts),
        ]);

        updateState({ processed: myProcessed });

        // Step 2: Encrypt
        updateState({ phase: "encrypting" });

        const [myEncrypted, partnerEncrypted] = await Promise.all([
          encryptContactHashes(myProcessed.hashes, walletAddress),
          encryptContactHashes(
            partnerProcessed.hashes,
            "demo-partner-key"
          ),
        ]);

        // Step 3: Submit PSI job
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

        // Step 4: Poll result
        const matchedHashes = await waitForPSIResult(
          jobId,
          (status) => updateState({ computeStatus: status }),
          30
        );

        // Step 5: Resolve matches
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
        const message =
          err instanceof ArciumError
            ? `Arcium: ${err.message}`
            : err instanceof Error
            ? err.message
            : "Unknown error occurred";

        updateState({ phase: "error", error: message });
      }
    },
    [publicKey, signTransaction, updateState, state.phase]
  );

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return { state, runDiscovery, processOnly, reset };
}
