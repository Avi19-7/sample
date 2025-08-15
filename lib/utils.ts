export const animationUtils = {
  easeInOut: (t: number): number => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  },

  easeOut: (t: number): number => {
    return 1 - Math.pow(1 - t, 3);
  },

  easeIn: (t: number): number => {
    return t * t * t;
  },

  spring: (from: number, to: number, progress: number): number => {
    const tension = 0.8;
    const friction = 0.2;
    const displacement = to - from;
    const velocity = displacement * tension;
    const damping = velocity * friction;
    return from + displacement * progress - damping * (1 - progress);
  },

  scrollTo: (element: HTMLElement, duration: number = 800): void => {
    const targetPosition = element.offsetTop;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime: number | null = null;

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      
      window.scrollTo(0, startPosition + distance * animationUtils.easeInOut(progress));
      
      if (progress < 1) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  },

  staggerDelay: (index: number, baseDelay: number = 100): string => {
    return `${index * baseDelay}ms`;
  },

  randomDelay: (min: number = 0, max: number = 1000): string => {
    return `${Math.random() * (max - min) + min}ms`;
  }
};

export const performanceUtils = {
  throttle: <T extends (...args: any[]) => void>(func: T, limit: number): T => {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  },

  debounce: <T extends (...args: any[]) => void>(func: T, delay: number): T => {
    let timeoutId: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    }) as T;
  },

  requestAnimFrame: (() => {
    return window.requestAnimationFrame ||
           (window as any).webkitRequestAnimationFrame ||
           ((callback: FrameRequestCallback) => {
             window.setTimeout(callback, 1000 / 60);
           });
  })(),

  isTouchDevice: (): boolean => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  prefersReducedMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
};

export const colorUtils = {
  hexToRgba: (hex: string, alpha: number = 1): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  gradient: (colors: string[], direction: string = '135deg'): string => {
    return `linear-gradient(${direction}, ${colors.join(', ')})`;
  },

  lighten: (color: string, amount: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * amount);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  },

  darken: (color: string, amount: number): string => {
    return colorUtils.lighten(color, -amount);
  }
};

export const domUtils = {
  addClassWithAnimation: (element: HTMLElement, className: string, duration: number = 300): Promise<void> => {
    return new Promise((resolve) => {
      element.classList.add(className);
      setTimeout(() => {
        resolve();
      }, duration);
    });
  },

  removeClassWithAnimation: (element: HTMLElement, className: string, duration: number = 300): Promise<void> => {
    return new Promise((resolve) => {
      element.classList.remove(className);
      setTimeout(() => {
        resolve();
      }, duration);
    });
  },

  getElementPosition: (element: HTMLElement): { x: number; y: number } => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY
    };
  },

  isInViewport: (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  createRipple: (event: MouseEvent, element: HTMLElement): void => {
    const circle = document.createElement('span');
    const diameter = Math.max(element.clientWidth, element.clientHeight);
    const radius = diameter / 2;

    const rect = element.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add('ripple-effect');

    const ripple = element.getElementsByClassName('ripple-effect')[0];
    if (ripple) {
      ripple.remove();
    }

    element.appendChild(circle);

    setTimeout(() => {
      circle.remove();
    }, 600);
  }
};

export const soundUtils = {
  createAudioContext: (): AudioContext | null => {
    try {
      return new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      return null;
    }
  },

  playNotification: (frequency: number = 800, duration: number = 200): void => {
    const audioContext = soundUtils.createAudioContext();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  },

  playClick: (): void => {
    soundUtils.playNotification(1000, 100);
  },

  playSuccess: (): void => {
    soundUtils.playNotification(800, 150);
    setTimeout(() => soundUtils.playNotification(1200, 150), 100);
  },

  playError: (): void => {
    soundUtils.playNotification(300, 200);
  }
};

export const hapticUtils = {
  vibrate: (pattern: number | number[]): void => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  },

  light: (): void => {
    hapticUtils.vibrate(50);
  },

  medium: (): void => {
    hapticUtils.vibrate([100, 50, 100]);
  },

  strong: (): void => {
    hapticUtils.vibrate([200, 100, 200]);
  },

  success: (): void => {
    hapticUtils.vibrate([50, 25, 50, 25, 100]);
  },

  error: (): void => {
    hapticUtils.vibrate([100, 50, 100, 50, 200]);
  }
};

export const validationUtils = {
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isValidLength: (text: string, min: number = 0, max: number = Infinity): boolean => {
    return text.length >= min && text.length <= max;
  },

  sanitizeText: (text: string): string => {
    return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/[<>]/g, '');
  }
};

export const formatUtils = {
  formatTimestamp: (timestamp: string | Date): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Invalid time';
    }
  },

  formatRelativeTime: (timestamp: string | Date): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Invalid time';
    }
  },

  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  truncateText: (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
};

export const deviceUtils = {
  isMobile: (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  isTablet: (): boolean => {
    return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
  },

  isDesktop: (): boolean => {
    return !deviceUtils.isMobile() && !deviceUtils.isTablet();
  },

  getDeviceType: (): 'mobile' | 'tablet' | 'desktop' => {
    if (deviceUtils.isMobile()) return 'mobile';
    if (deviceUtils.isTablet()) return 'tablet';
    return 'desktop';
  },

  isTouchDevice: (): boolean => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  getViewportDimensions: (): { width: number; height: number } => {
    return {
      width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
      height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    };
  }
};

export const errorUtils = {
  logError: (error: Error, context?: string): void => {
    console.error(`[${context || 'Application'}] Error:`, error);
    
    if (process.env.NODE_ENV === 'production') {
    }
  },

  handleAsyncError: (promise: Promise<any>, context?: string): Promise<any> => {
    return promise.catch(error => {
      errorUtils.logError(error, context);
      throw error;
    });
  },

  safeExecute: <T>(fn: () => T, fallback: T, context?: string): T => {
    try {
      return fn();
    } catch (error) {
      errorUtils.logError(error as Error, context);
      return fallback;
    }
  }
};

export const animationClasses = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  slideIn: 'animate-slide-in',
  scaleIn: 'animate-scale-in',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  spin: 'animate-spin',
  shake: 'animate-shake',
  glow: 'animate-glow',
  float: 'animate-float',
  messageIn: 'animate-message-in'
};

export const themeConfig = {
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    accent: '#4facfe',
    success: '#00f2fe',
    warning: '#ffecd2',
    error: '#f5576c',
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.85)',
      muted: 'rgba(255, 255, 255, 0.6)'
    }
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    warning: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
  },
  
  shadows: {
    soft: '0 8px 32px rgba(31, 38, 135, 0.37)',
    strong: '0 15px 35px rgba(31, 38, 135, 0.5)',
    glow: '0 0 20px rgba(102, 126, 234, 0.3)'
  },
  
  borderRadius: {
    sm: '12px',
    md: '16px',
    lg: '20px',
    xl: '24px'
  },
  
  transitions: {
    fast: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    normal: 'all 0.4s cubic-bezier(0.23, 1, 0.320, 1)',
    slow: 'all 0.6s cubic-bezier(0.23, 1, 0.320, 1)',
    bounce: 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  }
};

export const utils = {
  animation: animationUtils,
  performance: performanceUtils,
  color: colorUtils,
  dom: domUtils,
  sound: soundUtils,
  haptic: hapticUtils,
  validation: validationUtils,
  format: formatUtils,
  device: deviceUtils,
  error: errorUtils,
  theme: themeConfig,
  classes: animationClasses
};

export default utils;