// CREDIT
// Component inspired by @BalintFerenczy on X
// https://codepen.io/BalintFerenczy/pen/KwdoyEN

import { useEffect, useRef } from 'react';

const ElectricBorder = ({
  children,
  color = '#7df9ff',
  speed = 1,
  chaos = 0.5,
  thickness = 2,
  style = {},
  className = '',
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    let width = container.offsetWidth;
    let height = container.offsetHeight;

    // Set canvas size
    const setCanvasSize = () => {
      width = container.offsetWidth;
      height = container.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };

    setCanvasSize();

    // Parse color
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 125, g: 249, b: 255 };
    };

    const rgb = hexToRgb(color);

    // Animation variables
    let time = 0;
    const points = [];
    const numPoints = 200; // Increased for smoother effect

    // Create points along the border
    const perimeter = (width + height) * 2;
    for (let i = 0; i < numPoints; i++) {
      const distance = (perimeter / numPoints) * i;
      const point = getPointOnPerimeter(distance, width, height);
      points.push({
        ...point,
        offset: Math.random() * Math.PI * 2,
      });
    }

    function getPointOnPerimeter(distance, w, h) {
      if (distance < w) {
        return { x: distance, y: 0 };
      } else if (distance < w + h) {
        return { x: w, y: distance - w };
      } else if (distance < w * 2 + h) {
        return { x: w - (distance - w - h), y: h };
      } else {
        return { x: 0, y: h - (distance - w * 2 - h) };
      }
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      time += 0.02 * speed;

      // Draw the electric border with more prominent effect
      ctx.beginPath();
      
      points.forEach((point, i) => {
        // Increased wobble for more visible effect
        const wobble = Math.sin(time * 2 + point.offset) * chaos * 8;
        const x = point.x + wobble;
        const y = point.y + wobble;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.closePath();

      // Outer glow (brightest)
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;
      ctx.lineWidth = thickness + 6;
      ctx.shadowBlur = 30;
      ctx.shadowColor = color;
      ctx.stroke();

      // Middle glow
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.9)`;
      ctx.lineWidth = thickness + 3;
      ctx.shadowBlur = 20;
      ctx.shadowColor = color;
      ctx.stroke();

      // Inner core (most vibrant)
      const alpha = 0.7 + Math.sin(time * 3) * 0.3;
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
      ctx.lineWidth = thickness;
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.stroke();

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    // Handle resize
    const handleResize = () => {
      setCanvasSize();
      points.length = 0;
      const perimeter = (width + height) * 2;
      for (let i = 0; i < numPoints; i++) {
        const distance = (perimeter / numPoints) * i;
        const point = getPointOnPerimeter(distance, width, height);
        points.push({
          ...point,
          offset: Math.random() * Math.PI * 2,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [color, speed, chaos, thickness]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ ...style, position: 'relative' }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  );
};

export default ElectricBorder;