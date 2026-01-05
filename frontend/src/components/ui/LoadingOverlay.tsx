import React from 'react';

type LoadingOverlayProps = {
  visible?: boolean;
  message?: string;
};

export default function LoadingOverlay({ visible = false, message }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      aria-live="polite"
      role="status"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="relative flex items-center justify-center">
          <svg
            className="w-24 h-24 text-emerald-500 animate-spin"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeOpacity="0.12" strokeWidth="6" />
            <path
              d="M45 20c-6.5 2.5-9 8-10 11-1.2 3-3 6-6 8-3 2-6.5 1.5-9 0 2.5 0 6-1 8-3 3-3 4.8-6.8 6-10 1-2.6 3.6-6 7-8 3-2 6-2.5 9-1z"
              fill="currentColor"
              opacity="0.9"
            />
            <path d="M20 44c6.5-2.5 9-8 10-11 1.2-3 3-6 6-8 3-2 6.5-1.5 9 0-2.5 0-6 1-8 3-3 3-4.8 6.8-6 10-1 2.6-3.6 6-7 8-3 2-6 2.5-9 1z" fill="currentColor" opacity="0.6" />
          </svg>
        </div>

        <div className="text-white text-center text-lg font-medium drop-shadow">{message ?? 'Chargement en cours...'}</div>

        <div className="mt-2 text-sm text-white/70 max-w-xs text-center">Patientez quelques instants </div>
      </div>
    </div>
  );
}
