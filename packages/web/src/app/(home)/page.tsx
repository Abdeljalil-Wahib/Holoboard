"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "../hooks/useUser";
import { AVATAR_PRESETS, AvatarIcon } from "../lib/avatars";
import { useRoomHistory } from "../hooks/useRoomHistory";
import RoomHistoryCard from "../components/RoomHistoryCard";
import { FaSpinner } from "react-icons/fa";

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [roomName, setRoomName] = useState("");

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
    if (!roomName.trim() || !user || !user.username.trim()) return;

    saveUser(user);

    const slug = roomName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    addRoomToHistory({ name: roomName, slug });

    router.push(`/board/${slug}`);
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
    <main className="flex min-h-screen flex-col items-center justify-center p-4 hero-background overflow-hidden">
      <div className="text-center space-y-3 mb-6">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-purple-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
          Holoboard
        </h1>
        <p className="text-base md:text-lg text-cyan-100/70 max-w-2xl">
          The holographic canvas for your team&apos;s ideas. Create a board,
          share the link, and collaborate in real-time.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-stretch justify-center gap-6 w-full max-w-5xl">
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
              onChange={(e) => saveUser({ ...user, username: e.target.value })}
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

          <button
            type="submit"
            className="w-full mt-1 px-6 py-3 bg-gradient-to-r from-cyan-400 to-cyan-500 text-black font-bold text-base rounded-lg shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:from-cyan-300 hover:to-cyan-400 hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
            disabled={!roomName.trim() || !user.username.trim()}
          >
            Create or Join
          </button>
        </form>
        <RoomHistoryCard
          rooms={rooms}
          togglePin={togglePin}
          isLoading={isHistoryLoading}
          clearHistory={clearHistory}
        />
      </div>
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
