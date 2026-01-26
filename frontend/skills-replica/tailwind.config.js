/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        candy: ['"Fredoka"', 'sans-serif'],
        body: ['"Quicksand"', 'sans-serif'],
      },
      colors: {
        // Candy Shop Theme
        background: '#fff1f2', // rosy-50
        surface: '#ffffff',
        primary: '#ec4899',   // pink-500
        secondary: '#8b5cf6', // purple-500
        accent: '#facc15',    // yellow-400
        chocolate: '#78350f', // brown-900

        text: {
          main: '#881337', // pink-900
          muted: '#be185d', // pink-700
        }
      },
      boxShadow: {
        'candy': '0 10px 15px -3px rgba(236, 72, 153, 0.2), 0 4px 6px -2px rgba(236, 72, 153, 0.1)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  plugins: [],
}
