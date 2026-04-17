"use client";

import React, { useState } from "react";
import {
  Hash,
  Lock,
  Server,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowDown,
  Cpu,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Hash,
    title: "Contacts are hashed",
    description:
      "Before anything leaves your device, every contact is normalized (lowercase email, E.164 phone) and hashed with SHA-256. Raw contact data is never transmitted.",
    detail: "SHA-256(normalize('alice@example.com')) → a9b8c7...",
    color: "purple",
    badge: "On your device",
  },
  {
    number: "02",
    icon: Lock,
    title: "Hashes are encrypted",
    description:
      "The hashed set is encrypted with Arcium's public key. Only Arcium's secure compute enclave can decrypt it — not even Arcium's servers outside the enclave.",
    detail: "Encrypt(hashes, arcium_pubkey) → ciphertext",
    color: "cyan",
    badge: "Arcium encryption",
  },
  {
    number: "03",
    icon: Cpu,
    title: "Arcium computes privately",
    description:
      "Both encrypted sets are sent to Arcium's Multi-Party Computation (MPC) network. The intersection is computed entirely inside encrypted enclaves. Neither full set is ever exposed.",
    detail: "PSI(encryptedA, encryptedB) → intersection_only",
    color: "purple",
    badge: "Secure enclaves",
  },
  {
    number: "04",
    icon: Eye,
    title: "Only matches are revealed",
    description:
      "Arcium returns only the hashes that exist in both sets. Your app maps those hashes back to your original contacts. The other party's non-matching contacts are never revealed.",
    detail: "Reveal: [hash_of_bob, hash_of_carol] only",
    color: "cyan",
    badge: "Intersection only",
  },
];

const guarantees = [
  {
    icon: EyeOff,
    title: "Zero raw data upload",
    desc: "Only hashed + encrypted contact sets leave your device",
  },
  {
    icon: ShieldCheck,
    title: "Non-matches stay hidden",
    desc: "Contacts that don't match are never revealed to anyone",
  },
  {
    icon: Server,
    title: "Server-blind computation",
    desc: "Arcium's compute nodes process encrypted data — they can't read it",
  },
  {
    icon: Lock,
    title: "Deterministic hashing",
    desc: "Same contact always produces the same hash, enabling matching",
  },
];

export default function HowItWorks() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <section id="how-it-works" className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-arcium-purple/3 to-transparent pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-arcium-surface border border-arcium-border mb-5">
            <ShieldCheck className="w-3.5 h-3.5 text-arcium-cyan" />
            <span className="text-xs font-mono text-arcium-cyan tracking-wider uppercase">
              Privacy Architecture
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-arcium-text mb-4">
            How your privacy is protected
          </h2>
          <p className="text-arcium-muted max-w-xl mx-auto">
            Every step is designed so that contact data stays private. Here's
            exactly what happens when you run a discovery session.
          </p>
        </div>

        {/* Steps flow */}
        <div className="space-y-3 mb-14">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isOpen = expanded === index;

            return (
              <div key={index}>
                <button
                  onClick={() => setExpanded(isOpen ? null : index)}
                  className={`w-full text-left p-5 rounded-xl border transition-all duration-200 card-hover ${
                    isOpen
                      ? step.color === "purple"
                        ? "bg-arcium-purple/10 border-arcium-purple/40"
                        : "bg-arcium-cyan/5 border-arcium-cyan/30"
                      : "bg-arcium-card border-arcium-border hover:border-arcium-border/80"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Step number */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${
                        step.color === "purple"
                          ? "bg-arcium-purple/20 border-arcium-purple/40"
                          : "bg-arcium-cyan/10 border-arcium-cyan/30"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          step.color === "purple"
                            ? "text-arcium-purple-light"
                            : "text-arcium-cyan"
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-arcium-muted">
                          {step.number}
                        </span>
                        <h3 className="font-display font-semibold text-arcium-text">
                          {step.title}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${
                            step.color === "purple"
                              ? "text-arcium-purple-light border-arcium-purple/30 bg-arcium-purple/10"
                              : "text-arcium-cyan border-arcium-cyan/30 bg-arcium-cyan/10"
                          }`}
                        >
                          {step.badge}
                        </span>
                      </div>

                      {isOpen && (
                        <div className="mt-3 space-y-3">
                          <p className="text-sm text-arcium-muted leading-relaxed">
                            {step.description}
                          </p>
                          <div className="font-mono text-xs text-arcium-muted/60 bg-arcium-surface px-3 py-2 rounded-lg border border-arcium-border">
                            {step.detail}
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      className={`flex-shrink-0 text-arcium-muted transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Guarantees grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {guarantees.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex gap-3 p-4 rounded-xl bg-arcium-card border border-arcium-border"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-arcium-purple/10 border border-arcium-purple/20 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-arcium-purple-light" />
              </div>
              <div>
                <div className="font-medium text-sm text-arcium-text">
                  {title}
                </div>
                <div className="text-xs text-arcium-muted mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Arcium link */}
        <div className="mt-10 text-center">
          <p className="text-sm text-arcium-muted">
            Encrypted compute powered by{" "}
            <a
              href="https://arcium.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-arcium-purple-light hover:underline"
            >
              Arcium
            </a>{" "}
            ·{" "}
            <a
              href="https://docs.arcium.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-arcium-muted hover:text-arcium-text transition-colors"
            >
              Read the docs →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
