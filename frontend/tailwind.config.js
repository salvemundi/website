/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Theme colors (for IDE preview support)
        theme: {
          purple: {
            DEFAULT: "var(--theme-purple)",
            light: "var(--theme-purple-light)",
            lighter: "var(--theme-purple-lighter)",
            dark: "var(--theme-purple-dark)",
            darker: "var(--theme-purple-darker)",
          },
          white: {
            DEFAULT: "var(--theme-white)",
            soft: "var(--theme-white-soft)",
            muted: "var(--theme-white-muted)",
          },
          text: {
            DEFAULT: "var(--theme-text)",
            muted: "var(--theme-text-muted)",
            light: "var(--theme-text-light)",
          },
          gradient: {
            start: "var(--theme-gradient-start)",
            end: "var(--theme-gradient-end)",
            "light-start": "var(--theme-gradient-light-start)",
            "light-end": "var(--theme-gradient-light-end)",
            "dark-start": "var(--theme-gradient-dark-start)",
            "dark-end": "var(--theme-gradient-dark-end)",
          },
        },

        // Salvemundi brand colors
        oranje: "var(--color-primary-light)",
        paars: "var(--color-secondary-light)",
        geel: "var(--color-tertiary-light)",
        samu: "var(--color-neutral-light)",
        beige: "var(--color-base-light)",

        // Semantic colors
        ink: {
          DEFAULT: "var(--color-ink)",
          muted: "var(--color-ink-muted)",
          subtle: "var(--color-ink-subtle)",
          dim: "var(--color-ink-dim)",

          // DARK MODE - All White
          dark: {
            black: "#FFFFFF",
            white: "#FFFFFF",
            grey: "#FFFFFF",
            secondary: "#FFFFFF",
            primary: "#FFFFFF",
          },
        },

        surface: {
          DEFAULT: "var(--color-surface)",
          subtle: "var(--color-surface-subtle)",

          // DARK MODE
          dark: {
            DEFAULT: "var(--bg-card-dark)",
            subtle: "#0f172a",
          },
        },

        background: {
          DEFAULT: "var(--color-background)",
          dark: "#132a40",

          // DARK MODE extended
          darker: "#0b1926",
        },

        ui: {
          // border: "var(--color-ui-border)",
          // borderSoft: "var(--color-ui-borderSoft)",
          input: "var(--color-ui-input)",

          // DARK MODE
          dark: {
            // border: "#2d3a46",
            // borderSoft: "#1e2a34",
            input: "#1a252f",
          },
        },
      },

      textColor: {
        oranje: "var(--color-text-oranje)",

        // Semantic text utilities
        title: {
          DEFAULT: "#663265",  // Deep purple in light mode
          dark: "#FFFFFF",     // White in dark mode
        },
        p: {
          DEFAULT: "#663265",  // Deep purple in light mode
          dark: "#FFFFFF",     // White in dark mode
        },
        secondary: {
          DEFAULT: "#B99AD9",  // Light purple in light mode
          dark: "#B99AD9",     // Light purple in dark mode
        },
      },

      maxWidth: {
        app: "7xl",
      },

      backgroundImage: {
        'gradient-primary': 'var(--bg-gradient-primary)',
        'gradient-card': 'var(--bg-gradient-card)',
      },

      boxShadow: {
        card: 'var(--shadow-card)',
        cardDark: 'var(--shadow-card-dark)',
        glow: 'var(--shadow-glow)',
      },

      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};
