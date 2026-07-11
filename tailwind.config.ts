import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        // Slate/zinc developer-editorial palette with one emerald accent.
        ink: '#18181b',        // zinc-900 — headlines, strong borders
        paper: '#fafafa',      // zinc-50 — page background
        accent: '#059669',     // emerald-600 — the single accent
        'accent-deep': '#047857', // emerald-700 — links / hover (AA on paper)
        muted: '#52525b',      // zinc-600 — metadata (AA on paper)
        rule: '#e4e4e7',       // zinc-200 — hairline borders
        // Intermediate zinc shade used by the VaporLoop demo (/vaporloop)
        'zinc-850': '#1f1f23',
      },
    },
  },
  plugins: [],
};

export default config;
