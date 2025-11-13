"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "../hooks/useUser";
import { AVATAR_PRESETS, AvatarIcon } from "../lib/avatars";
import { useRoomHistory } from "../hooks/useRoomHistory";
import RoomHistoryCard from "../components/RoomHistoryCard";
import AnimatedBackground from "../components/AnimatedBackground";
import { FaSpinner } from "react-icons/fa";

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [roomName, setRoomName] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<
    "idle" | "dimming" | "entrance"
  >("idle");

  const { user, saveUser, isLoading: isUserLoading } = useUser();
  const {
    rooms,
    addRoomToHistory,
    togglePin,
    clearHistory,
    isLoading: isHistoryLoading,
  } = useRoomHistory();

  useEffect(() => {
    const initialRoomId = searchParams.get("roomId");
    if (initialRoomId) {
      setRoomName(initialRoomId);
    }
  }, [searchParams]);

  const handleJoinRoom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!roomName.trim() || !user || !user.username.trim()) return;
    if (isTransitioning) return; // Prevent multiple clicks

    saveUser(user);

    const slug = roomName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    addRoomToHistory({ name: roomName, slug });

    // Store password in sessionStorage if provided
    if (usePassword && roomPassword.trim()) {
      sessionStorage.setItem(`room_password_${slug}`, roomPassword);
    }

    // Start transition sequence
    console.log("Starting transition...");
    setIsTransitioning(true);
    setTransitionPhase("dimming");

    // After components fade and lights dim, start entrance animation
    const entranceTimer = setTimeout(() => {
      console.log("Entrance phase...");
      setTransitionPhase("entrance");
    }, 700);

    // Navigate to board after full animation completes
    const navTimer = setTimeout(() => {
      console.log("Navigating to board...");
      router.push(`/board/${slug}`);
    }, 1400);

    // Cleanup on unmount
    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(navTimer);
    };
  };

  const handleJoinFromHistory = (slug: string) => {
    if (isTransitioning) return; // Prevent multiple clicks

    // Start transition sequence
    console.log("Starting transition from history...");
    setIsTransitioning(true);
    setTransitionPhase("dimming");

    // After components fade and lights dim, start entrance animation
    const entranceTimer = setTimeout(() => {
      console.log("Entrance phase...");
      setTransitionPhase("entrance");
    }, 700);

    // Navigate to board after full animation completes
    const navTimer = setTimeout(() => {
      console.log("Navigating to board...");
      router.push(`/board/${slug}`);
    }, 1400);

    // Cleanup on unmount
    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(navTimer);
    };
  };

  if (isUserLoading || isHistoryLoading || !user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 hero-background">
        <FaSpinner className="text-cyan-300 text-5xl animate-spin drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
        <p className="text-cyan-100/70 mt-4">Loading your profile...</p>
      </main>
    );
  }
  const currentUserDisplayName = user.username.split("#")[0];

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 pb-24 hero-background overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-6xl py-8">
        <div
          className={`text-center space-y-3 mb-6 ${
            isTransitioning ? "animate-holo-fade" : "animate-fade-in"
          }`}
          style={{ animationDelay: isTransitioning ? "0s" : "0.1s" }}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-purple-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] glitch-text">
            Holoboard
          </h1>
          <p className="text-base md:text-lg text-cyan-100/70 max-w-2xl">
            The holographic canvas for your team&apos;s ideas. Create a board,
            share the link, and collaborate in real-time.
          </p>
        </div>

        <div
          className={`flex flex-col lg:flex-row lg:items-stretch justify-center gap-6 w-full max-w-5xl ${
            isTransitioning ? "animate-holo-fade" : "animate-fade-in"
          }`}
          style={{ animationDelay: isTransitioning ? "0s" : "0.3s" }}
        >
          <form
            onSubmit={handleJoinRoom}
            className="flex flex-col items-center gap-4 p-6 rounded-2xl
                     bg-black/40
                     border border-cyan-400/30 
                     shadow-[0_0_30px_rgba(6,182,212,0.15)]
                     w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-cyan-100/90 relative z-10">
              Set Your Profile
            </h2>

            <div className="h-20 w-20 flex items-center justify-center p-3 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full border-2 border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all relative z-10">
              <AvatarIcon
                avatar={user.avatar}
                className="h-12 w-12 text-cyan-300"
              />
            </div>

            <div className="flex gap-3 relative z-10">
              {AVATAR_PRESETS.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => saveUser({ ...user, avatar })}
                  className={`
                  h-12 w-12 flex items-center justify-center rounded-full transition-all duration-150
                  ${
                    user.avatar === avatar
                      ? "bg-gradient-to-br from-cyan-400 to-cyan-500 text-black scale-110 shadow-[0_0_20px_rgba(6,182,212,0.6)]"
                      : "bg-gradient-to-br from-cyan-500/10 to-purple-500/10 text-cyan-300/70 hover:from-cyan-500/20 hover:to-purple-500/20 hover:text-cyan-300 border border-cyan-400/20"
                  }
                `}
                >
                  <AvatarIcon avatar={avatar} className="h-6 w-6" />
                </button>
              ))}
            </div>
            <div className="w-full relative z-10">
              <label
                htmlFor="username"
                className="block text-xs font-medium text-cyan-100/80 mb-1.5 text-left"
              >
                Your Username
              </label>
              <input
                id="username"
                type="text"
                value={currentUserDisplayName}
                onChange={(e) =>
                  saveUser({ ...user, username: e.target.value })
                }
                placeholder="Enter your username..."
                className="w-full px-4 py-2.5 bg-black/40 border border-cyan-400/30 rounded-lg text-base text-cyan-100 placeholder:text-cyan-100/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400/50"
                maxLength={25}
              />
            </div>
            <div className="w-full relative z-10">
              <label
                htmlFor="roomName"
                className="block text-xs font-medium text-cyan-100/80 mb-1.5 text-left"
              >
                Board Name
              </label>
              <input
                id="roomName"
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter a Board name..."
                className="w-full px-4 py-2.5 bg-black/40 border border-cyan-400/30 rounded-lg text-base text-cyan-100 placeholder:text-cyan-100/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400/50"
              />
            </div>

            <div className="w-full relative z-10">
              <label className="flex items-center gap-2 text-sm text-cyan-100/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usePassword}
                  onChange={(e) => setUsePassword(e.target.checked)}
                  className="w-4 h-4 rounded border-cyan-400/30 bg-black/40 text-cyan-400 focus:ring-cyan-400 focus:ring-offset-0"
                />
                Password
              </label>

              {usePassword && (
                <input
                  type="password"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full mt-2 px-4 py-2.5 bg-black/40 border border-cyan-400/30 rounded-lg text-base text-cyan-100 placeholder:text-cyan-100/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400/50"
                />
              )}
            </div>

            <button
              type="submit"
              className="w-full mt-1 px-6 py-3 bg-gradient-to-r from-cyan-400 to-cyan-500 text-black font-bold text-base rounded-lg shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:from-cyan-300 hover:to-cyan-400 hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
              disabled={
                !roomName.trim() || !user.username.trim() || isTransitioning
              }
            >
              {isTransitioning ? "Connecting..." : "Create or Join"}
            </button>
          </form>
          <RoomHistoryCard
            rooms={rooms}
            togglePin={togglePin}
            isLoading={isHistoryLoading}
            clearHistory={clearHistory}
            onJoinRoom={handleJoinFromHistory}
          />
        </div>
      </div>

      {/* Transition Overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          {/* Sci-fi entrance animation - appears after dimming */}
          {transitionPhase === "entrance" && (
            <div className="absolute inset-0 z-30 animate-board-entrance">
              {/* Radial gradient */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]" />

              {/* Expanding circles/rings */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-32 h-32 rounded-full border-2 border-cyan-400/60 animate-expand-ring-1" />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-32 h-32 rounded-full border-2 border-cyan-400/40 animate-expand-ring-2" />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-32 h-32 rounded-full border-2 border-cyan-400/20 animate-expand-ring-3" />
              </div>

              {/* Enhanced scanning lines */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan-line" />
              <div
                className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-scan-line"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent animate-scan-line"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 py-4 text-center text-cyan-100/50 text-sm border-t border-cyan-400/20 bg-black/40 backdrop-blur-sm">
        <div className="space-y-1">
          <p>
            © {new Date().getFullYear()}{" "}
            <span className="text-cyan-400/80 font-semibold">Holoboard</span>.
            All rights reserved.
          </p>
          <p className="text-xs text-cyan-100/30">
            Built by <span className="text-cyan-400/60">Abdeljalil Wahib</span>
          </p>
        </div>
      </footer>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center p-8 hero-background">
          <FaSpinner className="text-cyan-300 text-5xl animate-spin drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
          <p className="text-cyan-100/70 mt-4">Loading...</p>
        </main>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
