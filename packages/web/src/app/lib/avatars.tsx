import React from "react";
import {
  FaRobot,
  FaUserAstronaut,
  FaRocket,
  FaGem,
  FaAtom,
  FaUser, // Fallback icon
} from "react-icons/fa";

// Avatar presets remain the same
export const AVATAR_PRESETS = ["robot", "alien", "rocket", "gem", "atom"];

// Avatar type remains the same
export type Avatar = (typeof AVATAR_PRESETS)[number];

// --- SIMPLIFICATION ---
// 1. Define an icon map
// This maps the string from AVATAR_PRESETS directly to the icon component
const AVATAR_ICON_MAP: Record<string, React.ElementType> = {
  robot: FaRobot,
  alien: FaUserAstronaut,
  rocket: FaRocket,
  gem: FaGem,
  atom: FaAtom,
};

// Props interface remains the same
interface AvatarIconProps {
  avatar: Avatar | string;
  className?: string;
}

// --- SIMPLIFICATION ---
// 2. Simplified AvatarIcon component
export const AvatarIcon: React.FC<AvatarIconProps> = ({
  avatar,
  className = "",
}) => {
  // Get the Icon component from the map, or use FaUser as a fallback
  const IconComponent = AVATAR_ICON_MAP[avatar] || FaUser;

  // Pass props directly to the chosen component
  return <IconComponent className={className} aria-hidden="true" />;
};
// --- END SIMPLIFICATION ---
