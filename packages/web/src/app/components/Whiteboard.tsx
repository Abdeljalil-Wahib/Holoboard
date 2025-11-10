"use client";

import { useRef, useEffect, useState } from "react";
import {
  Stage,
  Layer,
  Line,
  Rect,
  Transformer,
  Circle,
  Group,
  Text,
} from "react-konva";
import Konva from "konva";
import {
  LineShape,
  RectShape,
  CircleShape,
  Shape,
  TextShape,
  UserProfile,
} from "../lib/types";
import EditableText from "./EditableText";
import { TOOLS } from "../lib/tools";
import { AvatarIcon } from "../lib/avatars";

interface StageState {
  scale: number;
  x: number;
  y: number;
}

interface MarqueeState {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
}

interface WhiteboardProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  shapes: Shape[];
  stage: StageState;
  onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  selectedShapeIds: string[];
  onSelectShape: (id: string | null, isMultiSelect?: boolean) => void;
  onTransformEnd: (transformedShape: Shape) => void;
  activeTool: import("../lib/tools").Tool;
  marquee: MarqueeState;
  onTextDblClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  editTextId: string | null;
  onStageDblClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  shadowBlur: number;
  remoteCursors: Record<string, { x: number; y: number; user: UserProfile }>;
  eraserPosition: { x: number; y: number } | null;
  eraserRadius: number;
}

export default function Whiteboard({
  shapes,
  stage,
  stageRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  selectedShapeIds,
  onTransformEnd,
  activeTool,
  marquee,
  onTextDblClick,
  editTextId,
  onStageDblClick,
  shadowBlur,
  remoteCursors,
  eraserPosition,
  eraserRadius,
}: WhiteboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const trRef = useRef<Konva.Transformer | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);

  useEffect(() => {
    if (!trRef.current || !layerRef.current) return;

    const selectedShapes = shapes.filter((s) =>
      selectedShapeIds.includes(s.id)
    );
    const nodesToAttach = selectedShapes
      .filter((shape) =>
        shape.type === "text" ? activeTool === TOOLS.SELECT : true
      )
      .map((shape) => layerRef.current!.findOne(`#${shape.id}`))
      .filter(
        (node): node is Konva.Node =>
          !!node && node.name() !== "transformer" && node.id() !== "background"
      );

    trRef.current.nodes(nodesToAttach);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedShapeIds, activeTool, shapes]);

  useEffect(() => {
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

  const updateAllShapesState = () => {
    const nodes = trRef.current?.nodes() || [];
    nodes.forEach((node) => {
      const shape = shapes.find((s) => s.id === node.id());
      if (!shape) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      let updated: Shape = { ...shape };

      if (shape.type === "line") {
        updated = { ...shape };
      } else if (shape.type === "rect") {
        updated = {
          ...shape,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
        } as RectShape;
      } else if (shape.type === "circle") {
        updated = {
          ...shape,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          radius: Math.max(5, (node.width() * scaleX) / 2),
        } as CircleShape;
      } else if (shape.type === "text") {
        updated = {
          ...shape,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
        } as TextShape;
      }

      node.scaleX(1);
      node.scaleY(1);
      onTransformEnd(updated);
    });
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ cursor: activeTool === TOOLS.ERASER ? "none" : "default" }}
    >
      <Stage
        width={size.width}
        height={size.height}
        scaleX={stage.scale}
        scaleY={stage.scale}
        x={stage.x}
        y={stage.y}
        ref={stageRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTouchStart={(e) => onMouseDown(e as any)}
        onTouchMove={(e) => onMouseMove(e as any)}
        onTouchEnd={(e) => onMouseUp(e as any)}
        onWheel={onWheel}
        onDblClick={onStageDblClick}
        draggable={false}
      >
        <Layer ref={layerRef} name="main-layer">
          <Rect
            id="background"
            x={-10000}
            y={-10000}
            width={20000}
            height={20000}
            fill="transparent"
          />

          {shapes.map((shape) => {
            const isSelected = selectedShapeIds.includes(shape.id);
            const commonShadow = {
              shadowColor: shape.color,
              shadowBlur,
              shadowOpacity: 1,
              shadowOffsetX: 0,
              shadowOffsetY: 0,
            };

            switch (shape.type) {
              case "line": {
                const line = shape as LineShape;
                if (line.points.length <= 1) return null;
                return (
                  <Line
                    key={line.id}
                    id={line.id}
                    points={line.points.flatMap((p) => [p.x, p.y])}
                    stroke={line.color}
                    strokeWidth={line.strokeWidth}
                    opacity={line.opacity}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    draggable={isSelected}
                    {...commonShadow}
                  />
                );
              }
              case "rect": {
                const rect = shape as RectShape;
                if (rect.width === 0 || rect.height === 0) return null;
                return (
                  <Rect
                    key={rect.id}
                    id={rect.id}
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                    fill={rect.isFilled ? rect.fillColor : "transparent"}
                    stroke={rect.color}
                    strokeWidth={rect.strokeWidth}
                    opacity={rect.opacity}
                    rotation={rect.rotation}
                    draggable={isSelected}
                    offsetX={rect.width / 2}
                    offsetY={rect.height / 2}
                    {...commonShadow}
                  />
                );
              }
              case "circle": {
                const circle = shape as CircleShape;
                if (circle.radius === 0) return null;
                return (
                  <Circle
                    key={circle.id}
                    id={circle.id}
                    x={circle.x}
                    y={circle.y}
                    radius={circle.radius}
                    fill={circle.isFilled ? circle.fillColor : "transparent"}
                    stroke={circle.color}
                    strokeWidth={circle.strokeWidth}
                    opacity={circle.opacity}
                    draggable={isSelected}
                    rotation={circle.rotation}
                    {...commonShadow}
                  />
                );
              }
              case "text": {
                const textShape = shape as TextShape;
                return (
                  <EditableText
                    key={textShape.id}
                    shape={textShape}
                    isEditing={textShape.id === editTextId}
                    isSelected={isSelected}
                    activeTool={activeTool}
                    onMouseDown={onMouseDown}
                    onDblClick={onTextDblClick}
                    onShapeChange={onTransformEnd}
                    {...commonShadow}
                  />
                );
              }
              default:
                return null;
            }
          })}

          <Transformer
            ref={trRef}
            name="transformer"
            boundBoxFunc={(oldBox, newBox) =>
              newBox.width < 5 || newBox.height < 5 ? oldBox : newBox
            }
            onTransformEnd={updateAllShapesState}
          />

          {marquee.active && (
            <Rect
              x={marquee.x}
              y={marquee.y}
              width={marquee.width}
              height={marquee.height}
              stroke="#67e8f9"
              strokeWidth={1 / stage.scale}
              dash={[4 / stage.scale, 2 / stage.scale]}
              fill="rgba(103, 232, 249, 0.1)"
              listening={false}
            />
          )}

          {/* Eraser circle indicator */}
          {eraserPosition && activeTool === TOOLS.ERASER && (
            <Circle
              x={eraserPosition.x}
              y={eraserPosition.y}
              radius={eraserRadius}
              stroke="#ff006e"
              strokeWidth={2 / stage.scale}
              fill="rgba(255, 0, 110, 0.1)"
              listening={false}
              dash={[4 / stage.scale, 4 / stage.scale]}
            />
          )}

          {/* Render remote cursors as user avatars only */}
          {Object.entries(remoteCursors).map(([userId, cursor]) => (
            <Text
              key={userId}
              x={cursor.x}
              y={cursor.y}
              text={String.fromCodePoint(
                cursor.user.avatar === "robot"
                  ? 0x1f916
                  : cursor.user.avatar === "alien"
                  ? 0x1f47d
                  : cursor.user.avatar === "rocket"
                  ? 0x1f680
                  : cursor.user.avatar === "gem"
                  ? 0x1f48e
                  : cursor.user.avatar === "atom"
                  ? 0x269b
                  : 0x1f916
              )}
              fontSize={28 / stage.scale}
              listening={false}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
