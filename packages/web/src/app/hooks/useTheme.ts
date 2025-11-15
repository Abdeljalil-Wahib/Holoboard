"use client";

import { useState, useEffect } from "react";

export type Theme = "holographic" | "light";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("holographic");

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("holoboard-theme") as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Save theme to localStorage when it changes
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "holographic" ? "light" : "holographic";
      localStorage.setItem("holoboard-theme", newTheme);
      return newTheme;
    });
  };

  return { theme, toggleTheme };
}
