export interface Point {
  x: number;
  y: number;
}

export interface LineShape {
  id: string;
  type: "line";
  points: Point[];
  color: string;
  strokeWidth: number;
  opacity: number;
}

export interface RectShape {
  id: string;
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  rotation: number;
  isFilled: boolean;
}

export interface CircleShape {
  id: string;
  type: "circle";
  x: number;
  y: number;
  radius: number;
  color: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  rotation: number;
  isFilled: boolean;
}

export interface TextShape {
  id: string;
  type: "text";
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  fontWeight: number | string;
  fontFamily: string;
  rotation: number;
  width?: number;
  height?: number;
  opacity: number;
}

export type Shape = LineShape | RectShape | CircleShape | TextShape;
