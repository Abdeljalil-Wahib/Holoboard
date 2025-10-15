// src/app/board/[roomId]/page.tsx
"use client";

import { useEffect, useState, useRef, use } from "react";
import io, { Socket } from "socket.io-client";
import dynamic from "next/dynamic";
import { HexColorPicker } from "react-colorful";
import { TOOLS, Tool } from "../../lib/tools";

const Whiteboard = dynamic(() => import("../../components/Whiteboard"), {
  ssr: false,
});

interface Point {
  x: number;
  y: number;
}

interface LineData {
  points: Point[];
  color: string;
}

interface StageState {
  scale: number;
  x: number;
  y: number;
}

export default function BoardPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params) as { roomId: string };
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lines, setLines] = useState<LineData[]>([]);
  const [stage, setStage] = useState<StageState>({ scale: 1, x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#58A6FF"); // Default color
  const [currentTool, setCurrentTool] = useState<Tool>(TOOLS.PEN);
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });
  const stageRef = useRef<any>(null);

  // --- Socket connection and event listeners ---
  useEffect(() => {
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);
    newSocket.on("connect", () => newSocket.emit("join-room", roomId));
    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    if (!socket) return;

    // Correct: handleCanvasState now expects LineData[] from the server directly
    const handleCanvasState = (linesHistory: LineData[]) => {
      setLines(linesHistory);
    };

    const handleDraw = (data: Point) => {
      setLines((prev) => {
        const newLines = [...prev];
        if (newLines.length > 0) {
          newLines[newLines.length - 1].points.push(data);
        }
        return newLines;
      });
    };

    // Correct: handleStartDrawing now expects LineData (which includes color and points) from the server.
    const handleStartDrawing = (data: LineData) => {
      setLines((prev) => [...prev, data]);
    };

    const handleClear = () => setLines([]);

    socket.on("canvas-state", handleCanvasState);
    socket.on("start-drawing", handleStartDrawing);
    socket.on("drawing", handleDraw);
    socket.on("clear", handleClear);

    return () => {
      socket.off("canvas-state", handleCanvasState);
      socket.off("drawing", handleDraw);
      socket.off("start-drawing", handleStartDrawing);
      socket.off("clear", handleClear);
    };
  }, [socket]);
  // -----------------------------------------

  // Panning Effect
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: globalThis.KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsSpacePressed(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const stageEl = stageRef.current?.getStage()?.container();
    if (stageEl) {
      if (isSpacePressed) {
        stageEl.style.cursor = "grab";
      } else {
        stageEl.style.cursor = "default";
      }
    }
  }, [isSpacePressed]);

  // This helper function correctly translates screen coordinates to canvas coordinates
  const getRelativePointerPosition = () => {
    if (!stageRef.current) return { x: 0, y: 0 };
    const transform = stageRef.current.getAbsoluteTransform().copy();
    transform.invert();
    const pos = stageRef.current.getStage().getPointerPosition();
    return transform.point(pos);
  };

  const handleMouseDown = (e: any) => {
    if (isSpacePressed) {
      isPanning.current = true;
      lastPanPoint.current = e.target.getStage().getPointerPosition();
      const stageEl = stageRef.current?.getStage()?.container();
      if (stageEl) stageEl.style.cursor = "grabbing";
      return;
    }

    isDrawing.current = true;
    const pos = getRelativePointerPosition();
    const newLine: LineData = { points: [pos], color: strokeColor }; // Correct: Create a new line with the current color
    setLines((prevLines) => [...prevLines, newLine]); // Correct: Push the complete LineData object
    socket?.emit("start-drawing", { ...newLine, roomId }); // Correct: Emit the full LineData, including color
  };

  const handleMouseMove = (e: any) => {
    if (isPanning.current && isSpacePressed) {
      const stage = e.target.getStage();
      const newPos = stage.getPointerPosition();
      const dx = newPos.x - lastPanPoint.current.x;
      const dy = newPos.y - lastPanPoint.current.y;

      setStage((prevStage) => ({
        ...prevStage,
        x: prevStage.x + dx,
        y: prevStage.y + dy,
      }));

      lastPanPoint.current = newPos;
      return;
    }

    if (!isDrawing.current) return;
    const pos = getRelativePointerPosition();
    setLines((prevLines) => {
      const newLines = [...prevLines];
      if (newLines.length > 0) {
        newLines[newLines.length - 1].points.push(pos); // Correct: push into points array of the last LineData object
      }
      return newLines;
    });
    // For drawing updates, we only need to send the new point, not the full line object again
    socket?.emit("drawing", { ...pos, roomId });
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    isPanning.current = false;

    if (isSpacePressed) {
      const stageEl = stageRef.current?.getStage()?.container();
      if (stageEl) stageEl.style.cursor = "grab";
    }

    socket?.emit("finish-drawing", { roomId });
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
    };
    const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    setStage({
      scale: newScale,
      x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
      y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
    });
  };

  const handleClear = () => {
    if (!socket) return;
    socket.emit("clear", { roomId });
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <div className="p-2 text-center text-sm text-foreground/80 border-b border-foreground/20">
        Room: <span className="font-bold text-accent">{roomId}</span>
      </div>
      <div className="flex flex-1">
        {/* MODIFIED: Changed w-16 to w-48 */}
        <div className="w-48 bg-background/50 border-r border-foreground/20 p-2 flex flex-col items-center space-y-4 pt-4">
          {/* This could be a static 'Pen Tool' button, or change to reflect the current tool */}
          <div
            title="Pen Tool"
            className="w-10 h-10 bg-accent rounded-md flex items-center justify-center text-background font-bold cursor-pointer shadow-[0_0_10px_rgba(88,166,255,0.5)]"
          >
            P
          </div>

          {/* NEW DIVIDER */}
          <div className="pt-4 border-t border-foreground/20 w-full" />

          {/* THIS IS WHERE YOUR NEW CONDITIONAL RENDERING LOGIC GOES */}
          {currentTool === TOOLS.PEN && (
            <div className="text-center w-full">
              <p className="text-sm text-foreground/80">Pen Options</p>
              {/* The HexColorPicker will go here later */}
            </div>
          )}

          {currentTool === TOOLS.ERASER && (
            <div className="text-center w-full">
              <p className="text-sm text-foreground/80">Eraser Options</p>
              {/* Eraser size slider will go here later */}
            </div>
          )}
          {/* Other tool options will follow this pattern */}
        </div>

        <main className="flex-1 bg-[#0a0a0a]">
          <Whiteboard
            stageRef={stageRef}
            lines={lines}
            stage={stage}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
          />
        </main>
      </div>
    </div>
  );
}
