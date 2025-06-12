module.exports = {  
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paars: 'oklch(0.5738 0.0879 325.21)',
        samu: 'oklch(0.3959 0.0809 320.76)',
        oranje: 'oklch(0.6981 0.1948 34.26)',
        geel: 'oklch(0.8667 0.1554 91.83)',
        beige: 'oklch(0.9389 0.0257 94.74)',
        
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
};