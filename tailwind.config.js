/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb", // Brand Blue
        secondary: "#10b981", // Emerald Green
        background: "#f9fafb", // Soft Gray
        neutral: "#1f2937", // Dark Charcoal
        error: "#dc2626", // Red
        accent: "#f59e0b", // Gold (for yields/profits)
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        display: ["Poppins", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        custom: "0 8px 24px rgba(124, 58, 237, 0.2)",
      },
      borderRadius: {
        xl: "1rem",
      },
    },
  },
  plugins: [],
};
