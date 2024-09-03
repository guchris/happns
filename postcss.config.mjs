/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    'postcss-import': {}, // Allows use of @import in CSS
    'tailwindcss/nesting': {}, // Allows nesting in Tailwind CSS
    tailwindcss: {},
    autoprefixer: {}, // Adds vendor prefixes to CSS
  },
};

export default config;