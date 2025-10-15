// src/app/components/Whiteboard.tsx
"use client";

import { Stage, Layer, Line, Rect } from "react-konva";
import React from "react";

interface Point {
  x: number;
  y: number;
}
interface StageState {
  scale: number;
  x: number;
  y: number;
}
interface LineData {
  // This interface is correct
  points: Point[];
  color: string;
}

interface WhiteboardProps {
  lines: LineData[]; // This prop type is correct
  stage: StageState;
  stageRef: React.RefObject<any>;
  onMouseDown: (e: any) => void;
  onMouseMove: (e: any) => void;
  onMouseUp: (e: any) => void;
  onWheel: (e: any) => void;
}

export default function Whiteboard({
  lines,
  stage,
  stageRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
}: WhiteboardProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onWheel={onWheel}
        scaleX={stage.scale}
        scaleY={stage.scale}
        x={stage.x}
        y={stage.y}
      >
        <Layer>
          <Rect
            width={size.width / stage.scale}
            height={size.height / stage.scale}
            fill="white"
            x={-stage.x / stage.scale}
            y={-stage.y / stage.scale}
          />
          {lines.map(
            (
              line,
              i // 'line' is a LineData object
            ) => (
              <Line
                key={i}
                // FIX 1: Access 'line.points' before flatMap
                points={line.points.flatMap((point) => [point.x, point.y])}
                // FIX 2: Use 'line.color' for stroke
                stroke={line.color}
                strokeWidth={2 / stage.scale}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
              />
            )
          )}
        </Layer>
      </Stage>
    </div>
  );
}
