import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        veda: {
          orange: "#FF6B2C",
          orangeSoft: "#FFE3D3",
          ink: "#1E1E1E",
          sub: "#6B6B6B",
          card: "#FFFFFF",
          bgTop: "#EEEEEE",
          bgBottom: "#DADADA",
          border: "#E4E4E4",
          green: "#1E9E5A",
          greenSoft: "#E8F8EF",
          red: "#E0472C",
          redSoft: "#FDEAE6",
          amber: "#E08A2C",
          amberSoft: "#FDF1E0"
        }
      },
      borderRadius: {
        xl2: "16px",
        xl3: "20px"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)"
      }
    }
  },
  plugins: []
};
export default config;
