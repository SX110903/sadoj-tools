export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sadoj: {
          950: "#0a0f1a",
          900: "#111827",
          800: "#1c2537",
          700: "#263044",
          600: "#374151",
          400: "#6b7a99",
          200: "#9ca3af",
          100: "#e2e8f0"
        },
        accent: {
          DEFAULT: "#8b9db5",
          light: "#b0bec5",
          dark: "#5c6e82"
        }
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)",
        elevated: "0 4px 12px rgba(0,0,0,0.4)",
        "glow-accent": "0 0 0 1px rgba(139,157,181,0.15)"
      },
      backgroundImage: {
        "sadoj-radial": "radial-gradient(ellipse at top, #131c2e 0%, #0a0f1a 60%)"
      }
    }
  },
  plugins: []
};
