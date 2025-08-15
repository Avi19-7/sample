/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e5ecff',
          200: '#cdd7ff',
          300: '#a3b9ff',
          400: '#7389ff',
          500: '#667eea',
          600: '#4f63d2',
          700: '#3f4baa',
          800: '#2d3573',
          900: '#1a1f3a'
        },
        secondary: {
          50: '#f8f5ff',
          100: '#f1ebff',
          200: '#e4d5ff',
          300: '#cfb3ff',
          400: '#b48bff',
          500: '#764ba2',
          600: '#5a3a7a',
          700: '#462d5c',
          800: '#321f3e',
          900: '#1e1220'
        },
        accent: {
          50: '#f0fcff',
          100: '#e0f8ff',
          200: '#b8efff',
          300: '#7ee2ff',
          400: '#4facfe',
          500: '#2e8bcd',
          600: '#1d6aa0',
          700: '#154c73',
          800: '#0f3047',
          900: '#081a1c'
        },
        success: {
          50: '#f0fffe',
          100: '#ccfffe',
          200: '#99fffe',
          300: '#66fffe',
          400: '#33fffe',
          500: '#00f2fe',
          600: '#00b8c4',
          700: '#00828a',
          800: '#004c50',
          900: '#002626'
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'gradient-accent': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'gradient-success': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'gradient-warning': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        'gradient-background': 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        'gradient-chat': 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        'gradient-message-user': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-message-assistant': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'slide-down': 'slideDown 0.6s ease-out forwards',
        'slide-in': 'slideIn 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.6s ease-out forwards',
        'message-in': 'messageIn 0.8s cubic-bezier(0.23, 1, 0.320, 1) forwards',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'background-shift': 'backgroundShift 20s ease-in-out infinite',
        'typing-dot': 'typingDot 1.4s infinite ease-in-out',
        'float-particle': 'floatParticle 15s linear infinite',
        'ripple': 'ripple 0.6s linear'
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(30px)' },
          'to': { opacity: '1', transform: 'translateY(0)' }
        },
        slideDown: {
          'from': { opacity: '0', transform: 'translateY(-30px)' },
          'to': { opacity: '1', transform: 'translateY(0)' }
        },
        slideIn: {
          'from': { opacity: '0', transform: 'translateX(-30px)' },
          'to': { opacity: '1', transform: 'translateX(0)' }
        },
        scaleIn: {
          'from': { opacity: '0', transform: 'scale(0.8)' },
          'to': { opacity: '1', transform: 'scale(1)' }
        },
        messageIn: {
          'from': { opacity: '0', transform: 'translateY(30px) scale(0.95)', filter: 'blur(5px)' },
          'to': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0px)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' }
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(102, 126, 234, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(102, 126, 234, 0.6), 0 0 40px rgba(102, 126, 234, 0.4)' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' }
        },
        backgroundShift: {
          '0%, 100%': {
            background: 'radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(245, 87, 108, 0.15) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(79, 172, 254, 0.15) 0%, transparent 50%)'
          },
          '50%': {
            background: 'radial-gradient(circle at 80% 30%, rgba(102, 126, 234, 0.2) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(245, 87, 108, 0.2) 0%, transparent 50%), radial-gradient(circle at 60% 20%, rgba(79, 172, 254, 0.2) 0%, transparent 50%)'
          }
        },
        typingDot: {
          '0%, 80%, 100%': { transform: 'scale(0.8)', opacity: '0.5' },
          '40%': { transform: 'scale(1.2)', opacity: '1' }
        },
        floatParticle: {
          '0%': { transform: 'translateY(100vh) translateX(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(-10vh) translateX(100px)', opacity: '0' }
        },
        ripple: {
          'to': { transform: 'scale(4)', opacity: '0' }
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'soft': '0 8px 32px rgba(31, 38, 135, 0.37)',
        'strong': '0 15px 35px rgba(31, 38, 135, 0.5)',
        'glow': '0 0 20px rgba(102, 126, 234, 0.3)',
        'glow-strong': '0 0 30px rgba(102, 126, 234, 0.6), 0 0 40px rgba(102, 126, 234, 0.4)'
      },
      borderRadius: {
        'enhanced': '20px',
        'enhanced-sm': '12px',
        'enhanced-lg': '24px'
      },
      transitionTimingFunction: {
        'enhanced': 'cubic-bezier(0.23, 1, 0.320, 1)',
        'bounce-enhanced': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms'
      }
    },
  },
  plugins: [],
}