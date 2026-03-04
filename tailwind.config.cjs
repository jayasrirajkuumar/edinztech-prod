/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#FF8A00",
                secondary: "#1B4C90",
                accent: "#0E2A47",
                border: "#E5E5E5",
                text: {
                    DEFAULT: "#333333",
                    light: "#555555"
                },
                success: "#28A745",
                danger: "#DC3545",
                warning: "#FBBF24",
            },
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
