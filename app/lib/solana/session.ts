/**
 * Solana Session Signing
 *
 * Signs a real on-chain transaction when a PSI session is initiated.
 * Uses the SPL Memo program — a standard Solana program that records
 * arbitrary text into a transaction, creating a verifiable on-chain record.
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  clusterApiUrl,
} from "@solana/web3.js";

// SPL Memo program ID
const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

export interface SessionSignatureResult {
  signature: string;
  explorerUrl: string;
  memo: string;
}

export async function signSessionOnChain(
  publicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  contactSetHash: string
): Promise<SessionSignatureResult> {
  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      clusterApiUrl("devnet"),
    "confirmed"
  );

  const memo = JSON.stringify({
    app: "PrivFind",
    action: "psi_session_init",
    wallet: publicKey.toBase58().slice(0, 8) + "...",
    setHash: contactSetHash.slice(0, 16) + "...",
    ts: Date.now(),
  });

  // 🔥 Memo instruction (main payload)
  const memoInstruction = new TransactionInstruction({
    keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo, "utf-8"),
  });

  // 🔥 Build transaction
  const transaction = new Transaction();

  // ✅ FIX 1: Add nonce instruction to guarantee uniqueness
  transaction.add(
    new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(`nonce:${Date.now()}`),
    })
  );

  transaction.add(memoInstruction);

  // ✅ Always fetch fresh blockhash
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  transaction.recentBlockhash = blockhash;
  transaction.feePayer = publicKey;

  // Sign
  const signed = await signTransaction(transaction);

  let signature: string;

  try {
    // Send
    signature = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
  } catch (err: any) {
  if (err.message?.includes("already been processed")) {
    // 🔁 retry WITHOUT re-signing first
    try {
      signature = await connection.sendRawTransaction(
        signed.serialize()
      );
    } catch {
      // only re-sign if retry fails
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");

      transaction.recentBlockhash = blockhash;

      const reSigned = await signTransaction(transaction);

      signature = await connection.sendRawTransaction(
        reSigned.serialize()
      );

      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      return {
        signature,
        explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        memo,
      };
    }
  }

  throw err;
}

  // Confirm
  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed"
  );

  const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

  return { signature, explorerUrl, memo };
}