"use client";

import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  Search,
  AlertCircle,
  Wallet,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { usePSI } from "@/app/hooks/usePSI";
import ContactInput from "./ContactInput";
import ComputeProgress from "./ComputeProgress";
import MatchResults from "./MatchResults";

export default function Dashboard() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { state, runDiscovery, processOnly, reset } = usePSI();

  const [myContacts, setMyContacts] = useState<string[]>([]);
  const [partnerContacts, setPartnerContacts] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const canRun =
    connected &&
    myContacts.length > 0 &&
    partnerContacts.length > 0 &&
    state.phase === "idle";

  const isRunning =
    state.phase !== "idle" &&
    state.phase !== "done" &&
    state.phase !== "error";

  const handleRun = () => {
    runDiscovery(myContacts, partnerContacts);
  };

  const handleReset = () => {
    reset();
    setMyContacts([]);
    setPartnerContacts([]);
  };

  return (
    <section
      id="dashboard"
      className="min-h-screen py-24 px-4 relative"
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Section header */}
        <div className="text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-arcium-text mb-2">
            Private Contact Discovery
          </h2>
          <p className="text-arcium-muted text-sm max-w-md mx-auto">
            Enter two contact sets. Arcium's encrypted compute reveals only the
            mutual matches.
          </p>
        </div>

        {/* Not connected banner */}
        {!connected && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-arcium-purple/10 border border-arcium-purple/30">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-arcium-purple-light flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-arcium-text">
                  Wallet required
                </div>
                <div className="text-xs text-arcium-muted">
                  Connect your Solana wallet to start a discovery session
                </div>
              </div>
            </div>
            <button
              onClick={() => setVisible(true)}
              className="flex-shrink-0 px-4 py-2 rounded-lg bg-arcium-purple text-white text-sm font-medium hover:bg-arcium-purple/80 transition-colors"
            >
              Connect
            </button>
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ContactInput
            label="Your Contacts"
            description="Your private contact list — hashed on your device"
            processed={state.processed}
            isProcessing={state.phase === "processing"}
            onContactsChange={setMyContacts}
            onProcess={(contacts) => processOnly(contacts)}
          />

          <ContactInput
            label="Database Contacts"
            description="The other party's contact set for comparison"
            processed={null}
            isProcessing={false}
            onContactsChange={setPartnerContacts}
            onProcess={() => {}}
          />
        </div>

        {/* Devnet test helper */}
        <div className="rounded-xl border border-arcium-border bg-arcium-card overflow-hidden">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-4 text-sm text-arcium-muted hover:text-arcium-text transition-colors"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>Devnet test helpers</span>
            </div>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showAdvanced && (
            <div className="px-4 pb-4 border-t border-arcium-border pt-3">
              <p className="text-xs text-arcium-muted mb-3">
                Load sample contact sets to test the flow on devnet.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const sampleA = [
                      "alice@example.com",
                      "bob@gmail.com",
                      "+14155552671",
                      "carol@web3.io",
                      "dave@test.com",
                    ];
                    setMyContacts(sampleA);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-arcium-surface border border-arcium-border text-xs text-arcium-text hover:border-arcium-purple/40 transition-colors"
                >
                  Load My Sample (5)
                </button>
                <button
                  onClick={() => {
                    const sampleB = [
                      "bob@gmail.com",
                      "carol@web3.io",
                      "frank@example.com",
                      "+14155559999",
                      "grace@solana.dev",
                    ];
                    setPartnerContacts(sampleB);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-arcium-surface border border-arcium-border text-xs text-arcium-text hover:border-arcium-purple/40 transition-colors"
                >
                  Load Partner Sample (5)
                </button>
                <button
                  onClick={() => {
                    setMyContacts([
                      "alice@example.com",
                      "bob@gmail.com",
                      "+14155552671",
                      "carol@web3.io",
                      "dave@test.com",
                    ]);
                    setPartnerContacts([
                      "bob@gmail.com",
                      "carol@web3.io",
                      "frank@example.com",
                      "+14155559999",
                      "grace@solana.dev",
                    ]);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-arcium-purple/20 border border-arcium-purple/30 text-xs text-arcium-purple-light hover:bg-arcium-purple/30 transition-colors"
                >
                  Load Both (expect 2 matches)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error display */}
        {state.phase === "error" && state.error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-900/10 border border-red-500/30">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-red-400">
                Computation failed
              </div>
              <div className="text-xs text-red-400/70 mt-1">{state.error}</div>
              <button
                onClick={handleReset}
                className="mt-2 text-xs text-red-400 hover:underline"
              >
                Try again →
              </button>
            </div>
          </div>
        )}

        {/* Progress */}
        {state.phase !== "idle" && state.phase !== "error" && (
          <ComputeProgress
            phase={state.phase}
            jobId={state.jobId}
            computeStatus={state.computeStatus}
            sessionSignature={state.sessionSignature}
          />
        )}

        {/* Results */}
        {state.phase === "done" && (
          <MatchResults
            matches={state.matches}
            totalContacts={state.processed?.stats.total ?? 0}
            sessionSignature={state.sessionSignature}
            onReset={handleReset}
          />
        )}

        {/* Run button */}
        {state.phase === "idle" && (
          <div className="flex justify-center pt-2">
            <button
              onClick={handleRun}
              disabled={!canRun}
              className={`relative flex items-center gap-3 px-8 py-4 rounded-xl font-display font-semibold text-lg transition-all duration-200 ${
                canRun
                  ? "bg-arcium-purple hover:bg-arcium-purple/90 text-white glow-purple cursor-pointer"
                  : "bg-arcium-surface border border-arcium-border text-arcium-muted cursor-not-allowed"
              }`}
            >
              <Search className="w-5 h-5" />
              Find Matches Privately
              {!connected && (
                <span className="text-xs font-body font-normal opacity-70">
                  (connect wallet first)
                </span>
              )}
              {connected && myContacts.length === 0 && (
                <span className="text-xs font-body font-normal opacity-70">
                  (add contacts)
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
