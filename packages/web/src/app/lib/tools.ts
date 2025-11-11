export const TOOLS = {
  SELECT: "Select",
  PEN: `Pen`,
  ERASER: "Eraser",
  RECTANGLE: "Rectangle",
  CIRCLE: "Circle",
  LINE: "Line",
  TEXT: "Text"
} as const;

export type Tool = (typeof TOOLS)[keyof typeof TOOLS];
