
import React from "react";

interface ConnectionModalProps {
  loading: boolean;
  message?: string;
}

const spinner = (
  <svg className="animate-spin h-6 w-6 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

export const ConnectionModal: React.FC<ConnectionModalProps> = ({ loading, message }) => (
  <div className=" top-6 right-6 z-[200] flex flex-col items-end pointer-events-none select-none">
    <div className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border transition-all duration-300
      ${loading
        ? "bg-cyan-900/90 border-cyan-400/40 text-cyan-100"
        : "bg-green-900/90 border-green-400/40 text-green-100"
      }
      min-w-[220px] max-w-xs animate-fade-in`}
    >
      {loading ? (
        <>
          {spinner}
          <span className="font-semibold">Waking up the server...</span>
        </>
      ) : (
        <>
          <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-semibold">Connected! The board is ready.</span>
        </>
      )}
    </div>
    {message && <div className="text-cyan-100 text-xs mt-2 text-right max-w-xs">{message}</div>}
  </div>
);
