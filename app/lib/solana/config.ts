/**
 * Solana Wallet Configuration
 * Network: Devnet
 * Supported wallets: Phantom, Solflare
 */

import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

export const SOLANA_NETWORK = WalletAdapterNetwork.Devnet;

export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  clusterApiUrl(WalletAdapterNetwork.Devnet);

export const solanaConnection = new Connection(SOLANA_RPC_URL, "confirmed");

/**
 * Shortens a wallet address for display
 * e.g. "AbCd...XyZ1"
 */
export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Validates a Solana public key string
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the SOL balance of a wallet on devnet
 */
export async function getWalletBalance(address: string): Promise<number> {
  try {
    const pubkey = new PublicKey(address);
    const lamports = await solanaConnection.getBalance(pubkey);
    return lamports / 1e9; // Convert to SOL
  } catch {
    return 0;
  }
}

/**
 * Stores a hash commitment of a contact set on-chain (optional).
 * This creates a verifiable record that a user participated in a
 * matching session, without revealing any contact data.
 *
 * NOTE: Full on-chain storage is a nice-to-have; core privacy logic
 * uses Arcium encrypted compute, not on-chain data.
 */
export async function storeMatchCommitment(
  walletAddress: string,
  matchJobId: string,
  contactSetHash: string
): Promise<string | null> {
  // In a full implementation, this would use a Solana program (smart contract)
  // to store a commitment (hash of jobId + contactSetHash) on-chain.
  // For devnet demo: we log it and return a mock transaction signature.
  console.log("[Solana] Commitment would be stored on-chain:", {
    wallet: walletAddress,
    jobId: matchJobId,
    hash: contactSetHash.slice(0, 16) + "...",
  });

  return null; // No on-chain tx in MVP — Arcium handles the compute
}
