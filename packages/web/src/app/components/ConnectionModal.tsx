import React from "react";

interface ConnectionModalProps {
  loading: boolean;
  message?: string;
}

const spinner = (
  <svg className="animate-spin h-10 w-10 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

export const ConnectionModal: React.FC<ConnectionModalProps> = ({ loading, message }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm select-none">
    <div className="bg-gradient-to-br from-cyan-900/90 to-black/90 border-2 border-cyan-400/40 rounded-2xl shadow-2xl px-10 py-12 flex flex-col items-center gap-6 min-w-[320px] max-w-xs">
      {loading ? (
        <>
          {spinner}
          <div className="text-cyan-200 text-lg font-semibold mt-2">Waking up the server...</div>
        </>
      ) : (
        <>
          <svg className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div className="text-green-300 text-lg font-semibold mt-2">Connected! The board is ready.</div>
        </>
      )}
      {message && <div className="text-cyan-100 text-sm mt-2 text-center">{message}</div>}
    </div>
  </div>
);
