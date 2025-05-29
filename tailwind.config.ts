import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        nunito: ['var(--font-nunito)'],
        montserrat: ['var(--font-montserrat)'],
      },
      fontSize: {
        'heading-1': ['clamp(32px, 5vw, 48px)', { lineHeight: '1.2' }],
        'heading-2': ['clamp(24px, 3vw, 28px)', { lineHeight: '1.3' }],
        'heading-3': ['clamp(20px, 2vw, 24px)', { lineHeight: '1.4' }],
        'body': ['16px', { lineHeight: '1.5' }],
        'body-sm': ['14px', { lineHeight: '1.5' }],
      },
      fontWeight: {
        light: '300',
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
  },
  plugins: [],
};

export default config; 