/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cg: {
          blue: "#154273",
          lightblue: "#2E6BB4",
          orange: "#E17000",
          green: "#3A8C3F",
          red: "#C0392B",
          gray: "#F5F7FA",
        },
      },
    },
  },
  plugins: [],
};
