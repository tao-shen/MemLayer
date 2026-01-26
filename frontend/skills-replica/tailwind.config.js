/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Fira Code"', 'monospace'], // Default for this site
        sans: ['"Inter"', 'sans-serif'],
      },
      colors: {
        // Theme colors inspired by skillsmp.com (Dracula / Terminal aesthetics)
        background: '#f8f9fc', // Light gray background
        surface: '#ffffff',
        primary: '#4f46e5',   // Indigo-600
        secondary: '#9333ea', // Purple-600
        success: '#22c55e',
        
        // Syntax highlighting colors
        syntax: {
          keyword: '#ff79c6', // Pink
          string: '#f1fa8c',  // Yellow
          comment: '#6272a4', // Blue-gray
          variable: '#bd93f9', // Purple
          function: '#50fa7b', // Green
        },
        
        // UI
        border: '#e5e7eb',
        text: {
          main: '#1f2937',
          muted: '#6b7280',
        }
      },
      boxShadow: {
        'window': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
