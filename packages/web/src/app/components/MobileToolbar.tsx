"use client";

import React from "react";
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

interface MobileToolbarProps {
  activeTool: Tool;
  onToolSelect: (tool: Tool) => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
  theme: "holographic" | "light";
}

const toolConfig = [
  { tool: TOOLS.PEN, icon: FaPenFancy, label: "Pen" },
  { tool: TOOLS.LINE, icon: FaSlash, label: "Line", rotate: true },
  { tool: TOOLS.RECTANGLE, icon: FaSquare, label: "Rect" },
  { tool: TOOLS.CIRCLE, icon: FaCircle, label: "Circle" },
  { tool: TOOLS.TEXT, icon: FaFont, label: "Text" },
  { tool: TOOLS.ERASER, icon: FaEraser, label: "Eraser" },
  { tool: TOOLS.SELECT, icon: FaMousePointer, label: "Select" },
];

export default function MobileToolbar({
  activeTool,
  onToolSelect,
  isVisible,
  onToggleVisibility,
  theme,
}: MobileToolbarProps) {
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-30 backdrop-blur-2xl border-t pb-safe transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : 'translate-y-full'
    } ${
      theme === "light"
        ? "bg-white/95 border-gray-300 shadow-lg"
        : "bg-gradient-to-t from-black/90 via-black/80 to-transparent border-cyan-400/40 shadow-[0_-4px_30px_rgba(6,182,212,0.2)]"
    }`}>
      {/* Toolbar toggle indicator */}
      <button
        onClick={onToggleVisibility}
        className={`absolute left-1/2 -translate-x-1/2 top-0 -translate-y-full w-12 h-6 backdrop-blur-md border-x border-t rounded-t-lg flex items-end justify-center pb-1 transition-all z-40 ${
          theme === "light"
            ? "bg-gradient-to-t from-gray-300/90 to-transparent border-gray-400 shadow-sm hover:shadow-md"
            : "bg-gradient-to-t from-black/80 to-transparent border-cyan-400/40 shadow-[0_-4px_15px_rgba(6,182,212,0.3)] hover:shadow-[0_-4px_25px_rgba(6,182,212,0.5)]"
        }`}
        aria-label={isVisible ? "Hide toolbar" : "Show toolbar"}
      >
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${
            isVisible ? 'rotate-0' : 'rotate-180'
          } ${theme === "light" ? "text-gray-700" : "text-cyan-400"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div className="overflow-x-auto overflow-y-hidden px-2 py-2 scrollbar-hide">
        <div className="flex items-center gap-2 w-max">
          {toolConfig.map(({ tool, icon: Icon, label, rotate }) => {
            const isActive = activeTool === tool;
            return (
              <button
                key={tool}
                onClick={() => onToolSelect(tool)}
                className={`
                  flex flex-col items-center justify-center gap-1 p-2.5 rounded-lg w-[70px] flex-shrink-0 transition-all
                  ${
                    theme === "light"
                      ? isActive
                        ? "bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-gray-400 shadow-sm"
                        : "bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-transparent hover:border-gray-300 shadow-sm"
                      : isActive
                      ? "bg-gradient-to-br from-cyan-500/40 to-purple-500/40 border-2 border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.6)]"
                      : "bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-2 border-cyan-400/30 hover:border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  }
                `}
                aria-label={label}
                aria-pressed={isActive}
              >
                <Icon
                  size={18}
                  className={`${
                    theme === "light"
                      ? "text-black"
                      : isActive ? "text-cyan-300" : "text-cyan-400/70"
                  }`}
                  style={rotate ? { transform: "rotate(135deg)" } : undefined}
                />
                <span
                  className={`text-[10px] font-medium ${
                    theme === "light"
                      ? isActive ? "text-gray-800" : "text-gray-600"
                      : isActive ? "text-cyan-200" : "text-cyan-400/60"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
