/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", 
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'Poppins': ["poppins"]
      },
      colors: {
          'deverie-blue':"#4F81EF",
          'bleu-scarabee': '#38bdf8',
        }
    },
  },
  plugins: [],
}

