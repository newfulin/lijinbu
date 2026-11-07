/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0D9488",
          soft: "#CCFBF1",
          dark: "#0F766E",
        },
        page: "#F7F8FA",
        card: "#FFFFFF",
        ink: {
          DEFAULT: "#1F2937",
          muted: "#6B7280",
          faint: "#9CA3AF",
        },
        income: {
          DEFAULT: "#059669",
          soft: "#D1FAE5",
        },
        expense: {
          DEFAULT: "#DC2626",
          soft: "#FEE2E2",
        },
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
      },
      spacing: {
        drawer: "460px",
      },
      minWidth: {
        app: "1100px",
      },
      minHeight: {
        app: "720px",
      },
    },
  },
  plugins: [],
};
