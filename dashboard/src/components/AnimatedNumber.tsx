"use client";

import { useEffect, useRef, useState } from "react";
import { formatNL } from "@/lib/format";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
}

export default function AnimatedNumber({
  value,
  duration = 900,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      // Animate from 0 on first mount
      const start = performance.now();
      const to = value;
      const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setDisplay(Math.round(to * eased));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      return;
    }

    const from = prevRef.current;
    const to = value;
    prevRef.current = to;
    if (from === to) return;

    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration]);

  return <>{formatNL(display)}</>;
}
