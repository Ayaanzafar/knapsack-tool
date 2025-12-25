import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const SplitText = ({
  text,
  className = '',
  delay = 100,
  duration = 0.6,
  ease = 'power3.out',
  splitType = 'chars', // 'chars', 'words', or 'lines'
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  onLetterAnimationComplete = null,
}) => {
  const containerRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const observerRef = useRef(null);

  const splitTextIntoElements = (text, type) => {
    if (type === 'chars') {
      return text.split('').map((char, index) => (
        <span
          key={index}
          className="split-char inline-block"
          style={{ 
            whiteSpace: char === ' ' ? 'pre' : 'normal',
            display: 'inline-block'
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ));
    } else if (type === 'words') {
      return text.split(' ').map((word, index) => (
        <span key={index} className="split-word inline-block mr-1">
          {word}
        </span>
      ));
    } else if (type === 'lines') {
      return text.split('\n').map((line, index) => (
        <span key={index} className="split-line block">
          {line}
        </span>
      ));
    }
    return text;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || hasAnimated) return;

    const elements = container.querySelectorAll(
      splitType === 'chars' ? '.split-char' : 
      splitType === 'words' ? '.split-word' : 
      '.split-line'
    );

    if (elements.length === 0) return;

    const animateElements = () => {
      // Set initial state
      gsap.set(elements, from);

      // Animate to final state
      gsap.to(elements, {
        ...to,
        duration: duration,
        ease: ease,
        stagger: delay / 1000, // Convert ms to seconds
        onComplete: () => {
          setHasAnimated(true);
          if (onLetterAnimationComplete) {
            onLetterAnimationComplete();
          }
        },
      });
    };

    // Intersection Observer for scroll trigger
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            animateElements();
            if (observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        });
      },
      { threshold: threshold, rootMargin: rootMargin }
    );

    observerRef.current.observe(container);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasAnimated, delay, duration, ease, splitType, from, to, threshold, rootMargin, onLetterAnimationComplete]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ textAlign: textAlign }}
    >
      {splitTextIntoElements(text, splitType)}
    </div>
  );
};

export default SplitText;