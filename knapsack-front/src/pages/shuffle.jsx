import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const Shuffle = ({
  text,
  shuffleDirection = 'right',
  duration = 0.35,
  animationMode = 'evenodd',
  shuffleTimes = 1,
  ease = 'power3.out',
  stagger = 0.03,
  threshold = 0.1,
  triggerOnce = true,
  triggerOnHover = false,
  respectReducedMotion = true,
  className = '',
}) => {
  const containerRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const observerRef = useRef(null);

  const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  const shuffleText = (element) => {
    if (respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    if (triggerOnce && hasAnimated) {
      return;
    }

    const letters = element.querySelectorAll('.shuffle-letter');
    const originalTexts = Array.from(letters).map((letter) => letter.textContent);

    letters.forEach((letter, index) => {
      let iterations = 0;
      const shouldAnimate =
        animationMode === 'all' ||
        (animationMode === 'evenodd' && index % 2 === 0) ||
        (animationMode === 'odd' && index % 2 !== 0);

      if (!shouldAnimate) return;

      const interval = setInterval(() => {
        letter.textContent =
          iterations < shuffleTimes
            ? chars[Math.floor(Math.random() * chars.length)]
            : originalTexts[index];

        if (iterations >= shuffleTimes) {
          clearInterval(interval);
        }

        iterations += 1 / 3;
      }, 30);
    });

    const direction = shuffleDirection === 'right' ? 1 : -1;

    gsap.fromTo(
      letters,
      {
        opacity: 0,
        x: direction * 20,
      },
      {
        opacity: 1,
        x: 0,
        duration: duration,
        ease: ease,
        stagger: stagger,
      }
    );

    if (triggerOnce) {
      setHasAnimated(true);
    }
  };

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Intersection Observer for scroll trigger
    if (!triggerOnHover) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              shuffleText(element);
              if (triggerOnce && observerRef.current) {
                observerRef.current.disconnect();
              }
            }
          });
        },
        { threshold: threshold }
      );

      observerRef.current.observe(element);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasAnimated]);

  const handleMouseEnter = () => {
    if (triggerOnHover && containerRef.current) {
      shuffleText(containerRef.current);
    }
  };

  return (
    <span
      ref={containerRef}
      className={`inline-block ${className}`}
      onMouseEnter={triggerOnHover ? handleMouseEnter : undefined}
      style={{ cursor: triggerOnHover ? 'pointer' : 'default' }}
    >
      {text.split('').map((char, index) => (
        <span
          key={index}
          className="shuffle-letter inline-block"
          style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
        >
          {char}
        </span>
      ))}
    </span>
  );
};

export default Shuffle;