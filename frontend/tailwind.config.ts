import type { Config } from 'tailwindcss';

/**
 * Tokens are declared as CSS custom properties in src/index.css and referenced
 * here as `rgb(var(--token) / <alpha-value>)`. That indirection is what lets a
 * single `.dark` class on <html> re-theme the whole app without duplicating
 * every utility, while still supporting Tailwind opacity modifiers
 * (e.g. `bg-primary-600/20`).
 *
 * Values come from PROJECT_MASTER.md section 7.
 */
const withOpacity = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: withOpacity('--color-primary-50'),
          100: withOpacity('--color-primary-100'),
          500: withOpacity('--color-primary-500'),
          600: withOpacity('--color-primary-600'),
          700: withOpacity('--color-primary-700'),
          800: withOpacity('--color-primary-800'),
        },
        // Semantic roles. These do not change between themes.
        success: withOpacity('--color-success'),
        warning: withOpacity('--color-warning'),
        danger: withOpacity('--color-danger'),
        accent: withOpacity('--color-accent'),

        surface: {
          canvas: withOpacity('--surface-canvas'),
          card: withOpacity('--surface-card'),
          subtle: withOpacity('--surface-subtle'),
        },
        border: {
          subtle: withOpacity('--border-subtle'),
          strong: withOpacity('--border-strong'),
        },
        content: {
          primary: withOpacity('--text-primary'),
          secondary: withOpacity('--text-secondary'),
          tertiary: withOpacity('--text-tertiary'),
        },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'display-2xl': [
          '4.5rem',
          { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.03em' },
        ],
        'display-xl': [
          '3.75rem',
          { lineHeight: '1.15', fontWeight: '800', letterSpacing: '-0.025em' },
        ],
        'display-lg': [
          '3rem',
          { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' },
        ],
        'display-md': [
          '2.25rem',
          { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' },
        ],
        'heading-xl': [
          '1.5rem',
          { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.01em' },
        ],
        'heading-lg': [
          '1.25rem',
          { lineHeight: '1.35', fontWeight: '600', letterSpacing: '-0.01em' },
        ],
        'heading-md': [
          '1.125rem',
          { lineHeight: '1.4', fontWeight: '600', letterSpacing: '-0.005em' },
        ],
        'body-lg': ['1rem', { lineHeight: '1.5' }],
        'body-md': ['0.875rem', { lineHeight: '1.5' }],
        'body-sm': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        'label-lg': [
          '0.875rem',
          { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.01em' },
        ],
        'label-md': [
          '0.75rem',
          { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.02em' },
        ],
        caption: [
          '0.6875rem',
          { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.02em' },
        ],
        'mono-code': ['0.8125rem', { lineHeight: '1.5', fontWeight: '500' }],
      },
      spacing: {
        '3xs': '2px',
        '2xs': '4px',
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '40px',
        '3xl': '48px',
        '4xl': '64px',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(15, 23, 42, 0.04)',
        sm: '0 2px 4px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        md: '0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)',
        lg: '0 12px 24px -4px rgba(15, 23, 42, 0.12), 0 4px 8px -2px rgba(15, 23, 42, 0.04)',
        xl: '0 24px 48px -12px rgba(15, 23, 42, 0.18)',
        glow: '0 0 24px rgba(15, 82, 255, 0.25)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        // Rejected-password feedback on the link gate. The global
        // prefers-reduced-motion rule in index.css collapses it to nothing.
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        shake: 'shake 0.35s ease-in-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
