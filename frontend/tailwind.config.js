/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      /* ── ClickUp Color Tokens (design.md) ─────────────── */
      colors: {
        primary: "#7612fa",
        "primary-deep": "#4a2fff",
        "primary-soft": "#b38cff",
        "brand-link": "#7b68ee",
        "brand-pink": "#fa24ce",
        "brand-pink-deep": "#ff02f0",
        "brand-orange": "#f76808",
        "brand-coral": "#fc6d7b",
        "brand-amber": "#fd9a46",
        "brand-sky": "#4fb9fa",
        "accent-blue": "#0091ff",
        "accent-purple": "#6647f0",
        "accent-magenta": "#a43cb4",
        "accent-green": "#078d3b",
        "accent-red": "#f0382d",
        canvas: "#ffffff",
        surface: "#f8f9fa",
        "surface-soft": "#e9ebf0",
        hairline: "#e8e8e8",
        "hairline-strong": "#d9d9d9",
        ink: "#292d34",
        "ink-deep": "#202020",
        "ink-darkest": "#090c1d",
        "ink-secondary": "#646464",
        "ink-tertiary": "#838383",
        "ink-disabled": "#b4b4b4",
        "shadow-indigo": "#122ba5",
        "shadow-navy": "#1b1754",

        // Compatibility mapping for existing CMU tags
        cmu: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#b38cff',
          500: '#7b68ee',
          600: '#7612fa',
          700: '#4a2fff',
          800: '#292d34',
          900: '#202020',
        },
      },

      /* ── Typography (design.md) ────────────────────────── */
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Kanit', 'sans-serif'],
        sans: ['Inter', 'Kanit', 'system-ui', 'sans-serif'],
        mono: ['Sometype Mono', 'JetBrains Mono', 'monospace'],
      },

      fontSize: {
        // Display ramp (Plus Jakarta Sans)
        'display-3xl': ['76px', { lineHeight: '1.05', letterSpacing: '-3.04px', fontWeight: '700' }],
        'display-2xl': ['60px', { lineHeight: '1.1', letterSpacing: '-2.1px', fontWeight: '650' }],
        'display-xl': ['48px', { lineHeight: '1.25', letterSpacing: '-1.68px', fontWeight: '650' }],
        'display-lg': ['40px', { lineHeight: '1.2', letterSpacing: '-1.6px', fontWeight: '650' }],
        'display-md': ['34px', { lineHeight: '1.2', letterSpacing: '-1.36px', fontWeight: '650' }],
        // Heading ramp
        'heading-md': ['26px', { lineHeight: '1.25', letterSpacing: '-0.91px', fontWeight: '650' }],
        'heading-sm': ['18px', { lineHeight: '1.33', letterSpacing: '-0.54px', fontWeight: '650' }],
        // Body ramp (Inter)
        'body-lg': ['18px', { lineHeight: '1.33', letterSpacing: '-0.36px', fontWeight: '500' }],
        'body-md': ['16px', { lineHeight: '1.375', letterSpacing: '-0.32px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.43', letterSpacing: '-0.15px', fontWeight: '400' }],
        // Button
        'button-md': ['14px', { lineHeight: '1.43', letterSpacing: '-0.15px', fontWeight: '600' }],
        // Eyebrow Mono
        'eyebrow': ['14px', { lineHeight: '1.29', letterSpacing: '0px', fontWeight: '500' }],
        // Caption
        'caption': ['12px', { lineHeight: '1.5', letterSpacing: '-0.12px', fontWeight: '400' }],
      },

      /* ── Rounded (design.md 8-step scale) ──────────────── */
      borderRadius: {
        xxs: '4px',
        sm: '9px',
        md: '12px',
        lg: '14px',
        pill: '20px',
        xl: '25px',
        xxl: '35px',
      },

      /* ── Spacing (design.md 10px base) ─────────────────── */
      spacing: {
        'clickup-xxs': '4px',
        'clickup-xs': '8px',
        'clickup-sm': '12px',
        'clickup-md': '20px',
        'clickup-lg': '24px',
        'clickup-xl': '40px',
        'clickup-xxl': '60px',
        'clickup-section': '100px',
        'clickup-hero': '150px',
      },

      /* ── Tinted Shadows (design.md indigo tint, NOT gray) ── */
      boxShadow: {
        'tinted-xs': '0 4px 12px rgba(18, 43, 165, 0.05)',
        'tinted-sm': '0 10px 25px rgba(18, 43, 165, 0.08)',
        'tinted-md': '0 20px 60px rgba(18, 43, 165, 0.12)',
        'tinted-lg': '0 16px 78px rgba(18, 43, 165, 0.16)',
        'tinted-xl': '0 34px 54px rgba(18, 43, 165, 0.22)',
      },

      /* ── Gradient (design.md brand voltage) ──────────────── */
      backgroundImage: {
        'brand-gradient': 'linear-gradient(263deg, #fa12e3 -35%, #7612fa 41%, #12d0fa 135%)',
        'brand-gradient-hover': 'linear-gradient(263deg, #fa12e3 -20%, #7612fa 50%, #12d0fa 145%)',
      },

      /* ── Letter Spacing (display ramp) ───────────────────── */
      letterSpacing: {
        'tight-3xl': '-3.04px',
        'tight-2xl': '-2.1px',
        'tight-xl': '-1.68px',
        'tight-lg': '-1.6px',
        'tight-md': '-1.36px',
        'tight-sm': '-0.91px',
        'tight-body-lg': '-0.36px',
        'tight-body-md': '-0.32px',
        'tight-body-sm': '-0.15px',
      },

      /* ── Container Max (design.md) ───────────────────────── */
      maxWidth: {
        'clickup': '1160px',
      },

      /* ── Transition Timing (design.md easing) ────────────── */
      transitionTimingFunction: {
        'clickup': 'cubic-bezier(0.5, 0, 0.5, 1)',
      },
      transitionDuration: {
        'clickup': '250ms',
      },
    },
  },
  plugins: [],
}
