/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                mono: ['JetBrains Mono', 'monospace'],
            },
            gridTemplateColumns: {
                '22': 'repeat(22, minmax(0, 1fr))',
            }
        },
    },
    plugins: [],
}
