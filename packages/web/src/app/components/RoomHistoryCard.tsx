"use client";

import { useRouter } from "next/navigation";
import { RoomHistoryEntry } from "../hooks/useRoomHistory";
import { FaStar, FaRegStar, FaSignInAlt, FaTrash } from "react-icons/fa";
import { useState } from "react";

interface RoomHistoryCardProps {
  rooms: RoomHistoryEntry[];
  togglePin: (slug: string) => void;
  isLoading: boolean;
  clearHistory: () => void;
  className?: string;
}

export default function RoomHistoryCard({
  rooms,
  togglePin,
  isLoading,
  clearHistory,
  className = "",
}: RoomHistoryCardProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleJoin = (slug: string) => {
    router.push(`/board/${slug}`);
  };

  const handleClearClick = () => {
    clearHistory();
    setShowConfirm(false);
  };

  const handleCancelClear = () => {
    setShowConfirm(false);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center text-cyan-100/70">Loading history...</div>
      );
    }

    if (rooms.length === 0) {
      return (
        <div className="text-center text-cyan-100/70">
          Your recent Boards will appear here.
        </div>
      );
    }

    return rooms.map((room) => (
      <div
        key={room.slug}
        className="flex items-center justify-between gap-2 p-2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg border border-cyan-400/20 hover:border-cyan-400/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all"
      >
        <div className="flex-1 min-w-0">
          <p
            className="text-base font-semibold text-cyan-100 truncate"
            title={room.name}
          >
            {room.name}
          </p>
        </div>

        <div className="flex-shrink-0 flex items-center gap-1">
          <button
            onClick={() => togglePin(room.slug)}
            title={room.isPinned ? "Unpin room" : "Pin room"}
            className="p-1.5 text-base rounded-full text-cyan-300/70 hover:text-cyan-300 hover:bg-cyan-300/10 hover:shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all"
          >
            {room.isPinned ? <FaStar /> : <FaRegStar />}
          </button>
          <button
            onClick={() => handleJoin(room.slug)}
            title="Join room"
            className="p-1.5 text-base rounded-full text-cyan-300/70 hover:text-cyan-300 hover:bg-cyan-300/10 hover:shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all"
          >
            <FaSignInAlt />
          </button>
        </div>
      </div>
    ));
  };

  return (
    <div
      className={`flex flex-col gap-4 p-6 rounded-2xl
                   bg-black/40
                   border border-cyan-400/30 
                   shadow-[0_0_30px_rgba(6,182,212,0.15)]
                   w-full max-w-md ${className}`}
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-cyan-100/90">Boards</h2>
        {!showConfirm && !isLoading && rooms.length > 0 && (
          <button
            onClick={() => setShowConfirm(true)}
            title="Clear unpinned history"
            className="p-1.5 text-xs rounded-md text-red-400/70 hover:text-red-400 hover:bg-red-400/10 hover:shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-all flex items-center gap-1.5"
          >
            <FaTrash />
            Clear
          </button>
        )}
      </div>

      {/* Confirmation View: Replaces list when confirming */}
      {showConfirm ? (
        <div className="flex flex-col items-center justify-center gap-3 p-3 bg-gradient-to-br from-black/50 to-black/40 rounded-lg border border-cyan-400/20 h-[400px]">
          <p className="text-cyan-100/80 text-center text-sm">
            Clear all unpinned rooms?
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleCancelClear}
              className="px-3 py-1.5 bg-gradient-to-r from-gray-600/80 to-gray-700/80 text-cyan-100 text-sm rounded-md hover:from-gray-500/80 hover:to-gray-600/80 hover:shadow-[0_0_10px_rgba(156,163,175,0.3)] transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleClearClick}
              className="px-3 py-1.5 bg-gradient-to-r from-red-500/80 to-red-600/80 text-white text-sm rounded-md hover:from-red-400/80 hover:to-red-500/80 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all font-semibold"
            >
              Confirm Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 h-[400px] overflow-y-auto pl-1 pr-1 holo-scrollbar">
          {renderContent()}
        </div>
      )}
    </div>
  );
}
