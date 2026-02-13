/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Fira Code"', 'monospace'],
        sans: ['"Inter"', 'sans-serif'],
      },
      colors: {
        // 背景色
        background: 'var(--color-background)',
        backgroundSecondary: 'var(--color-background-secondary)',
        backgroundTertiary: 'var(--color-background-tertiary)',

        // 卡片
        card: 'var(--color-card)',
        'card-foreground': 'var(--color-card-foreground)',

        // 文本色 - 高对比度
        foreground: 'var(--color-foreground)',
        'foreground-secondary': 'var(--color-foreground-secondary)',
        'foreground-tertiary': 'var(--color-foreground-tertiary)',
        'foreground-muted': 'var(--color-foreground-muted)',

        // 主色调 - 靛蓝
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        'primary-active': 'var(--color-primary-active)',
        'primary-foreground': 'var(--color-primary-foreground)',

        // 次要色
        secondary: 'var(--color-secondary)',
        'secondary-foreground': 'var(--color-secondary-foreground)',

        // 强调色
        accent: 'var(--color-accent)',
        'accent-foreground': 'var(--color-accent-foreground)',

        // 语义色
        success: 'var(--color-success)',
        'success-foreground': 'var(--color-success-foreground)',
        warning: 'var(--color-warning)',
        'warning-foreground': 'var(--color-warning-foreground)',
        error: 'var(--color-error)',
        'error-foreground': 'var(--color-error-foreground)',
        info: 'var(--color-info)',
        'info-foreground': 'var(--color-info-foreground)',

        // 边框和分隔
        border: 'var(--color-border)',
        'border-hover': 'var(--color-border-hover)',

        // 输入框
        input: 'var(--color-input)',
        'input-border': 'var(--color-input-border)',
        ring: 'var(--color-ring)',

        // 语法高亮
        syntax: {
          keyword: 'var(--color-syntax-keyword)',
          string: 'var(--color-syntax-string)',
          comment: 'var(--color-syntax-comment)',
          variable: 'var(--color-syntax-variable)',
          function: 'var(--color-syntax-function)',
        },
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.25rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        window: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-in',
        'zoom-in': 'zoom-in 0.2s ease-out',
        'zoom-out': 'zoom-out 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        zoomIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        zoomOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
