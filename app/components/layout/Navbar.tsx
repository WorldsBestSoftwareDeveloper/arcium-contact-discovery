"use client";

import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Shield, Zap, LogOut, Copy, Check } from "lucide-react";
import { shortenAddress } from "@/app/lib/solana/config";
import { useState } from "react";

export default function Navbar() {
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-arcium-border bg-arcium-bg/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-lg bg-arcium-purple/20 border border-arcium-purple/40" />
            <Shield
              className="absolute inset-0 m-auto w-4 h-4 text-arcium-purple-light"
              strokeWidth={2}
            />
          </div>
          <div>
            <span className="font-display font-semibold text-sm text-arcium-text tracking-wide">
              PrivFind
            </span>
            <div className="flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-arcium-cyan" />
              <span className="text-[10px] text-arcium-muted font-mono">
                Arcium × Solana
              </span>
            </div>
          </div>
        </div>

        {/* Network badge + wallet */}
        <div className="flex items-center gap-3">
          {/* Devnet badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-arcium-surface border border-arcium-border">
            <div className="w-1.5 h-1.5 rounded-full bg-arcium-cyan animate-pulse" />
            <span className="text-xs font-mono text-arcium-cyan">devnet</span>
          </div>

          {connected && publicKey ? (
            <div className="flex items-center gap-2">
              {/* Address pill */}
              <button
                onClick={handleCopyAddress}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-arcium-surface border border-arcium-border hover:border-arcium-purple/50 transition-colors group"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-arcium-success" />
                <span className="text-xs font-mono text-arcium-text">
                  {shortenAddress(publicKey.toBase58())}
                </span>
                {copied ? (
                  <Check className="w-3 h-3 text-arcium-success" />
                ) : (
                  <Copy className="w-3 h-3 text-arcium-muted group-hover:text-arcium-purple-light transition-colors" />
                )}
              </button>

              {/* Disconnect */}
              <button
                onClick={disconnect}
                className="p-1.5 rounded-lg text-arcium-muted hover:text-arcium-text hover:bg-arcium-surface transition-colors"
                title="Disconnect wallet"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setVisible(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-arcium-purple hover:bg-arcium-purple/80 text-white text-sm font-medium transition-colors font-body"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
