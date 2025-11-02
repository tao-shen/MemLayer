/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'memory-stm': '#3B82F6',
        'memory-episodic': '#10B981',
        'memory-semantic': '#F59E0B',
        'memory-reflection': '#8B5CF6',
      },
    },
  },
  plugins: [],
}
