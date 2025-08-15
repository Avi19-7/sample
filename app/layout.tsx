import type { Metadata } from "next";
import { TRPCProvider } from './providers/trpc-provider';
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';

export const metadata: Metadata = {
  title: "AI Chat Assistant - Real-time AI Chat",
  description: "A modern AI chat assistant with real-time updates, live animations, and image generation powered by Gemini AI",
  keywords: "AI, chat, real-time, image generation, Next.js, Gemini, interactive, animations",
  authors: [{ name: "AI Chat Team" }],
  viewport: "width=device-width, initial-scale=1, user-scalable=no",
  themeColor: "#667eea",
  openGraph: {
    title: "AI Chat Assistant - Real-time AI Chat",
    description: "Experience intelligent AI conversations with stunning animations and real-time updates",
    type: "website",
    locale: "en_US",
    siteName: "AI Chat Assistant",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Chat Assistant - Real-time AI Chat",
    description: "Experience intelligent AI conversations with stunning animations and real-time updates",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🤖</text></svg>" />
        <link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🤖</text></svg>" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AI Chat Assistant" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#667eea" />
        <meta name="msapplication-TileColor" content="#667eea" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Fira+Code:wght@300;400;500&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (typeof window !== 'undefined') {
                  window.__INITIAL_HYDRATION__ = true;
                  
                  // Prevent zoom on mobile
                  document.addEventListener('gesturestart', function (e) {
                    e.preventDefault();
                  });
                  
                  // Add floating particles
                  function createFloatingParticles() {
                    const particles = document.createElement('div');
                    particles.className = 'floating-elements';
                    particles.innerHTML = Array.from({length: 20}, (_, i) => 
                      '<div class="floating-particle" style="left: ' + Math.random() * 100 + '%; animation-delay: ' + Math.random() * 15 + 's;"></div>'
                    ).join('');
                    document.body.appendChild(particles);
                  }
                  
                  // Add smooth scroll behavior
                  document.documentElement.style.scrollBehavior = 'smooth';
                  
                  // Initialize on load
                  window.addEventListener('load', () => {
                    createFloatingParticles();
                    
                    // Add entrance animation to body
                    document.body.style.opacity = '0';
                    document.body.style.transform = 'translateY(20px)';
                    document.body.style.transition = 'all 0.6s ease-out';
                    
                    setTimeout(() => {
                      document.body.style.opacity = '1';
                      document.body.style.transform = 'translateY(0)';
                    }, 100);
                  });
                  
                  // Add performance optimizations
                  window.addEventListener('beforeunload', () => {
                    document.body.style.opacity = '0.8';
                  });
                  
                  // Add focus management
                  document.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                      document.body.classList.add('keyboard-navigation');
                    }
                  });
                  
                  document.addEventListener('mousedown', () => {
                    document.body.classList.remove('keyboard-navigation');
                  });
                }
              } catch (e) {
                console.warn('Enhancement script failed:', e);
              }
            `,
          }}
        />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical CSS for immediate loading */
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
              margin: 0;
              padding: 0;
              overflow-x: hidden;
              color: white;
            }
            
            .keyboard-navigation *:focus {
              outline: 2px solid #667eea !important;
              outline-offset: 2px;
              border-radius: 4px;
            }
            
            /* Loading state */
            .loading-shimmer {
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
              background-size: 200% 100%;
              animation: shimmer 2s infinite;
            }
            
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            
            /* Accessibility improvements */
            @media (prefers-reduced-motion: reduce) {
              *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
              }
            }
            
            @media (prefers-color-scheme: dark) {
              body {
                color-scheme: dark;
              }
            }
            
            /* High contrast mode support */
            @media (prefers-contrast: high) {
              .enhanced-message {
                border-width: 3px;
              }
              
              .enhanced-btn {
                border-width: 2px;
              }
            }
            
            /* Focus indicators for better accessibility */
            .enhanced-btn:focus,
            .enhanced-input:focus,
            .control-btn:focus {
              box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.5) !important;
            }
          `
        }} />
      </head>
      <body suppressHydrationWarning>
        <div id="app-root">
          <TRPCProvider>
            {children}
          </TRPCProvider>
        </div>
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Progressive enhancement after hydration
              if (typeof window !== 'undefined') {
                // Add intersection observer for animations
                const observerCallback = (entries) => {
                  entries.forEach(entry => {
                    if (entry.isIntersecting) {
                      entry.target.classList.add('animate-fade-in');
                    }
                  });
                };
                
                const observer = new IntersectionObserver(observerCallback, {
                  threshold: 0.1,
                  rootMargin: '0px 0px -50px 0px'
                });
                
                // Observe elements when DOM is ready
                document.addEventListener('DOMContentLoaded', () => {
                  document.querySelectorAll('.feature-card, .enhanced-message, .suggestion-btn').forEach(el => {
                    observer.observe(el);
                  });
                });
                
                // Add haptic feedback for mobile
                function addHapticFeedback() {
                  if ('vibrate' in navigator) {
                    document.addEventListener('click', (e) => {
                      if (e.target.matches('.enhanced-btn, .control-btn, .send-btn')) {
                        navigator.vibrate(50);
                      }
                    });
                  }
                }
                
                // Add touch gesture support
                let touchStartY = 0;
                document.addEventListener('touchstart', (e) => {
                  touchStartY = e.touches[0].clientY;
                });
                
                document.addEventListener('touchmove', (e) => {
                  const touchY = e.touches[0].clientY;
                  const touchDiff = touchStartY - touchY;
                  
                  // Add subtle parallax effect to background
                  if (Math.abs(touchDiff) > 10) {
                    document.body.style.transform = 'translateY(' + (touchDiff * 0.1) + 'px)';
                  }
                });
                
                document.addEventListener('touchend', () => {
                  document.body.style.transform = 'translateY(0)';
                });
                
                // Initialize enhancements
                addHapticFeedback();
                
                // Add connection status indicator
                function updateConnectionStatus() {
                  const status = navigator.onLine ? 'online' : 'offline';
                  document.body.setAttribute('data-connection', status);
                }
                
                window.addEventListener('online', updateConnectionStatus);
                window.addEventListener('offline', updateConnectionStatus);
                updateConnectionStatus();
              }
            `,
          }}
        />
      </body>
    </html>
  );
}