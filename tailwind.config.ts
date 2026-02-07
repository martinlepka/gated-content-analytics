import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Neon Cyberpunk Colors
        neon: {
          cyan: '#00d4ff',
          magenta: '#ff0080',
          purple: '#9945ff',
          green: '#22c55e',
          orange: '#f97316',
        },
        // Priority tier colors (cyberpunk style)
        p0: {
          DEFAULT: '#ff0080',
          light: 'rgba(255, 0, 128, 0.15)',
          glow: 'rgba(255, 0, 128, 0.4)',
        },
        p1: {
          DEFAULT: '#f97316',
          light: 'rgba(249, 115, 22, 0.15)',
          glow: 'rgba(249, 115, 22, 0.4)',
        },
        p2: {
          DEFAULT: '#00d4ff',
          light: 'rgba(0, 212, 255, 0.15)',
          glow: 'rgba(0, 212, 255, 0.4)',
        },
        p3: {
          DEFAULT: '#6b7280',
          light: 'rgba(107, 114, 128, 0.15)',
          glow: 'rgba(107, 114, 128, 0.4)',
        },
        // Status colors (cyberpunk)
        status: {
          new: '#00d4ff',
          working: '#f97316',
          done: '#22c55e',
          rejected: '#6b7280',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'border-flow': 'border-flow 3s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'border-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}

export default config
