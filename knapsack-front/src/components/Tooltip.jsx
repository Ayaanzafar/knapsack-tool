import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Tooltip({
  content,
  children,
  disabled = false,
  placement = 'top',
  className = '',
}) {
  const tooltipId = useId();
  const anchorRef = useRef(null);
  const tooltipRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ left: 0, top: 0, resolvedPlacement: placement });

  const shouldRender = !!content && !disabled;

  const arrowPlacementClass = useMemo(() => {
    const p = coords.resolvedPlacement;
    if (p === 'bottom') return '-top-1 left-1/2 -translate-x-1/2';
    if (p === 'left') return 'right-[-4px] top-1/2 -translate-y-1/2';
    if (p === 'right') return 'left-[-4px] top-1/2 -translate-y-1/2';
    return '-bottom-1 left-1/2 -translate-x-1/2';
  }, [coords.resolvedPlacement]);

  const computePosition = useMemo(() => {
    const GAP = 10;
    const VIEWPORT_PADDING = 8;

    return () => {
      const anchor = anchorRef.current;
      const tip = tooltipRef.current;
      if (!anchor || !tip) return;

      const rect = anchor.getBoundingClientRect();
      const tipRect = tip.getBoundingClientRect();

      const placementsToTry = [placement, 'top', 'bottom', 'right', 'left'].filter(
        (p, idx, arr) => arr.indexOf(p) === idx
      );

      const fit = (left, top) => {
        const withinX =
          left >= VIEWPORT_PADDING &&
          left + tipRect.width <= window.innerWidth - VIEWPORT_PADDING;
        const withinY =
          top >= VIEWPORT_PADDING &&
          top + tipRect.height <= window.innerHeight - VIEWPORT_PADDING;
        return withinX && withinY;
      };

      const calc = (p) => {
        if (p === 'bottom') {
          return {
            left: rect.left + rect.width / 2 - tipRect.width / 2,
            top: rect.bottom + GAP,
          };
        }
        if (p === 'left') {
          return {
            left: rect.left - tipRect.width - GAP,
            top: rect.top + rect.height / 2 - tipRect.height / 2,
          };
        }
        if (p === 'right') {
          return {
            left: rect.right + GAP,
            top: rect.top + rect.height / 2 - tipRect.height / 2,
          };
        }
        // top
        return {
          left: rect.left + rect.width / 2 - tipRect.width / 2,
          top: rect.top - tipRect.height - GAP,
        };
      };

      let chosen = placementsToTry[0] || 'top';
      let next = calc(chosen);

      for (const candidate of placementsToTry) {
        const pos = calc(candidate);
        if (fit(pos.left, pos.top)) {
          chosen = candidate;
          next = pos;
          break;
        }
      }

      const clampedLeft = Math.max(
        VIEWPORT_PADDING,
        Math.min(window.innerWidth - VIEWPORT_PADDING - tipRect.width, next.left)
      );
      const clampedTop = Math.max(
        VIEWPORT_PADDING,
        Math.min(window.innerHeight - VIEWPORT_PADDING - tipRect.height, next.top)
      );

      setCoords({ left: clampedLeft, top: clampedTop, resolvedPlacement: chosen });
    };
  }, [placement]);

  useLayoutEffect(() => {
    if (!open || !shouldRender) return;
    computePosition();
  }, [open, shouldRender, computePosition, content]);

  useEffect(() => {
    if (!open || !shouldRender) return;
    const onScrollOrResize = () => computePosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, shouldRender, computePosition]);

  if (!shouldRender) return <>{children}</>;

  return (
    <span
      ref={anchorRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      aria-describedby={open ? tooltipId : undefined}
    >
      {children}
      {open &&
        createPortal(
          <span
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            className={[
              'pointer-events-none fixed z-[1000]',
              'opacity-100 translate-y-0 scale-100',
              'transition duration-150 ease-out',
            ].join(' ')}
            style={{ left: `${coords.left}px`, top: `${coords.top}px` }}
          >
            <span className="relative block max-w-[260px] rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium leading-snug text-white shadow-xl ring-1 ring-black/10">
              {content}
              <span
                className={[
                  'absolute h-2 w-2 rotate-45 bg-gray-900',
                  arrowPlacementClass,
                ].join(' ')}
              />
            </span>
          </span>,
          document.body
        )}
    </span>
  );
}
