"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if device supports touch
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Show cursor elements
    dot.style.display = "block";
    ring.style.display = "block";

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;
    let isHovered = false;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      // Instantly position center dot using translate3d (GPU accelerated)
      dot.style.transform = `translate3d(${mouseX - 6}px, ${mouseY - 6}px, 0)`;
    };

    // Smooth trail loop for outer ring
    let animFrame: number;
    const updateRing = () => {
      const dx = mouseX - ringX;
      const dy = mouseY - ringY;
      ringX += dx * 0.15;
      ringY += dy * 0.15;

      const scale = isHovered ? 1.5 : 1;
      ring.style.transform = `translate3d(${ringX - 16}px, ${ringY - 16}px, 0) scale(${scale})`;

      animFrame = requestAnimationFrame(updateRing);
    };
    animFrame = requestAnimationFrame(updateRing);

    // Listen for hover events using event delegation
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || typeof target.closest !== "function") return;

      if (
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("button") ||
        target.closest("a") ||
        (target.classList && target.classList.contains("interactive")) ||
        target.closest(".interactive")
      ) {
        isHovered = true;
        dot.style.width = "6px";
        dot.style.height = "6px";
        dot.style.backgroundColor = "#B8A98F";
        ring.style.borderColor = "#B8A98F";
        ring.style.backgroundColor = "rgba(184, 169, 143, 0.05)";
      } else {
        isHovered = false;
        dot.style.width = "12px";
        dot.style.height = "12px";
        dot.style.backgroundColor = "#F0EFE7";
        ring.style.borderColor = "rgba(184, 169, 143, 0.4)";
        ring.style.backgroundColor = "transparent";
      }
    };

    const onMouseLeave = () => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };

    const onMouseEnter = () => {
      dot.style.opacity = "1";
      ring.style.opacity = "1";
    };

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    document.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      document.removeEventListener("mouseover", handleMouseOver);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  return (
    <>
      {/* Center Dot */}
      <div
        ref={dotRef}
        style={{
          display: "none",
          position: "fixed",
          top: 0,
          left: 0,
          width: "12px",
          height: "12px",
          backgroundColor: "#F0EFE7",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 9999,
          transform: "translate3d(0, 0, 0)",
          transition: "width 0.2s, height 0.2s, background-color 0.2s, opacity 0.25s",
        }}
      />
      {/* Outer Ring */}
      <div
        ref={ringRef}
        style={{
          display: "none",
          position: "fixed",
          top: 0,
          left: 0,
          width: "32px",
          height: "32px",
          border: "1px solid rgba(184, 169, 143, 0.4)",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 9998,
          transform: "translate3d(0, 0, 0)",
          transition: "border-color 0.2s, background-color 0.2s, opacity 0.25s",
        }}
      />
    </>
  );
}
