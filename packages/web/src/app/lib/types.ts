import { type Avatar } from "./avatars";

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

export interface UserProfile {
  id: string;
  username: string;
  avatar: Avatar;
}

export interface Participant {
  id: string;
  profile: UserProfile;
}

export const createLineShape = (
  id: string,
  startPoint: Point,
  color: string,
  strokeWidth: number,
  opacity: number
): LineShape => ({
  id,
  type: "line",
  points: [startPoint],
  color,
  strokeWidth,
  opacity,
});

export const createRectShape = (
  id: string,
  x: number,
  y: number,
  color: string,
  fillColor: string,
  strokeWidth: number,
  opacity: number,
  isFilled: boolean
): RectShape => ({
  id,
  type: "rect",
  x,
  y,
  width: 0,
  height: 0,
  color,
  fillColor,
  strokeWidth,
  opacity,
  rotation: 0,
  isFilled,
});

export const createCircleShape = (
  id: string,
  x: number,
  y: number,
  color: string,
  fillColor: string,
  strokeWidth: number,
  opacity: number,
  isFilled: boolean
): CircleShape => ({
  id,
  type: "circle",
  x,
  y,
  radius: 0,
  color,
  fillColor,
  strokeWidth,
  opacity,
  rotation: 0,
  isFilled,
});

export const createTextShape = (
  id: string,
  x: number,
  y: number,
  color: string,
  fontSize: number = 24,
  fontFamily: string = "JetBrains Mono, monospace",
  fontWeight: number,
  opacity: number = 1
): TextShape => ({
  id,
  type: "text",
  x,
  y,
  text: "Double-Click to Edit",
  fontSize,
  fontFamily,
  fontWeight,
  color,
  rotation: 0,
  opacity,
  width: 400,
  height: fontSize * 1.5,
});
