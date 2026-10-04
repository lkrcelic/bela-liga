"use client";

import useReducedMotion from "@/app/_hooks/useReducedMotion";
import {useEffect, useRef, useState} from "react";

// Animates a number from its previous value to `target` (ease-out cubic). Jumps straight there under reduced motion.
export default function useCountUp(target: number, duration = 600, delay = 200): number {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);

  useEffect(() => {
    if (reduce || shownRef.current === target) {
      shownRef.current = target;
      setShown(target);
      return;
    }
    const from = shownRef.current;
    let frame = 0;
    let start = 0;
    const step = (now: number) => {
      if (!start) start = now;
      const k = Math.min(1, (now - start) / duration);
      const value = Math.round(from + (target - from) * (1 - Math.pow(1 - k, 3)));
      shownRef.current = value;
      setShown(value);
      if (k < 1) frame = requestAnimationFrame(step);
    };
    const timer = setTimeout(() => {
      frame = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [target, duration, delay, reduce]);

  return shown;
}
