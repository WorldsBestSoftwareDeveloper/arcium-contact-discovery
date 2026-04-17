"use client";

import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Shield, Lock, Zap, ChevronDown } from "lucide-react";

export default function Hero() {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  const scrollToDashboard = () => {
    document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-grid px-4">
      {/* Ambient glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-arcium-purple/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-arcium-cyan/8 rounded-full blur-3xl pointer-events-none" />

      {/* Orbital ring decoration */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[600px] h-[600px] opacity-20">
          <div className="absolute inset-0 rounded-full border border-arcium-purple/30" />
          <div className="absolute inset-8 rounded-full border border-arcium-cyan/20 border-dashed" />
          <div className="absolute inset-16 rounded-full border border-arcium-purple/20" />

          {/* Orbiting dots */}
          <div
            className="absolute top-1/2 left-1/2 w-3 h-3 -mt-1.5 -ml-1.5"
            style={{ animation: "orbit 10s linear infinite" }}
          >
            <div className="w-3 h-3 rounded-full bg-arcium-purple" />
          </div>
          <div
            className="absolute top-1/2 left-1/2 w-2 h-2 -mt-1 -ml-1"
            style={{ animation: "orbit 15s linear infinite reverse" }}
          >
            <div className="w-2 h-2 rounded-full bg-arcium-cyan" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-3xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-arcium-surface border border-arcium-border mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-arcium-cyan status-pulse" />
          <span className="text-xs font-mono text-arcium-cyan tracking-wider uppercase">
            Private Compute · Solana Devnet
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6">
          <span className="text-arcium-text">Find your friends</span>
          <br />
          <span className="gradient-text text-glow-purple">without exposing</span>
          <br />
          <span className="text-arcium-text">your contacts</span>
        </h1>

        <p className="text-arcium-muted text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
          Powered by private computation using{" "}
          <span className="text-arcium-purple-light font-medium">Arcium</span>.
          Only mutual matches are revealed — nothing else leaves your device.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {[
            { icon: Lock, label: "Zero-knowledge compute" },
            { icon: Shield, label: "Contacts stay on-device" },
            { icon: Zap, label: "Real encrypted matching" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-arcium-surface border border-arcium-border text-sm text-arcium-muted"
            >
              <Icon className="w-3.5 h-3.5 text-arcium-purple-light" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        {!connected ? (
          <button
            onClick={() => setVisible(true)}
            className="group relative px-8 py-4 rounded-xl bg-arcium-purple hover:bg-arcium-purple/90 text-white font-display font-semibold text-lg transition-all duration-200 glow-purple"
          >
            <span className="relative z-10">Connect Wallet to Start</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-arcium-purple to-arcium-cyan/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        ) : (
          <button
            onClick={scrollToDashboard}
            className="group px-8 py-4 rounded-xl bg-arcium-surface border border-arcium-purple/50 hover:border-arcium-purple text-arcium-purple-light font-display font-semibold text-lg transition-all duration-200"
          >
            Start Discovery
            <ChevronDown className="inline-block ml-2 w-5 h-5 group-hover:translate-y-1 transition-transform" />
          </button>
        )}

        {/* Scroll hint */}
        <div className="mt-16 flex flex-col items-center gap-2 text-arcium-muted/50 animate-bounce">
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>
    </section>
  );
}
