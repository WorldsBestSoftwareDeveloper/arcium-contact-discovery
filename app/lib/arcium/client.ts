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

const initialState: PSIState = {
  phase: "idle",
  processed: null,
  jobId: null,
  computeStatus: null,
  matches: [],
  sessionSignature: null,
  error: null,
};

export function usePSI() {
  const { publicKey, signTransaction } = useWallet();
  const [state, setState] = useState<PSIState>(initialState);

  const updateState = useCallback((updates: Partial<PSIState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const runDiscovery = useCallback(
    async (myRawContacts: string[], partnerRawContacts: string[]) => {
      if (state.phase !== "idle" && state.phase !== "error") return;

      if (!publicKey || !signTransaction) {
        updateState({ phase: "error", error: "Wallet not connected" });
        return;
      }

      const walletAddress = publicKey.toBase58();

      try {
        updateState({
          phase: "signing",
          error: null,
          matches: [],
          sessionSignature: null,
          jobId: null,
          computeStatus: null,
        });

        // =========================================================
        // FIXED FINGERPRINT (TypeScript + WebCrypto safe)
        // =========================================================
        const encoder = new TextEncoder();

        const normalized = [...myRawContacts]
          .filter(Boolean)
          .map((c) => c.trim().toLowerCase())
          .sort()
          .join(",");

        const data = encoder.encode(normalized);

        // IMPORTANT FIX:
        // crypto.subtle.digest expects BufferSource = Uint8Array or ArrayBuffer
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);

        const fingerprintHex = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        const sessionSignature = await signSessionOnChain(
          publicKey,
          signTransaction,
          fingerprintHex
        );

        updateState({ sessionSignature });

        // Step 1: Process contacts
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
          encryptContactHashes(partnerProcessed.hashes, "demo-partner-key"),
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

        // Step 4: Poll results
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
        updateState({
          phase: "error",
          error:
            err instanceof ArciumError
              ? `Arcium: ${err.message}`
              : err instanceof Error
              ? err.message
              : "Unknown error",
        });
      }
    },
    [publicKey, signTransaction, state.phase, updateState]
  );

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return { state, runDiscovery, reset };
}
