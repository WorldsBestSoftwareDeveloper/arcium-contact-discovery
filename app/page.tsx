import Hero from "./components/features/Hero";
import Dashboard from "./components/features/Dashboard";
import HowItWorks from "./components/features/HowItWorks";

export default function Home() {
  return (
    <>
      <Hero />
      <Dashboard />
      <HowItWorks />

      {/* Footer */}
      <footer className="border-t border-arcium-border py-8 px-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-arcium-muted">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-arcium-cyan animate-pulse" />
            <span className="font-mono">Solana Devnet</span>
          </div>
          <p>
            Private compute by{" "}
            <a
              href="https://arcium.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-arcium-purple-light hover:underline"
            >
              Arcium
            </a>{" "}
            · Identity by{" "}
            <a
              href="https://solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-arcium-cyan hover:underline"
            >
              Solana
            </a>
          </p>
          <span className="font-mono">No contacts stored · No servers</span>
        </div>
      </footer>
    </>
  );
}
