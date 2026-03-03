import { getSession, getSessionExpiry } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { fetchWeatherData } from '@/lib/weather';
import WeatherDisplay from '@/components/weather/WeatherDisplay';
import SessionTimer from '@/components/SessionTimer';
import LogoutButton from '@/components/LogoutButton';
import UnreadBadges from '@/components/UnreadBadges';

export default async function WeatherPage() {
  const session = await getSession();
  if (!session) redirect('/');
  if (session.role !== 'admin' && !session.allowedSections?.includes('weather')) redirect('/dashboard');

  const sessionExpiry = await getSessionExpiry();

  let weather;
  let error = false;

  try {
    weather = await fetchWeatherData();
  } catch {
    error = true;
  }

  return (
    <div className="min-h-screen bg-fw-bg">
      <header className="bg-fw-surface border-b border-fw-surface sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-fw-text/50 hover:text-fw-text/80 transition p-2 -m-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/dashboard">
              <img src="/PBLogo.png" alt="Pepperberry" className="w-7 h-7 object-contain" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg font-medium text-fw-text truncate">Weather</h1>
              {weather && (
                <p className="text-xs text-fw-text/50">
                  Weather at Coolangatta NSW &middot; Updated {new Date(weather.fetchedAt).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Australia/Sydney' })}
                </p>
              )}
            </div>
          </div>
          <div className="flex-1" />
          <div className="text-right">
            <p className="text-sm font-medium text-fw-text hidden sm:block">{session.name}</p>
            {sessionExpiry && <SessionTimer expiresAt={sessionExpiry} />}
          </div>
          <UnreadBadges />
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6">
        {error || !weather ? (
          <div className="bg-fw-surface rounded-xl border border-fw-surface p-8 text-center">
            <svg
              className="w-12 h-12 mx-auto text-fw-text/30 mb-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <p className="text-sm font-medium text-fw-text/80 mb-1">Weather data unavailable</p>
            <p className="text-xs text-fw-text/50">Please try again later.</p>
          </div>
        ) : (
          <WeatherDisplay data={weather} />
        )}
      </main>
    </div>
  );
}
