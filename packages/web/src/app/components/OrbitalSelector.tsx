import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  FaPenFancy,
  FaSquare,
  FaCircle,
  FaMousePointer,
  FaSlash,
  FaFont,
  FaEraser,
} from "react-icons/fa";
import { TOOLS, Tool } from "../lib/tools";

interface OrbitalSelectorProps {
  isOpen: boolean;
  position: { x: number; y: number };
  activeTool: Tool;
  onToolSelect: (tool: Tool) => void;
  hoveredTool?: Tool | null;
  onHoverTool?: (tool: Tool | null) => void;
}

const toolOrder: Tool[] = [
  TOOLS.PEN,
  TOOLS.LINE,
  TOOLS.RECTANGLE,
  TOOLS.CIRCLE,
  TOOLS.ERASER,
  TOOLS.SELECT,
  TOOLS.TEXT,
];

const ToolIcons: Record<string, React.ReactNode> = {
  [TOOLS.PEN]: <FaPenFancy size={20} />,
  [TOOLS.LINE]: <FaSlash size={20} style={{ transform: "rotate(135deg)" }} />,
  [TOOLS.RECTANGLE]: <FaSquare size={20} />,
  [TOOLS.CIRCLE]: <FaCircle size={20} />,
  [TOOLS.ERASER]: <FaEraser size={20} />,
  [TOOLS.SELECT]: <FaMousePointer size={20} />,
  [TOOLS.TEXT]: <FaFont size={20} />,
};

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInRadians: number
) {
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
) {
  const startOuter = polarToCartesian(cx, cy, outerR, endAngle);
  const endOuter = polarToCartesian(cx, cy, outerR, startAngle);
  const startInner = polarToCartesian(cx, cy, innerR, endAngle);
  const endInner = polarToCartesian(cx, cy, innerR, startAngle);

  const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";

  const d = [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArcFlag} 1 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");

  return d;
}

export default function OrbitalSelector({
  isOpen,
  position,
  activeTool,
  onToolSelect,
  hoveredTool: parentHoveredTool,
  onHoverTool,
}: OrbitalSelectorProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (onHoverTool) onHoverTool(null);
        return;
      }
      const n = Number(e.key);
      if (!Number.isNaN(n) && n >= 1 && n <= toolOrder.length) {
        const tool = toolOrder[n - 1];
        onToolSelect(tool);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onHoverTool, onToolSelect]);
  const ref = useRef<HTMLDivElement | null>(null);
  const [localHovered, setLocalHovered] = useState<Tool | null>(
    parentHoveredTool ?? null
  );

  useEffect(() => {
    if (!isOpen) {
      setLocalHovered(null);
      if (onHoverTool) onHoverTool(null);
    }
  }, [isOpen, onHoverTool]);

  useEffect(() => {
    if (parentHoveredTool !== undefined) {
      setLocalHovered(parentHoveredTool ?? null);
    }
  }, [parentHoveredTool]);

  const diameter = 240;
  const cx = diameter / 2;
  const cy = diameter / 2;
  const innerRadius = 44;
  const outerRadius = 110;

  const adjustedPosition = useMemo(() => {
    if (typeof window === "undefined") {
      return { left: position.x - cx, top: position.y - cy };
    }

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const idealLeft = position.x - cx;
    const idealTop = position.y - cy;

    const finalLeft = Math.max(0, Math.min(idealLeft, windowWidth - diameter));
    const finalTop = Math.max(0, Math.min(idealTop, windowHeight - diameter));

    return { left: finalLeft, top: finalTop };
  }, [position.x, position.y, diameter, cx, cy]);

  const total = toolOrder.length;
  const anglePer = (2 * Math.PI) / total;

  const angularDistance = (a: number, b: number) => {
    const diff = Math.atan2(Math.sin(a - b), Math.cos(a - b));
    return Math.abs(diff);
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < innerRadius || dist > outerRadius) {
      if (localHovered !== null) {
        setLocalHovered(null);
        if (onHoverTool) onHoverTool(null);
      }
      return;
    }

    let pointerAngle = Math.atan2(dy, dx);
    if (pointerAngle < 0) pointerAngle += 2 * Math.PI;
    pointerAngle = (pointerAngle + Math.PI / 2) % (2 * Math.PI);
    let bestTool: Tool | null = null;
    let bestDist = Infinity;
    for (let i = 0; i < total; i++) {
      const start = -Math.PI / 2 + i * anglePer;
      const end = start + anglePer;
      let mid = (start + end) / 2;
      if (mid < 0) mid += 2 * Math.PI;
      mid = (mid + Math.PI / 2) % (2 * Math.PI);
      const d = angularDistance(pointerAngle, mid);
      if (d < bestDist) {
        bestDist = d;
        bestTool = toolOrder[i];
      }
    }

    if (bestTool !== localHovered) {
      setLocalHovered(bestTool);
      if (onHoverTool) onHoverTool(bestTool);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handlePointerMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handlePointerMove(touch.clientX, touch.clientY);
    }
  };

  const handleMouseLeave = () => {
    if (localHovered !== null) {
      setLocalHovered(null);
      if (onHoverTool) onHoverTool(null);
    }
  };

  const handlePointerEnd = () => {
    const picked = parentHoveredTool ?? localHovered;
    if (picked) {
      onToolSelect(picked);
    }
  };

  const handleMouseUp = () => {
    handlePointerEnd();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handlePointerEnd();
  };

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);

  useEffect(() => {
    const effective = parentHoveredTool ?? localHovered;
    if (!effective) {
      setTooltip(null);
      return;
    }

    const idx = toolOrder.indexOf(effective);
    if (idx === -1) return;

    const start = -Math.PI / 2 + idx * anglePer;
    const end = start + anglePer;
    const mid = (start + end) / 2;
    const iconR = (innerRadius + outerRadius) / 2;
    const pos = polarToCartesian(cx, cy, iconR, mid);

    setTooltip({ x: pos.x, y: pos.y - 30, text: effective });
  }, [parentHoveredTool, localHovered, anglePer, cx, cy]);

  const [mounted, setMounted] = useState<boolean>(isOpen);
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(false), 180);
    return () => clearTimeout(t);
  }, [isOpen]);

  if (!mounted) return null;

  const holoGradient = (
    <linearGradient id="holoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#67e8f9" stopOpacity="1" />
      <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.95" />
      <stop offset="100%" stopColor="#a855f7" stopOpacity="0.9" />
    </linearGradient>
  );

  return (
    <div
      ref={ref}
      className="absolute pointer-events-auto touch-none"
      style={{
        left: adjustedPosition.left,
        top: adjustedPosition.top,
        width: diameter,
        height: diameter,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "opacity 160ms ease, transform 160ms ease",
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? "scale(1)" : "scale(0.88)",
        pointerEvents: isOpen ? "auto" : "none",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg
        width={diameter}
        height={diameter}
        viewBox={`0 0 ${diameter} ${diameter}`}
      >
        <defs>
          {holoGradient}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx={cx}
          cy={cy}
          r={outerRadius + 10}
          fill="rgba(10, 10, 10, 0.85)"
          stroke="url(#holoGrad)"
          strokeWidth={2}
          filter="url(#glow)"
          style={{
            backdropFilter: "blur(10px)",
          }}
        />

        {toolOrder.map((tool, i) => {
          const start = -Math.PI / 2 + i * anglePer;
          const end = start + anglePer;
          const pathD = describeArc(
            cx,
            cy,
            innerRadius,
            outerRadius,
            start,
            end
          );
          const isHovered = (parentHoveredTool ?? localHovered) === tool;
          const isActive = activeTool === tool;

          return (
            <g key={tool}>
              <path
                d={pathD}
                fill={
                  isHovered
                    ? "url(#holoGrad)"
                    : isActive
                    ? "rgba(6, 182, 212, 0.15)"
                    : "rgba(13, 17, 23, 0.5)"
                }
                stroke={
                  isActive && !isHovered
                    ? "#22d3ee"
                    : isHovered
                    ? "#67e8f9"
                    : "rgba(103, 232, 249, 0.2)"
                }
                strokeWidth={isHovered ? 2.5 : isActive ? 2 : 1}
                style={{
                  transition: "all 120ms ease-out",
                  filter: isHovered || isActive ? "url(#glow)" : undefined,
                  transformOrigin: `${cx}px ${cy}px`,
                  transform: isHovered ? "scale(1.05)" : "scale(1)",
                }}
              />

              {(() => {
                const mid = (start + end) / 2;
                const iconR = (innerRadius + outerRadius) / 2;
                const pos = polarToCartesian(cx, cy, iconR, mid);
                return (
                  <g transform={`translate(${pos.x - 10}, ${pos.y - 10})`}>
                    <rect
                      x={0}
                      y={0}
                      width={40}
                      height={40}
                      rx={8}
                      ry={8}
                      fill={isHovered ? "rgba(34,211,238,0.2)" : "transparent"}
                      stroke={
                        isHovered ? "rgba(103,232,249,0.4)" : "transparent"
                      }
                      strokeWidth={1.5}
                    />
                    <g
                      transform="translate(10,10)"
                      fill={isHovered ? "#0a0a0a" : "#22d3ee"}
                      stroke={isHovered ? "#67e8f9" : "#22d3ee"}
                      strokeWidth={0.5}
                      style={{ filter: isHovered ? "url(#glow)" : undefined }}
                    >
                      {ToolIcons[tool]}
                    </g>
                  </g>
                );
              })()}
            </g>
          );
        })}

        <circle
          cx={cx}
          cy={cy}
          r={innerRadius - 8}
          fill="rgba(0,10,20,0.75)"
          stroke="url(#holoGrad)"
          strokeWidth={2}
          filter="url(#glow)"
        />
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fontSize={12}
          fill="#67e8f9"
          style={{
            fontWeight: 700,
            filter: "drop-shadow(0 0 8px rgba(103, 232, 249, 0.6))",
          }}
        >
          TOOLS
        </text>
      </svg>
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x - 40,
            top: tooltip.y - 12,
            width: 80,
            padding: "6px 8px",
            borderRadius: 8,
            background: "rgba(10, 10, 10, 0.95)",
            color: "#67e8f9",
            textAlign: "center",
            fontSize: 12,
            fontWeight: 700,
            pointerEvents: "none",
            boxShadow:
              "0 8px 24px rgba(0, 0, 0, 0.8), 0 0 16px rgba(34, 211, 238, 0.3)",
            border: "1px solid rgba(34, 211, 238, 0.3)",
            backdropFilter: "blur(10px)",
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
