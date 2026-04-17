import type { Metadata } from "next";
import "./globals.css";
import WalletConnectionProvider from "./components/layout/WalletProvider";
import Navbar from "./components/layout/Navbar";

export const metadata: Metadata = {
  title: "PrivFind — Private Contact Discovery",
  description:
    "Find your friends without exposing your contacts. Powered by Arcium encrypted compute on Solana.",
  keywords: ["privacy", "solana", "arcium", "contact discovery", "PSI", "web3"],
  openGraph: {
    title: "PrivFind — Private Contact Discovery",
    description: "Encrypted contact matching using Arcium × Solana",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-arcium-bg text-arcium-text antialiased">
        <WalletConnectionProvider>
          <Navbar />
          <main>{children}</main>
        </WalletConnectionProvider>
      </body>
    </html>
  );
}
