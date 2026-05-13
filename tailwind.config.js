/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primary: "#FCFCFD",
        primaryHover: "#484858",
        secondary: "#DD7224",
        secondaryHover: "#FF8B37",
        textPrimary: "#FCFCFD",
        textSecondary: "#D4D4D4",
        "neutral-850": "#242424",
        "neutral-750": "#212121",
        "warning-500": "#FEAA01",
      },
      backgroundImage: {
        "gradient-red": "linear-gradient(77.14deg, #EE4D2D 14.94%, #AC0001 93.95%)",
      },
      borderRadius: {
        DEFAULT: "6px",
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
        full: "9999px",
      },
      fontFamily: {
        sans: ["Manrope", "sans-serif"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "28px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["30px", { lineHeight: "36px" }],
        "4xl": ["36px", { lineHeight: "40px" }],
      },
      keyframes: {
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-right 0.3s ease-out",
      },
    },
  },
  plugins: [],
};

module.exports = config;
