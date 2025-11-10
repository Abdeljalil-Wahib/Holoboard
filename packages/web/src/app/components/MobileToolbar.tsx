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
}: MobileToolbarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/90 via-black/80 to-transparent backdrop-blur-2xl border-t border-cyan-400/40 shadow-[0_-4px_30px_rgba(6,182,212,0.2)] pb-safe">
      <div className="flex justify-around items-center p-2 gap-1 max-w-2xl mx-auto">
        {toolConfig.map(({ tool, icon: Icon, label, rotate }) => {
          const isActive = activeTool === tool;
          return (
            <button
              key={tool}
              onClick={() => onToolSelect(tool)}
              className={`
                flex flex-col items-center justify-center gap-1 p-3 rounded-lg min-w-[60px] transition-all
                ${
                  isActive
                    ? "bg-gradient-to-br from-cyan-500/40 to-purple-500/40 border-2 border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.6)]"
                    : "bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-400/30 hover:border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                }
              `}
              aria-label={label}
              aria-pressed={isActive}
            >
              <Icon
                size={20}
                className={`${isActive ? "text-cyan-300" : "text-cyan-400/70"}`}
                style={rotate ? { transform: "rotate(135deg)" } : undefined}
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "text-cyan-200" : "text-cyan-400/60"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
