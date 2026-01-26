/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Fira Code"', 'monospace'],
        sans: ['"Inter"', 'sans-serif'],
        // Aliases for compatibility with Candy components if needed, or mapped back
        candy: ['"Inter"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      colors: {
        // Original Theme (SkillsMP / IDE Style)
        background: '#f8f9fc', 
        surface: '#ffffff',
        primary: '#4f46e5',   // Indigo-600
        secondary: '#9333ea', // Purple-600
        success: '#22c55e',
        accent: '#f59e0b',    // Amber

        // Mapped Candy colors to Original equivalent to support current components
        pink: {
          50: '#eff6ff', // blue-50
          100: '#dbeafe', // blue-100
          200: '#bfdbfe', // blue-200
          300: '#93c5fd', // blue-300
          400: '#60a5fa', // blue-400
          500: '#4f46e5', // indigo-600 (Primary)
        },
        purple: {
          50: '#f5f3ff',
          100: '#ede9fe',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },

        // Syntax highlighting
        syntax: {
          keyword: '#ff79c6',
          string: '#f1fa8c',
          comment: '#6272a4',
          variable: '#bd93f9',
          function: '#50fa7b',
        },

        text: {
          main: '#1f2937', // gray-800
          muted: '#6b7280', // gray-500
        }
      },
      boxShadow: {
        'window': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        'candy': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // Map back to normal shadow
      }
    },
  },
  plugins: [],
}
