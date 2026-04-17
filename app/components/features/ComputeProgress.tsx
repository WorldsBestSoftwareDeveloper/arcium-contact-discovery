"use client";

import React from "react";
import {
  Lock,
  Server,
  Cpu,
  Unlock,
  CheckCircle2,
  AlertCircle,
  PenLine,
} from "lucide-react";
import { type PSIPhase } from "@/app/hooks/usePSI";
import { type PSIJobStatus } from "@/app/lib/arcium/client";
import { type SessionSignatureResult } from "@/app/lib/solana/session";

interface ComputeProgressProps {
  phase: PSIPhase;
  jobId: string | null;
  computeStatus: PSIJobStatus | null;
  sessionSignature: SessionSignatureResult | null;
}

const phases = [
  {
    key: "signing",
    icon: PenLine,
    label: "Sign Session",
    desc: "Wallet signs a Solana memo — on-chain proof of session initiation",
    color: "cyan",
  },
  {
    key: "processing",
    icon: Lock,
    label: "Normalize & Hash",
    desc: "Contacts are hashed with SHA-256 on your device",
    color: "purple",
  },
  {
    key: "encrypting",
    icon: Server,
    label: "Arcium Encryption",
    desc: "Hashes encrypted before leaving your browser",
    color: "cyan",
  },
  {
    key: "computing",
    icon: Cpu,
    label: "Secure Compute",
    desc: "Arcium runs PSI inside encrypted enclaves",
    color: "purple",
  },
  {
    key: "resolving",
    icon: Unlock,
    label: "Reveal Matches",
    desc: "Only intersecting hashes are returned",
    color: "cyan",
  },
] as const;

const phaseOrder: PSIPhase[] = [
  "idle",
  "signing",
  "processing",
  "encrypting",
  "computing",
  "resolving",
  "done",
];

function getPhaseIndex(phase: PSIPhase): number {
  return phaseOrder.indexOf(phase);
}

export default function ComputeProgress({
  phase,
  jobId,
  computeStatus,
  sessionSignature,
}: ComputeProgressProps) {
  const currentIndex = getPhaseIndex(phase);
  const isActive = phase !== "idle" && phase !== "done" && phase !== "error";
  const isDone = phase === "done";
  const isError = phase === "error";

  if (phase === "idle") return null;

  return (
    <div className="bg-arcium-card border border-arcium-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-arcium-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-arcium-purple-light" />
          <span className="font-display font-semibold text-sm text-arcium-text">
            Arcium Compute
          </span>
        </div>

        {isActive && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-arcium-purple status-pulse" />
            <span className="text-xs font-mono text-arcium-purple-light">
              running
            </span>
          </div>
        )}

        {isDone && (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-arcium-success" />
            <span className="text-xs font-mono text-arcium-success">
              complete
            </span>
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-mono text-red-400">failed</span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Steps */}
        <div className="space-y-2">
          {phases.map((step, index) => {
            const stepPhaseIndex = index + 1;
            const isCompleted = isDone || currentIndex > stepPhaseIndex;
            const isCurrent = isActive && currentIndex === stepPhaseIndex;

            const Icon = step.icon;

            return (
              <div key={step.key} className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border ${
                    isCompleted
                      ? "bg-arcium-success/10 border-arcium-success/30"
                      : isCurrent
                      ? "bg-arcium-purple/20 border-arcium-purple/50"
                      : "bg-arcium-surface border-arcium-border"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-arcium-success" />
                  ) : (
                    <Icon className="w-3.5 h-3.5 text-arcium-muted" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="text-sm font-medium text-arcium-text">
                    {step.label}
                  </div>
                  <p className="text-xs text-arcium-muted">{step.desc}</p>

                  {step.key === "signing" &&
                    isCompleted &&
                    sessionSignature && (
                      <a
                        href={sessionSignature.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-arcium-cyan hover:underline font-mono"
                      >
                        {sessionSignature.signature.slice(0, 12)}... ↗ Explorer
                      </a>
                    )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Job ID */}
        {jobId && (
          <div className="p-3 rounded-lg bg-arcium-surface border border-arcium-border">
            <div className="text-xs text-arcium-muted">Arcium Job ID</div>
            <div className="font-mono text-xs text-arcium-purple-light">
              {jobId}
            </div>
          </div>
        )}

        {/* Progress */}
        {phase === "computing" && computeStatus && (
          <div>
            <div className="flex justify-between text-xs text-arcium-muted">
              <span>Compute progress</span>
              <span>{computeStatus.progress ?? 0}%</span>
            </div>
            <div className="h-1.5 bg-arcium-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-arcium-purple to-arcium-cyan"
                style={{ width: `${computeStatus.progress ?? 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-arcium-muted/50 font-mono">
          secured by arcium.com
        </div>
      </div>
    </div>
  );
}