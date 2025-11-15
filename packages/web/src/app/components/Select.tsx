"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Theme = "light" | "holo";

type Option<V extends string | number> = {
  label: string;
  value: V;
  style?: React.CSSProperties;
};

interface SelectProps<V extends string | number> {
  value: V;
  options: Option<V>[];
  onChange: (value: V) => void;
  theme: Theme;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
}

export default function Select<V extends string | number>({
  value,
  options,
  onChange,
  theme,
  className,
  buttonClassName,
  menuClassName,
  optionClassName,
}: SelectProps<V>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(() =>
    Math.max(0, options.findIndex((o) => o.value === value))
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (containerRef.current.contains(e.target as Node)) return;
      close();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        buttonRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(options.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const opt = options[activeIndex];
        if (opt) {
          onChange(opt.value);
          close();
          buttonRef.current?.focus();
        }
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [close, onChange, open, options, activeIndex]);

  useEffect(() => {
    // Keep activeIndex aligned with selected value when value changes externally
    const idx = options.findIndex((o) => o.value === value);
    if (idx >= 0) setActiveIndex(idx);
  }, [options, value]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index='${activeIndex}']`);
    el?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const themeButton =
    theme === "light"
      ? "bg-gray-100 border border-gray-300 text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
      : "bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-400/30 text-cyan-100 hover:from-cyan-500/20 hover:to-purple-500/20 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)] focus:outline-none focus:ring-2 focus:ring-cyan-400/40";

  const themeMenu =
    theme === "light"
      ? "bg-white border border-gray-200 text-gray-800 shadow-lg"
      : "bg-black/80 border border-cyan-400/30 text-cyan-100/90 shadow-[0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-md";

  const themeOptionBase =
    theme === "light"
      ? "hover:bg-gray-200 hover:text-gray-900"
      : "hover:bg-cyan-500/20 hover:text-cyan-100";

  const themeOptionActive =
    theme === "light" ? "bg-gray-100" : "bg-cyan-500/10";

  return (
    <div ref={containerRef} className={["relative", className].filter(Boolean).join(" ")}>
      <button
        ref={buttonRef}
        type="button"
        className={[
          "w-full h-9 rounded-md px-3 pr-8 text-sm text-left flex items-center justify-between transition-all",
          themeButton,
          buttonClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
      >
        <span className="truncate" style={selected?.style}>{selected?.label}</span>
        <svg
          className="w-3 h-3 ml-2 shrink-0 opacity-80"
          viewBox="0 0 12 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          className={[
            "absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md p-1",
            themeMenu,
            menuClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isActive = i === activeIndex;
            return (
              <div
                key={String(opt.value)}
                role="option"
                aria-selected={isSelected}
                data-index={i}
                className={[
                  "flex items-center cursor-pointer rounded-sm px-2 py-1.5 text-sm",
                  isActive ? themeOptionActive : "",
                  themeOptionBase,
                  optionClassName,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(opt.value);
                  close();
                  buttonRef.current?.focus();
                }}
                style={opt.style}
              >
                <span className="truncate flex-1">{opt.label}</span>
                <span className="ml-2 w-4 h-3.5 shrink-0 flex items-center justify-center opacity-80">
                  {isSelected ? (
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden
                    >
                      <path d="M16.7071 5.29289C17.0976 5.68342 17.0976 6.31658 16.7071 6.70711L8.70711 14.7071C8.31658 15.0976 7.68342 15.0976 7.29289 14.7071L3.29289 10.7071C2.90237 10.3166 2.90237 9.68342 3.29289 9.29289C3.68342 8.90237 4.31658 8.90237 4.70711 9.29289L8 12.5858L15.2929 5.29289C15.6834 4.90237 16.3166 4.90237 16.7071 5.29289Z" fill="currentColor"/>
                    </svg>
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
