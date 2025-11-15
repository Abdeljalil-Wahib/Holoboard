"use client";

import { useState, useEffect, useCallback } from 'react';

export interface RoomHistoryEntry {
  name: string;
  slug: string;
  lastAccessed: number;
  isPinned: boolean;
}

const ROOM_HISTORY_KEY = 'whiteboard-room-history';
const MAX_UNPINNED_ROOMS = 20;

const sortHistory = (a: RoomHistoryEntry, b: RoomHistoryEntry) => {
  if (a.isPinned !== b.isPinned) {
    return a.isPinned ? -1 : 1;
  }
  return b.lastAccessed - a.lastAccessed;
};

export const useRoomHistory = () => {
  const [rooms, setRooms] = useState<RoomHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const _saveHistory = useCallback((newHistory: RoomHistoryEntry[]) => {
    try {
      const pinnedRooms = newHistory.filter(r => r.isPinned);
      const unpinnedRooms = newHistory.filter(r => !r.isPinned);

      const sortedUnpinned = unpinnedRooms.sort(
        (a, b) => b.lastAccessed - a.lastAccessed
      );

      const trimmedUnpinned = sortedUnpinned.slice(0, MAX_UNPINNED_ROOMS);
      const finalHistory = [...pinnedRooms, ...trimmedUnpinned];
      const sortedHistory = finalHistory.sort(sortHistory);

      localStorage.setItem(ROOM_HISTORY_KEY, JSON.stringify(sortedHistory));
      setRooms(sortedHistory);
    } catch (error) {
      console.error("Failed to save room history:", error);
    }
  }, []);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(ROOM_HISTORY_KEY);
      if (storedHistory) {
        const loadedHistory = JSON.parse(storedHistory);
        _saveHistory(loadedHistory);
      }
    } catch (error) {
      console.error("Failed to load room history:", error);
    }
    setIsLoading(false);
  }, [_saveHistory]);

  const addRoomToHistory = useCallback((room: { name: string; slug: string }) => {
    setRooms(prevHistory => {
      const existingEntryIndex = prevHistory.findIndex(r => r.slug === room.slug);
      const newHistory = [...prevHistory];
      if (existingEntryIndex > -1) {
        newHistory[existingEntryIndex] = {
          ...newHistory[existingEntryIndex],
          name: room.name,
          lastAccessed: Date.now(),
        };
      } else {
        newHistory.push({
          ...room,
          lastAccessed: Date.now(),
          isPinned: false,
        });
      }
      
      _saveHistory(newHistory);
      return newHistory.sort(sortHistory);
    });
  }, [_saveHistory]);

  const togglePin = useCallback((slug: string) => {
    setRooms(prevHistory => {
      const newHistory = prevHistory.map(room => {
        if (room.slug === slug) {
          return { ...room, isPinned: !room.isPinned };
        }
        return room;
      });
      
      _saveHistory(newHistory);
      return newHistory.sort(sortHistory);
    });
  }, [_saveHistory]);

  const clearHistory = useCallback(() => {
    setRooms(prevHistory => {
      const pinnedRooms = prevHistory.filter(r => r.isPinned);
      _saveHistory(pinnedRooms);
      return pinnedRooms;
    });
  }, [_saveHistory]);
  return { rooms, addRoomToHistory, togglePin, isLoading, clearHistory };
};

