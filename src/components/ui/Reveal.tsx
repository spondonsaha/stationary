"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-reveal wrapper. Adds .revealed when the element scrolls into view.
 * ~15 lines of IntersectionObserver — no animation libraries.
 * Respects prefers-reduced-motion via the global .reveal CSS.
 */
export function Reveal({
  children,
  variant = "up",
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  variant?: "up" | "fade";
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "ul";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      data-reveal={variant}
      className={`reveal ${shown ? "revealed" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
