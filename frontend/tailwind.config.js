/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary warm neutrals
        cream: {
          50: '#FFFEF8',
          100: '#FFF9E8',
          200: '#FFF3D1',
          300: '#FFEAB3',
          400: '#FFE194',
          500: '#F5D67A',
          600: '#E5C050',
          700: '#C9A033',
          800: '#A37F1F',
          900: '#7D5F15',
        },
        // Terracotta/Clay tones - primary accent
        terracotta: {
          50: '#FDF5F0',
          100: '#FBEADE',
          200: '#F7D5BD',
          300: '#F0BA93',
          400: '#E8996A',
          500: '#D97B4A',
          600: '#C65F2E',
          700: '#A84A22',
          800: '#873B1C',
          900: '#6B2F17',
        },
        // Sage green - secondary accent
        sage: {
          50: '#F5F8F5',
          100: '#E8F0E8',
          200: '#D1E1D1',
          300: '#B0CAB0',
          400: '#8BB08B',
          500: '#6B946B',
          600: '#557855',
          700: '#456045',
          800: '#394D39',
          900: '#2F3F2F',
        },
        // Warm wood tones for accents and borders
        wood: {
          50: '#FAF7F4',
          100: '#F3EDE6',
          200: '#E7DBCC',
          300: '#D6C2A8',
          400: '#C4A680',
          500: '#B08D5C',
          600: '#96744A',
          700: '#7A5D3D',
          800: '#634B33',
          900: '#503D2B',
        },
        // Warm grays for text and backgrounds
        warmgray: {
          50: '#FAFAF8',
          100: '#F5F4F1',
          200: '#EBEBDF',
          300: '#DDDACD',
          400: '#C4BFB0',
          500: '#A39E8E',
          600: '#857F6F',
          700: '#6B665A',
          800: '#55524A',
          900: '#45423C',
        },
      },
      fontFamily: {
        // Serif for headings - recipe book feel
        serif: ['Playfair Display', 'Georgia', 'serif'],
        // Sans-serif for body - clean and readable
        sans: ['Lato', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        // Handwritten feel for special elements
        handwritten: ['Dancing Script', 'cursive'],
      },
      boxShadow: {
        'recipe-card': '0 2px 8px rgba(139, 90, 43, 0.12), 0 4px 16px rgba(139, 90, 43, 0.08)',
        'recipe-card-hover': '0 4px 16px rgba(139, 90, 43, 0.18), 0 8px 24px rgba(139, 90, 43, 0.12)',
        'warm': '0 4px 14px 0 rgba(139, 90, 43, 0.15)',
        'warm-lg': '0 10px 40px rgba(139, 90, 43, 0.15)',
      },
      backgroundImage: {
        'linen': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23d6c2a8' fill-opacity='0.15' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E\")",
        'paper': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23e7dbcc' fill-opacity='0.2'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0H5v5H0v1h5v94h1V6h94V5H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      borderRadius: {
        'recipe': '0.625rem', // 10px - slightly softer than default
      },
    },
  },
  plugins: [],
}

