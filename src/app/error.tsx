'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-fw-bg flex items-center justify-center px-5">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-fw-text mb-2">Something went wrong</h1>
        <p className="text-sm text-fw-text/50 mb-6">An unexpected error occurred.</p>
        <button
          onClick={reset}
          className="px-4 py-2.5 rounded-lg bg-fw-accent text-white text-sm font-medium hover:bg-fw-hover transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
