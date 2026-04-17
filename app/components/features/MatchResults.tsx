"use client";

import React, { useState } from "react";
import {
  Users,
  Copy,
  Check,
  Mail,
  Phone,
  HelpCircle,
  Share2,
  RotateCcw,
} from "lucide-react";
import { type Contact } from "@/app/lib/utils/contacts";
import { obfuscateContact } from "@/app/lib/utils/contacts";
import { type SessionSignatureResult } from "@/app/lib/solana/session";

interface MatchResultsProps {
  matches: Contact[];
  totalContacts: number;
  sessionSignature: SessionSignatureResult | null;
  onReset: () => void;
}

export default function MatchResults({
  matches,
  totalContacts,
  sessionSignature,
  onReset,
}: MatchResultsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showHashes, setShowHashes] = useState(false);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    const text = matches.map((m) => m.normalized).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const matchPercent =
    totalContacts > 0 ? Math.round((matches.length / totalContacts) * 100) : 0;

  return (
    <div className="bg-arcium-card border border-arcium-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-arcium-border">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-arcium-cyan" />
              <h3 className="font-display font-semibold text-arcium-text">
                Mutual Matches
              </h3>
            </div>
            <p className="text-sm text-arcium-muted">
              {matches.length === 0
                ? "No mutual contacts found in this session."
                : `${matches.length} mutual contact${
                    matches.length !== 1 ? "s" : ""
                  } found privately.`}
            </p>
          </div>

          {/* Match % badge */}
          {totalContacts > 0 && (
            <div className="text-right">
              <div className="font-display font-bold text-2xl gradient-text">
                {matchPercent}%
              </div>
              <div className="text-xs text-arcium-muted">match rate</div>
            </div>
          )}
        </div>

        {/* Match bar */}
        {totalContacts > 0 && (
          <div className="mt-4 space-y-1.5">
            <div className="h-2 bg-arcium-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-arcium-purple to-arcium-cyan rounded-full transition-all duration-700"
                style={{ width: `${matchPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-arcium-muted">
              <span>{matches.length} matched</span>
              <span>{totalContacts - matches.length} not matched</span>
            </div>
          </div>
        )}
      </div>

      {/* Match list */}
      <div className="p-4">
        {matches.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-arcium-surface border border-arcium-border flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-arcium-muted" />
            </div>
            <p className="text-sm text-arcium-muted">
              No mutual contacts this time.
            </p>
            <p className="text-xs text-arcium-muted/60 mt-1">
              Try with a different partner wallet.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map((match, index) => (
              <div
                key={match.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-arcium-surface border border-arcium-border group hover:border-arcium-purple/30 transition-colors card-hover"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Type icon */}
                  <div className="flex-shrink-0 w-7 h-7 rounded-md bg-arcium-card flex items-center justify-center">
                    {match.type === "email" ? (
                      <Mail className="w-3.5 h-3.5 text-arcium-purple-light" />
                    ) : match.type === "phone" ? (
                      <Phone className="w-3.5 h-3.5 text-arcium-cyan" />
                    ) : (
                      <HelpCircle className="w-3.5 h-3.5 text-arcium-muted" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-mono text-arcium-text truncate">
                      {obfuscateContact(match)}
                    </div>
                    {showHashes && (
                      <div className="text-xs font-mono text-arcium-muted/50 truncate">
                        {match.hash.slice(0, 24)}…
                      </div>
                    )}
                  </div>
                </div>

                {/* Copy button */}
                <button
                  onClick={() => handleCopy(match.normalized, index)}
                  className="ml-2 flex-shrink-0 p-1.5 rounded opacity-0 group-hover:opacity-100 text-arcium-muted hover:text-arcium-purple-light transition-all"
                >
                  {copiedIndex === index ? (
                    <Check className="w-3.5 h-3.5 text-arcium-success" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {matches.length > 0 && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleCopyAll}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-arcium-surface border border-arcium-border text-sm text-arcium-text hover:border-arcium-purple/40 transition-colors"
            >
              {copiedIndex === -1 ? (
                <Check className="w-4 h-4 text-arcium-success" />
              ) : (
                <Copy className="w-4 h-4 text-arcium-muted" />
              )}
              Copy All
            </button>
            <button
              onClick={() => setShowHashes(!showHashes)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-arcium-surface border border-arcium-border text-sm text-arcium-text hover:border-arcium-cyan/40 transition-colors"
            >
              <Share2 className="w-4 h-4 text-arcium-muted" />
              {showHashes ? "Hide" : "Show"} Hashes
            </button>
          </div>
        )}

        {/* Reset */}
        <button
          onClick={onReset}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm text-arcium-muted hover:text-arcium-text hover:bg-arcium-surface transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Start New Session
        </button>

        {/* Privacy note + tx link */}
        <div className="mt-4 p-3 rounded-lg bg-arcium-surface/50 border border-arcium-border/50 text-xs text-arcium-muted/70 text-center space-y-2">
          <p>
            Non-matching contacts were never revealed to any party.
            <br />
            Arcium computed the intersection inside encrypted enclaves.
          </p>
          {sessionSignature && (
            <a
              href={sessionSignature.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-arcium-cyan hover:text-arcium-cyan/80 transition-colors font-mono"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-arcium-cyan inline-block" />
              View session tx on Solana Explorer ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
