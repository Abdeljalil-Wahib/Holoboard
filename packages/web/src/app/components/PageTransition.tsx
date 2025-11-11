"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import AnimatedBackground from "./AnimatedBackground";

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<
    "idle" | "dimming" | "entrance"
  >("idle");
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    // Only trigger transition when pathname actually changes to a board route
    if (
      pathname.startsWith("/board/") &&
      prevPathnameRef.current !== pathname
    ) {
      setIsTransitioning(true);
      setTransitionPhase("dimming");

      // After dimming completes, start the entrance animation
      const entranceTimer = setTimeout(() => {
        setTransitionPhase("entrance");
      }, 1500); // 1.5s for dimming lights

      // Complete transition after entrance animation
      const completeTimer = setTimeout(() => {
        setIsTransitioning(false);
        setTransitionPhase("idle");
      }, 3000); // 1.5s dimming + 1.5s entrance

      prevPathnameRef.current = pathname;

      return () => {
        clearTimeout(entranceTimer);
        clearTimeout(completeTimer);
      };
    } else {
      prevPathnameRef.current = pathname;
    }
  }, [pathname]);

  return (
    <>
      {isTransitioning && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          {/* Dimming overlay - gradual fade to black like lights dimming */}
          <div
            className={`absolute inset-0 bg-black z-10 ${
              transitionPhase === "dimming"
                ? "animate-dim-lights"
                : "opacity-100"
            }`}
          />

          {/* Animated particles layer - stays visible throughout */}
          <div className="absolute inset-0 z-20">
            <AnimatedBackground />
          </div>

          {/* Sci-fi entrance animation for board page */}
          {transitionPhase === "entrance" && (
            <div className="absolute inset-0 z-30 animate-board-entrance">
              {/* Hexagonal grid that expands from center */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]" />

              {/* Expanding circles/rings */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-32 h-32 rounded-full border-2 border-cyan-400/60 animate-expand-ring-1" />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-32 h-32 rounded-full border-2 border-cyan-400/40 animate-expand-ring-2" />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-32 h-32 rounded-full border-2 border-cyan-400/20 animate-expand-ring-3" />
              </div>

              {/* Scanning line effect */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(6,182,212,0.8)] animate-scan-line" />
            </div>
          )}
        </div>
      )}
      {children}
    </>
  );
}
