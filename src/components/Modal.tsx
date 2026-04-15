"use client";

import { useEffect, useRef } from "react";

type ModalSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export default function Modal({
  title,
  onClose,
  size = "lg",
  children,
}: {
  title: string;
  onClose: () => void;
  size?: ModalSize;
  children: React.ReactNode;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-16">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className={`relative w-full ${SIZE_CLASS[size]} rounded-3xl bg-zinc-900 shadow-2xl ring-1 ring-white/10`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/8">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-400 hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Shared sub-components ──────────────────────────────────────────────────

export function ModalFooter({
  submitLabel,
  pendingLabel,
  isPending,
  onCancel,
}: {
  submitLabel: string;
  pendingLabel: string;
  isPending: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex gap-3 pt-1">
      <button
        type="submit"
        disabled={isPending}
        className="flex-1 rounded-xl bg-white/15 py-2.5 text-sm font-semibold hover:bg-white/20 disabled:opacity-50 transition-colors"
      >
        {isPending ? pendingLabel : submitLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl bg-black/30 px-5 py-2.5 text-sm text-zinc-400 ring-1 ring-white/10 hover:bg-white/8 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

export function ModalInput({
  value,
  onChange,
  placeholder,
  autoFocus,
  error,
  type = "text",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  error?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        type={type}
        className={`w-full rounded-xl bg-black/40 px-4 py-3 text-base outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30 placeholder:text-zinc-500 ${className}`}
      />
      {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
    </div>
  );
}

export function ModalFieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
      {children}
    </label>
  );
}

export function ModalToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T | null) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(value === opt.value ? null : opt.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
            value === opt.value
              ? "bg-white/15 text-white ring-white/30"
              : "bg-black/30 text-zinc-400 ring-white/10 hover:bg-white/8 hover:text-zinc-200"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ColorPicker({
  options,
  value,
  onChange,
}: {
  options: { value: string; swatch: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500">Color</span>
      {options.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(c.value)}
          title={c.value}
          className={`h-6 w-6 rounded-full ${c.swatch} transition-all ${
            value === c.value
              ? "ring-2 ring-white ring-offset-1 ring-offset-zinc-900 opacity-100"
              : "opacity-50 hover:opacity-80"
          }`}
        />
      ))}
    </div>
  );
}
