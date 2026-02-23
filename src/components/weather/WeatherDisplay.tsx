'use client';

import { useState } from 'react';
import { WeatherData } from '@/lib/weather';

interface WeatherDisplayProps {
  data: WeatherData;
}

/* ── Weather Icons (inline SVG) ── */

function WeatherIcon({ type, size = 24 }: { type: string; size?: number }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (type) {
    case 'sun':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      );
    case 'cloud-sun':
      return (
        <svg {...props}>
          <path d="M12 2v2m4.93.93l-1.41 1.41M20 12h2M17.66 17.66l1.41 1.41M2 12h2m2.93-7.07l1.41 1.41" />
          <path d="M17.5 21H9a7 7 0 116.71-9h1.79a4.5 4.5 0 110 9z" />
        </svg>
      );
    case 'cloud':
      return (
        <svg {...props}>
          <path d="M17.5 21H9a7 7 0 116.71-9h1.79a4.5 4.5 0 110 9z" />
        </svg>
      );
    case 'drizzle':
      return (
        <svg {...props}>
          <path d="M17.5 17H9a7 7 0 116.71-9h1.79a4.5 4.5 0 110 9z" />
          <path d="M8 21v-1m4 1v-1m4 1v-1" />
        </svg>
      );
    case 'rain':
      return (
        <svg {...props}>
          <path d="M17.5 17H9a7 7 0 116.71-9h1.79a4.5 4.5 0 110 9z" />
          <path d="M8 19v2m4-2v2m4-2v2" />
        </svg>
      );
    case 'rain-heavy':
      return (
        <svg {...props}>
          <path d="M17.5 17H9a7 7 0 116.71-9h1.79a4.5 4.5 0 110 9z" />
          <path d="M7 19v3m4-3v3m4-3v3m4-3v3" />
        </svg>
      );
    case 'storm':
      return (
        <svg {...props}>
          <path d="M17.5 17H9a7 7 0 116.71-9h1.79a4.5 4.5 0 110 9z" />
          <path d="M13 17l-2 5h4l-2 5" />
        </svg>
      );
    case 'fog':
      return (
        <svg {...props}>
          <path d="M4 14h16M4 18h16M4 10h16" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path d="M17.5 21H9a7 7 0 116.71-9h1.79a4.5 4.5 0 110 9z" />
        </svg>
      );
  }
}

/* ── Main Component ── */

export default function WeatherDisplay({ data }: WeatherDisplayProps) {
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  const { current, daily, lastYearDaily, monthlyComparison } = data;

  // Rainfall chart: combine this year + last year for scaling
  const historicalDays = daily.filter((d) => !d.isForecast);
  const allPrecipValues = [
    ...daily.map((d) => d.precipitationSum),
    ...lastYearDaily.map((d) => d.precipitationSum),
  ];
  const maxPrecip = Math.max(...allPrecipValues, 1);
  const totalRainfall30 = historicalDays.reduce((sum, d) => sum + d.precipitationSum, 0);
  const totalRainfallLastYear30 = lastYearDaily
    .slice(-historicalDays.length)
    .reduce((sum, d) => sum + d.precipitationSum, 0);

  // 7-day forecast (future days only)
  const forecast = daily.filter((d) => d.isForecast);

  // Today entry
  const today = historicalDays.at(-1);

  // YTD comparison chart
  const currentYear = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' }).slice(0, 4);
  const lastYearLabel = String(parseInt(currentYear) - 1);
  return (
    <div className="space-y-4">
      {/* Current Conditions */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-semibold text-stone-900">
                {Math.round(current.temperature)}°
              </span>
              <span className="text-stone-400">
                <WeatherIcon type={current.condition.icon} size={32} />
              </span>
            </div>
            <p className="text-sm text-stone-500 mt-1">{current.condition.description}</p>
          </div>
          {today && (
            <div className="text-right text-sm text-stone-500">
              <p>
                <span className="text-stone-900 font-medium">{Math.round(today.temperatureMax)}°</span>
                {' / '}
                <span className="text-stone-400">{Math.round(today.temperatureMin)}°</span>
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-6 mt-4 text-xs text-stone-500">
          <div>
            <span className="text-stone-400">Humidity</span>
            <p className="text-stone-700 font-medium">{current.humidity}%</p>
          </div>
          <div>
            <span className="text-stone-400">Wind</span>
            <p className="text-stone-700 font-medium">{Math.round(current.windSpeed)} km/h</p>
          </div>
          <div>
            <span className="text-stone-400">Rain now</span>
            <p className="text-stone-700 font-medium">{current.precipitation} mm</p>
          </div>
        </div>
        <p className="text-xs text-stone-300 mt-3">
          Updated {new Date(data.fetchedAt).toLocaleTimeString('en-AU', {
            timeZone: 'Australia/Sydney',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* Rain Radar */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <p className="text-xs font-medium text-stone-500 mb-3">Rain Radar — Wollongong 128km</p>
        <div className="relative w-full overflow-hidden rounded-lg bg-stone-100" style={{ aspectRatio: '1 / 1' }}>
          <img
            src="https://radar.weather.gov.au/latest/IDR032.gif"
            alt="Rain radar Wollongong 128km"
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>
        <p className="text-[10px] text-stone-300 mt-2">
          Source: Bureau of Meteorology
        </p>
      </div>

      {/* Rainfall Chart */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <div className="flex items-baseline justify-between mb-1">
          <p className="text-xs font-medium text-stone-500">Rainfall</p>
          <div className="text-xs text-stone-400 text-right">
            <span>30-day: <span className="font-medium text-stone-600">{totalRainfall30.toFixed(1)} mm</span></span>
            {totalRainfallLastYear30 > 0 && (
              <span className="ml-2 text-stone-300">
                (last yr: {totalRainfallLastYear30.toFixed(1)} mm)
              </span>
            )}
          </div>
        </div>

        {/* Bar chart */}
        <div className="mt-3 overflow-x-auto">
          <div className="flex items-end gap-px" style={{ minWidth: '100%', height: 120 }}>
            {daily.map((day, i) => {
              const height = day.precipitationSum > 0
                ? Math.max((day.precipitationSum / maxPrecip) * 100, 4)
                : 0;
              const isToday = !day.isForecast && i === historicalDays.length - 1;

              // Last year comparison bar (aligned by position)
              const lyIndex = i < lastYearDaily.length ? i : -1;
              const lyPrecip = lyIndex >= 0 ? lastYearDaily[lyIndex].precipitationSum : 0;
              const lyHeight = lyPrecip > 0
                ? Math.max((lyPrecip / maxPrecip) * 100, 4)
                : 0;

              return (
                <button
                  key={day.date}
                  type="button"
                  className="flex-1 flex flex-col justify-end items-center relative group"
                  style={{ height: '100%' }}
                  onClick={() => setSelectedBar(selectedBar === i ? null : i)}
                >
                  {/* Today marker line */}
                  {isToday && (
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-stone-400 z-[5]" />
                  )}
                  {/* Tooltip */}
                  {selectedBar === i && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      {formatDateShort(day.date)}: {day.precipitationSum.toFixed(1)} mm
                      {lyPrecip > 0 && ` (LY: ${lyPrecip.toFixed(1)})`}
                    </div>
                  )}
                  {/* Last year bar (faint, behind) */}
                  {lyHeight > 0 && (
                    <div
                      className="absolute bottom-0 w-full rounded-t bg-sky-200/40"
                      style={{ height: `${lyHeight}%`, minHeight: 3 }}
                    />
                  )}
                  {/* Current year bar */}
                  {height > 0 && (
                    <div
                      className={`w-full rounded-t transition-colors relative ${
                        isToday
                          ? 'bg-sky-500'
                          : day.isForecast
                            ? 'bg-sky-300'
                            : 'bg-sky-600'
                      }`}
                      style={{ height: `${height}%`, minHeight: 3 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Date labels */}
          <div className="flex mt-1.5" style={{ minWidth: '100%' }}>
            {daily.map((day, i) => {
              const showLabel = i === 0 || i === daily.length - 1 || i % 7 === 0 ||
                (!day.isForecast && i === historicalDays.length - 1);
              return (
                <div key={day.date} className="flex-1 text-center">
                  {showLabel && (
                    <span className="text-[9px] text-stone-400 leading-none">
                      {formatDateLabel(day.date)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 text-[10px] text-stone-400 flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-sky-600" />
            <span>Recorded</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-sky-300" />
            <span>Forecast</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-sky-200/40 border border-sky-200" />
            <span>Last year</span>
          </div>
        </div>
      </div>

      {/* Year-to-Date Comparison */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <p className="text-xs font-medium text-stone-500 mb-3">Rainfall Year-to-Date</p>
        <div className="flex items-end gap-6">
          <div>
            <p className="text-2xl font-semibold text-stone-900">{data.ytdThisYear} <span className="text-sm font-normal text-stone-400">mm</span></p>
            <p className="text-xs text-stone-400">{currentYear}</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-stone-300">{data.ytdLastYear} <span className="text-sm font-normal text-stone-300">mm</span></p>
            <p className="text-xs text-stone-300">{lastYearLabel}</p>
          </div>
          <div className="ml-auto text-right">
            {data.ytdThisYear !== data.ytdLastYear && (
              <p className={`text-sm font-medium ${data.ytdThisYear > data.ytdLastYear ? 'text-sky-600' : 'text-amber-600'}`}>
                {data.ytdThisYear > data.ytdLastYear ? '+' : ''}{(data.ytdThisYear - data.ytdLastYear).toFixed(1)} mm
              </p>
            )}
            <p className="text-[10px] text-stone-300">
              {data.ytdLastYear > 0
                ? `${Math.round((data.ytdThisYear / data.ytdLastYear) * 100)}% of last year`
                : ''}
            </p>
          </div>
        </div>
        {/* Monthly breakdown */}
        {monthlyComparison.length > 0 && (
          <div className="mt-4 border-t border-stone-100 pt-3">
            <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-xs">
              {monthlyComparison.map((m) => (
                <div key={m.month} className="flex items-baseline justify-between">
                  <span className="text-stone-400">{m.month}</span>
                  <span>
                    <span className="text-stone-700 font-medium">{m.thisYear}</span>
                    <span className="text-stone-300 mx-0.5">/</span>
                    <span className="text-stone-300">{m.lastYear}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 7-Day Forecast */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <p className="text-xs font-medium text-stone-500 mb-3">7-Day Forecast</p>
        <div className="divide-y divide-stone-100">
          {forecast.map((day) => (
            <div key={day.date} className="flex items-center py-2.5 first:pt-0 last:pb-0">
              <span className="text-sm text-stone-700 w-10 shrink-0">
                {formatDayName(day.date)}
              </span>
              <span className="text-stone-400 w-7 shrink-0">
                <WeatherIcon type={day.condition.icon} size={18} />
              </span>
              <span className="text-xs text-stone-400 flex-1 ml-1 truncate">
                {day.condition.description}
              </span>
              <span className="text-sm text-stone-900 font-medium w-8 text-right">
                {Math.round(day.temperatureMax)}°
              </span>
              <span className="text-sm text-stone-400 w-8 text-right">
                {Math.round(day.temperatureMin)}°
              </span>
              <span className={`text-xs w-14 text-right font-medium ${
                day.precipitationSum > 0 ? 'text-sky-600' : 'text-stone-300'
              }`}>
                {day.precipitationSum > 0 ? `${day.precipitationSum.toFixed(1)} mm` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function formatDayName(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { weekday: 'short' });
}
