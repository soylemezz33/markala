/**
 * Markala Tailwind preset — v2 (B yolu: tech-forward butik matbaa).
 *
 * Light palette (paper/ink/brand) ürün/sepet sayfaları için korunuyor.
 * Dark palette (surface/ink-on-dark) marketing sayfaları için yeni eklendi.
 * Sarı korunuyor + cyan neon vurgu + glow utility'leri.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // === Marka ===
        brand: {
          50: "#FFF9E6",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#F8C32C",
          500: "#F5B800", // ana sarı
          600: "#D99A00",
          700: "#B57F00",
          800: "#8C6200",
          900: "#5C4100",
        },

        // === Neon vurgu (yeni) ===
        neon: {
          cyan: "#00D9FF",
          "cyan-soft": "#5BE5FF",
          "cyan-glow": "rgba(0, 217, 255, 0.5)",
          gold: "#FFD60A",
          "gold-glow": "rgba(245, 184, 0, 0.5)",
        },

        // === LIGHT palette — ürün/sepet/checkout ===
        ink: {
          50: "#F4F1EC",
          100: "#E1DAD0",
          200: "#BEB4A7",
          300: "#9C8E7E",
          400: "#837566",
          500: "#6B5D4F",
          600: "#54483D",
          700: "#3D342B",
          900: "#1A1410",
        },
        paper: {
          50: "#FBFAF5",
          100: "#F5F2E8",
          200: "#E8E3D2",
          300: "#D4CDB8",
        },

        // === DARK palette — marketing surfaces (yeni) ===
        surface: {
          0: "#070810",  // html / en derin (anasayfa hero arka)
          1: "#0E1018",  // section bg
          2: "#161A26",  // kart base
          3: "#1F2432",  // hover/raised
          4: "#2A3041",  // border highlight
        },
        // Karanlık üzerinde okunabilirlik için
        "on-dark": {
          50: "#FAFAF7",   // ana metin
          200: "#C9CDD4",  // ikincil
          400: "#7B828F",  // muted
          600: "#4A5160",  // disabled
        },

        success: "#2E7D32",
        warning: "#ED6C02",
        error: "#C62828",
      },

      fontFamily: {
        // Tek font ailesi: Geist Sans. font-serif token'ı geriye dönük uyumluluk için
        // aynı Geist'e map edilir — eski font-serif class'ları çalışmaya devam eder.
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },

      fontSize: {
        "display-xl": ["clamp(3rem, 6vw, 5rem)", { lineHeight: "1.02", letterSpacing: "-0.025em" }],
        "display-lg": ["clamp(2.25rem, 4.5vw, 3.25rem)", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
        "display-md": ["clamp(1.75rem, 3vw, 2.25rem)", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
      },

      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },

      borderRadius: {
        sm: "0.375rem",
        DEFAULT: "0.5rem",
        md: "0.625rem",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.75rem",
      },

      boxShadow: {
        sm: "0 1px 2px rgba(26, 20, 16, 0.04), 0 1px 3px rgba(26, 20, 16, 0.06)",
        lg: "0 12px 32px rgba(26, 20, 16, 0.08), 0 4px 8px rgba(26, 20, 16, 0.04)",
        // Dark theme gölgeleri — neon glow
        "glow-cyan": "0 0 24px rgba(0, 217, 255, 0.35), 0 0 48px rgba(0, 217, 255, 0.15)",
        "glow-gold": "0 0 24px rgba(245, 184, 0, 0.4), 0 0 48px rgba(245, 184, 0, 0.18)",
        "glow-cyan-sm": "0 0 12px rgba(0, 217, 255, 0.3)",
        "glow-gold-sm": "0 0 12px rgba(245, 184, 0, 0.35)",
        "card-dark": "0 8px 24px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.25)",
        none: "none",
      },

      maxWidth: {
        content: "1280px",
      },

      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },

      backgroundImage: {
        // Subtle radial glows — hero arka planı
        "radial-cyan": "radial-gradient(ellipse 50% 50% at 50% 0%, rgba(0, 217, 255, 0.12), transparent 70%)",
        "radial-gold": "radial-gradient(ellipse 60% 60% at 50% 100%, rgba(245, 184, 0, 0.10), transparent 70%)",
      },

      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "blur-in": {
          "0%": { opacity: "0", filter: "blur(8px)" },
          "100%": { opacity: "1", filter: "blur(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 400ms cubic-bezier(0.16, 1, 0.3, 1)",
        "blur-in": "blur-in 600ms cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
