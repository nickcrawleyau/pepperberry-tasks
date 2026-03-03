import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-fw-bg flex items-center justify-center px-5">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-fw-text mb-2">Page not found</h1>
        <p className="text-sm text-fw-text/50 mb-6">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          href="/dashboard"
          className="px-4 py-2.5 rounded-lg bg-fw-accent text-white text-sm font-medium hover:bg-fw-hover transition"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
