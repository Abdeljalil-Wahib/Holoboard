export const TOOLS = {
  SELECT: "select",
  PEN: `pen`,
  ERASER: "eraser",
  RECTANGLE: "rectangle",
  CIRCLE: "circle",
  LINE: "line",
  TEXT: "text"
} as const;

export type Tool = (typeof TOOLS)[keyof typeof TOOLS];
