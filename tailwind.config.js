/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
        'fade-in-scale': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'falling-background': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '0% 100%' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        }
      },
      animation: {
        pulse: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in-scale': 'fade-in-scale 1s ease-out forwards',
        'animate-falling-background': 'falling-background 5s linear infinite',
        blob: 'blob 7s infinite cubic-bezier(0.6, 0.2, 0.2, 0.8) both',
      },
      colors: {
        // Custom colors for dark mode
        dark: {
          primary: "#1a1a1a",
          secondary: "#2d2d2d",
          accent: "#194A8D",
          text: {
            primary: "#ffffff",
            secondary: "#9ca3af",
          },
        },
        // Custom color for general text based on user's image
        'main-text': "#00334C",
        // Custom color for hover state
        'hover-gold': "#D29341",
        // Custom color for active background
        'active-bg-dark': "#367C94",
      },
    },
  },
  plugins: [],
};
