import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        arcium: {
          bg: "#05060f",
          surface: "#0b0d1a",
          card: "#0f1120",
          border: "#1a1f3a",
          purple: "#7c3aed",
          "purple-light": "#a78bfa",
          "purple-dim": "#4c1d95",
          cyan: "#22d3ee",
          "cyan-dim": "#0e7490",
          text: "#e2e8f0",
          muted: "#64748b",
          success: "#10b981",
          warning: "#f59e0b",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        body: ["'DM Sans'", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "float-up": "floatUp 0.6s ease-out forwards",
        "scan-line": "scanLine 2s linear infinite",
      },
      keyframes: {
        glowPulse: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        floatUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(124,58,237,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.1) 1px, transparent 1px)",
        "glow-radial":
          "radial-gradient(ellipse at center, rgba(124,58,237,0.3) 0%, transparent 70%)",
        "hero-gradient":
          "linear-gradient(135deg, #05060f 0%, #0a0618 50%, #05060f 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
