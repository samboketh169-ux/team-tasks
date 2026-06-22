/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#11100f",
        bgElevated: "#1a1816",
        bgCard: "#211e1a",
        ink: "#f2ede2",
        inkDim: "#a8a194",
        inkFaint: "#6b655a",
        ember: "#ff6a3d",
        emberDim: "#c44e2c",
        moss: "#8fae6e",
        mossDim: "#5e7848",
        sky: "#5b9bd5",
        line: "#322e28",
        lineSoft: "#262320",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Inter", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
