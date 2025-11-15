"use client";

import React, { useRef, useEffect } from "react";
import { Text } from "react-konva";
import { TextShape } from "../lib/types";
import { TOOLS } from "../lib/tools";
import type Konva from "konva";

interface EditableTextProps extends Omit<React.ComponentProps<typeof import('react-konva').Text>, 'shape'> {
  shape: TextShape;
  isEditing: boolean;
  isSelected: boolean;
  activeTool: import("../lib/tools").Tool;
  onShapeChange?: (shape: TextShape) => void;
}

// This is your original font loader

const EditableText: React.FC<EditableTextProps> = ({
  shape,
  isEditing,
  isSelected,
  activeTool,
  onShapeChange,
  ...rest
}) => {
  const textRef = useRef<Konva.Text>(null);
  const isDraggable = isSelected && activeTool === TOOLS.SELECT;
  const lastTapTimeRef = useRef<number>(0);
  const tapTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (textRef.current) {
      textRef.current.getLayer()?.batchDraw();
    }
  }, [shape.fontWeight, shape.text, shape.fontFamily]);

  const mapWeightToFontStyle = (weight: string | number) => {
    const lw = String(weight).toLowerCase();
    if (lw === "bold" || lw === "700") return "bold";
    if (lw === "semibold" || lw === "600") return "italic";
    return "normal";
  };
  // --- END FIX ---

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (onShapeChange) {
      const node = e.target;
      const updatedShape: TextShape = {
        ...shape,
        x: node.x(),
        y: node.y(),
      };
      onShapeChange(updatedShape);
    }
  };

  const handleTap = (e: Konva.KonvaEventObject<TouchEvent>) => {
    // Handle double-tap for mobile text editing
    const currentTime = Date.now();
    const timeSinceLastTap = currentTime - lastTapTimeRef.current;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected - trigger the onDblClick handler from rest props
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      if (rest.onDblClick) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rest.onDblClick(e as any);
      }
      lastTapTimeRef.current = 0;
    } else {
      // First tap
      lastTapTimeRef.current = currentTime;
      tapTimeoutRef.current = window.setTimeout(() => {
        lastTapTimeRef.current = 0;
      }, 300) as unknown as number;
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  if (isEditing) return null;

  return (
    <Text
      ref={textRef}
      id={shape.id}
      x={shape.x}
      y={shape.y}
      text={shape.text}
      opacity={shape.opacity}
      fontSize={shape.fontSize}
      fontFamily={shape.fontFamily}
      fontStyle={mapWeightToFontStyle(shape.fontWeight)}
      fill={shape.color}
      rotation={shape.rotation}
      draggable={isDraggable}
      onDragEnd={handleDragEnd}
      onTap={handleTap}
      width={shape.width}
      height={shape.height}
      wrap="char"
      {...rest}
    />
  );
};

export default EditableText;
