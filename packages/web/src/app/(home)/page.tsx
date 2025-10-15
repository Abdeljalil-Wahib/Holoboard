// src/app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");

  const handleJoinRoom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    const slug = roomName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    router.push(`/board/${slug}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 hero-background">
      <div className="text-center space-y-6">
        <h1 className="text-5xl md:text-7xl font-bold text-accent">
          Holoboard
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 max-w-2xl">
          The holographic canvas for your team's ideas. Create a board, share
          the link, and collaborate in real-time.
        </p>
        <form
          onSubmit={handleJoinRoom}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Enter a room name..."
            className="px-6 py-4 bg-background border border-foreground/30 rounded-lg text-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-4 bg-accent text-white font-bold text-lg rounded-lg shadow-[0_0_15px_rgba(88,166,255,0.6)] hover:bg-accent-hover hover:shadow-[0_0_25px_rgba(128,185,255,0.8)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!roomName.trim()}
          >
            Create or Join
          </button>
        </form>
      </div>
    </main>
  );
}