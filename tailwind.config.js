/** @type {import("tailwindcss/defaultConfig")} */
module.exports = {
  mode: "jit",
  purge: ["./app/**/*.tsx"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
};
