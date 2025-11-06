/**** Tailwind CSS v3 config for Angular/Ionic ****/
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}',
    './src/index.html'
  ],
  theme: {
    extend: {}
  },
  // Disable preflight to avoid conflicts with Ionic's CSS reset
  corePlugins: {
    preflight: false,
  },
};
