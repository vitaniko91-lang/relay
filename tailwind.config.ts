import type { Config } from 'tailwindcss'

/**
 * Relay — AI-agent observability. A deliberate dark ops-tool identity:
 * layered near-black surfaces separated by contrast + hairline borders (not
 * shadows), one held cyan brand accent, and a functional status palette
 * (never color alone — always paired with an icon + label in the UI).
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Layered ground — depth from contrast, not elevation.
        bg: {
          base: '#0B0E14', // app ground
          sink: '#080A0F', // recessed (sidebar, wells)
          raised: '#12161F', // cards, panels
          overlay: '#171C27', // drawers, menus, hovered rows
          hover: '#1B2130', // interactive hover
        },
        // Text ramp — held contrast on secondary greys (dashboards fail here).
        ink: {
          DEFAULT: '#E6E9EF',
          soft: '#9AA3B2',
          faint: '#69717F',
          dim: '#454C5B',
        },
        // Brand accent — cyan. Primary actions, links, active trace only. Held.
        accent: {
          DEFAULT: '#22D3EE',
          soft: '#67E8F9',
          deep: '#0E7490',
          dim: '#164E5B',
        },
        // Functional status — each also carries an icon + label in the UI.
        ok: { DEFAULT: '#34D399', deep: '#065F46' },
        warn: { DEFAULT: '#FBBF24', deep: '#78530E' },
        err: { DEFAULT: '#F87171', deep: '#7F1D1D' },
        run: { DEFAULT: '#38BDF8', deep: '#075985' }, // in-progress / running
        // Hairline borders — the primary separator, over drop-shadows.
        line: {
          DEFAULT: 'rgba(255,255,255,0.07)',
          soft: 'rgba(255,255,255,0.045)',
          strong: 'rgba(255,255,255,0.12)',
        },
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Tight dashboard ramp.
        '2xs': ['0.6875rem', { lineHeight: '1rem' }], // 11px — micro-labels
        xs: ['0.75rem', { lineHeight: '1.05rem' }], // 12px
        sm: ['0.8125rem', { lineHeight: '1.2rem' }], // 13px — table body
        base: ['0.875rem', { lineHeight: '1.35rem' }], // 14px — UI default
      },
      maxWidth: {
        content: '1440px',
      },
      borderRadius: {
        card: '8px',
        control: '6px',
        chip: '5px',
      },
      boxShadow: {
        // The single elevation reserved for floating layers (drawers, menus).
        float: '0 12px 32px -8px rgba(0,0,0,0.55)',
        glow: '0 0 0 1px rgba(34,211,238,0.35), 0 0 24px -6px rgba(34,211,238,0.4)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s cubic-bezier(0.19,1,0.22,1) both',
        shimmer: 'shimmer 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
