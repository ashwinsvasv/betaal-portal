/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        page: '#f4f6f9',
        panel: '#ffffff',
        ink: '#16213e',
        muted: '#5b6478',
        line: '#dde2ea',
        accent: {
          DEFAULT: '#2f45c5',
          soft: '#eaedfb',
        },
        warn: {
          DEFAULT: '#9a5506',
          soft: '#fff3dc',
        },
        danger: {
          DEFAULT: '#b42318',
          soft: '#fdecea',
        },
        success: {
          DEFAULT: '#17734a',
          soft: '#e6f4ec',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
