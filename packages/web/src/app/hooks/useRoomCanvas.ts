"use client";

import { useState, useEffect, useCallback } from "react";
import { Shape } from "../lib/types";

const ROOM_CANVAS_KEY_PREFIX = "holoboard-room-canvas-";

export const useRoomCanvas = (roomId: string) => {
  const [isLoading, setIsLoading] = useState(true);

  // Get canvas state from localStorage
  const getCanvasState = useCallback((): Shape[] => {
    try {
      const key = `${ROOM_CANVAS_KEY_PREFIX}${roomId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      console.error("Failed to load canvas state from localStorage:", error);
      return [];
    }
  }, [roomId]);

  // Save canvas state to localStorage
  const saveCanvasState = useCallback(
    (shapes: Shape[]) => {
      try {
        const key = `${ROOM_CANVAS_KEY_PREFIX}${roomId}`;
        localStorage.setItem(key, JSON.stringify(shapes));
      } catch (error) {
        console.error("Failed to save canvas state to localStorage:", error);
      }
    },
    [roomId]
  );

  // Clear canvas state from localStorage
  const clearCanvasState = useCallback(() => {
    try {
      const key = `${ROOM_CANVAS_KEY_PREFIX}${roomId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Failed to clear canvas state from localStorage:", error);
    }
  }, [roomId]);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  return {
    getCanvasState,
    saveCanvasState,
    clearCanvasState,
    isLoading,
  };
};
