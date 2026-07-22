/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        bg: '#05070d',
        panel: '#0a101c',
        cyan: '#00f0ff',
        magenta: '#ff2e88',
        lime: '#49ff9b',
        amber: '#ffc857',
        dim: '#5b7186',
        ink: '#d7e6ef',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
