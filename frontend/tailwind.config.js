/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1220",
        mist: "#94a3b8",
        primary: "#14b8a6",
        accent: "#38bdf8",
      },
      boxShadow: {
        glow: "0 0 30px rgba(56, 189, 248, 0.25)",
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at 20% 20%, rgba(20,184,166,0.2) 0%, transparent 40%), radial-gradient(circle at 80% 0%, rgba(56,189,248,0.18) 0%, transparent 35%), linear-gradient(135deg, #020617 0%, #0b1220 45%, #0f172a 100%)",
      },
    },
  },
  plugins: [],
};
