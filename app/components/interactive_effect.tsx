'use client';

import { useEffect, useState, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

interface Trail {
  x: number;
  y: number;
  id: number;
  timestamp: number;
}

export const FloatingParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = (): Particle[] => {
      const particles: Particle[] = [];
      const colors: string[] = ['#667eea', '#764ba2', '#4facfe', '#00f2fe', '#f093fb', '#f5576c'];
      
      for (let i = 0; i < 25; i++) {
        const selectedColor = colors[Math.floor(Math.random() * colors.length)] as string;
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.1,
          color: selectedColor
        });
      }
      return particles;
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        if (index % 2 === 0) {
          particlesRef.current.slice(index + 1).forEach(otherParticle => {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 80) {
              ctx.save();
              ctx.globalAlpha = (80 - distance) / 80 * 0.05;
              ctx.strokeStyle = particle.color;
              ctx.lineWidth = 0.3;
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.stroke();
              ctx.restore();
            }
          });
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    particlesRef.current = createParticles();
    animate();

    const handleResize = () => {
      resizeCanvas();
      particlesRef.current = createParticles();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current !== undefined) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{ 
        zIndex: -1, 
        pointerEvents: 'none',
        opacity: 0.15
      }}
    />
  );
};

export const MouseTrail = () => {
  const [trails, setTrails] = useState<Trail[]>([]);

  useEffect(() => {
    let trailId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const newTrail: Trail = {
        x: e.clientX,
        y: e.clientY,
        id: trailId++,
        timestamp: Date.now()
      };

      setTrails(prev => {
        const newTrails = [...prev.slice(-5), newTrail];
        return newTrails;
      });
    };

    const cleanupInterval = setInterval(() => {
      setTrails(prev => {
        const now = Date.now();
        return prev.filter(trail => now - trail.timestamp < 800);
      });
    }, 200);

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearInterval(cleanupInterval);
    };
  }, []);

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100" style={{ pointerEvents: 'none', zIndex: 999 }}>
      {trails.map((trail) => {
        const age = Date.now() - trail.timestamp;
        const opacity = Math.max(0, 1 - age / 1000);
        const scale = Math.max(0.1, 1 - age / 1000);
        
        return (
          <div
            key={trail.id}
            className="position-absolute rounded-circle"
            style={{
              left: trail.x - 4,
              top: trail.y - 4,
              width: 8,
              height: 8,
              background: `radial-gradient(circle, rgba(102, 126, 234, ${opacity}), transparent)`,
              transform: `scale(${scale})`,
              transition: 'transform 0.1s ease-out',
              pointerEvents: 'none'
            }}
          />
        );
      })}
    </div>
  );
};

export const useRippleEffect = () => {
  const addRipple = (event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: scale(0);
      animation: ripple 0.6s linear;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      pointer-events: none;
    `;
    
    const buttonElement = button as HTMLElement;
    buttonElement.style.position = 'relative';
    buttonElement.style.overflow = 'hidden';
    buttonElement.appendChild(ripple);
    
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);
  };

  return addRipple;
};

export const useTypewriter = (text: string, speed: number = 50) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayText('');
      setIsTyping(false);
      return;
    }
    
    setIsTyping(true);
    setDisplayText('');
    
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayText(prev => prev + text.charAt(index));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, speed);

    return () => {
      clearInterval(timer);
      setIsTyping(false);
    };
  }, [text, speed]);

  return { displayText, isTyping };
};

export const useParallax = (strength: number = 0.5) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.pageYOffset * strength);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [strength]);

  return offset;
};

export const useInView = (threshold: number = 0.1) => {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        if (entries.length > 0 && entries[0]) {
          setInView(entries[0].isIntersecting);
        }
      },
      { threshold }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold]);

  return { ref, inView };
};

if (typeof window !== 'undefined') {
  const existingStyle = document.querySelector('style[data-ripple]');
  if (!existingStyle) {
    const style = document.createElement('style');
    style.setAttribute('data-ripple', 'true');
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}