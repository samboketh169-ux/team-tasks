/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0e16",
        bgElevated: "#10151f",
        bgCard: "#141a26",
        ink: "#eef1f7",
        inkDim: "#a7b0c2",
        inkFaint: "#6c7689",
        ember: "#fb7158",
        emberDim: "#c2410c",
        moss: "#22c98a",
        mossDim: "#0e9f6e",
        sky: "#3fb6f5",
        line: "#202736",
        lineSoft: "#191f2c",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Inter", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -8px rgba(0,0,0,0.5)",
        glow: "0 0 0 1px rgba(34,201,138,0.25), 0 4px 16px -4px rgba(34,201,138,0.35)",
      },
    },
  },
  plugins: [],
};
