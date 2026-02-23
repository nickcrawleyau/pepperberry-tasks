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

  // Heavy rain warning: any forecast day in next 3 with 20mm+
  const forecast3 = daily.filter((d) => d.isForecast).slice(0, 3);
  const heavyRainDays = forecast3.filter((d) => d.precipitationSum >= 20);

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
      {/* Heavy rain warning */}
      {heavyRainDays.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">Heavy rain forecast</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {heavyRainDays.map((d) => (
                `${formatDayName(d.date)} ${Math.round(d.precipitationSum)} mm`
              )).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Current Conditions */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className={`text-4xl font-semibold ${current.temperature >= 30 ? 'text-red-600' : 'text-stone-900'}`}>
                {Math.round(current.temperature)}°
              </span>
              <span className="text-stone-400">
                <WeatherIcon type={current.condition.icon} size={32} />
              </span>
            </div>
            <p className="text-sm text-stone-500 mt-1">{current.condition.description}</p>
            <p className="text-xs text-stone-400 mt-0.5">{getWeatherSummary(current.temperature, current.windSpeed, current.humidity, current.condition.description)}</p>
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
        <div className="flex gap-5 mt-4 text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400 shrink-0">
              <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
            </svg>
            <span className="text-stone-700 font-medium">{current.humidity}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400 shrink-0">
              <path d="M17.7 7.7a2.5 2.5 0 111.8 4.3H2" />
              <path d="M9.6 4.6A2 2 0 1111 8H2" />
              <path d="M12.6 19.4A2 2 0 1014 16H2" />
            </svg>
            <span className="text-stone-700 font-medium">{Math.round(current.windSpeed)} km/h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500 shrink-0">
              <path d="M4 14.899A7 7 0 1115.71 8h1.79a4.5 4.5 0 012.5 8.242" />
              <path d="M16 14v6m-4-4v6m-4-4v6" />
            </svg>
            <span className="text-stone-700 font-medium">{current.precipitation} mm</span>
          </div>
          {current.seaTemperature !== null && (
            <div className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400 shrink-0">
                <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
              </svg>
              <span className="text-stone-700 font-medium">{Math.round(current.seaTemperature)}°C</span>
            </div>
          )}
        </div>
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
              {day.precipitationProbability != null && day.precipitationProbability > 0 ? (
                <span className="text-[10px] text-sky-500 w-8 text-right">{day.precipitationProbability}%</span>
              ) : (
                <span className="w-8" />
              )}
              <span className={`text-xs w-14 text-right font-medium ${
                day.precipitationSum > 0 ? 'text-sky-600' : 'text-stone-300'
              }`}>
                {day.precipitationSum > 0 ? `${day.precipitationSum.toFixed(1)} mm` : '—'}
              </span>
            </div>
          ))}
        </div>
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

        {/* Bar chart with Y axis */}
        <div className="mt-3 overflow-x-auto">
          <div className="flex">
            {/* Y axis labels */}
            <div className="flex flex-col justify-between shrink-0 pr-1.5" style={{ height: 120 }}>
              <span className="text-[9px] text-stone-400 leading-none">{Math.round(maxPrecip)} mm</span>
              <span className="text-[9px] text-stone-400 leading-none">{Math.round(maxPrecip / 2)}</span>
              <span className="text-[9px] text-stone-400 leading-none">0</span>
            </div>
            {/* Bars */}
            <div className="flex-1">
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

                  const precipLabel = day.precipitationSum >= 10
                    ? Math.round(day.precipitationSum).toString()
                    : day.precipitationSum.toFixed(1);

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
                      {/* Rainfall label for 10mm+ days */}
                      {day.precipitationSum >= 10 && (
                        <span className="text-[8px] text-sky-700 font-medium leading-none mb-0.5">
                          {Math.round(day.precipitationSum)}
                        </span>
                      )}
                      {/* Tooltip */}
                      {selectedBar === i && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                          {formatDateShort(day.date)}: {precipLabel} mm
                          {lyPrecip > 0 && ` (LY: ${lyPrecip >= 10 ? Math.round(lyPrecip) : lyPrecip.toFixed(1)})`}
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

      {/* Rain Radar */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <p className="text-xs font-medium text-stone-500 mb-3">Rain Radar — Wollongong</p>
        <div className="relative w-full overflow-hidden rounded-lg bg-stone-100" style={{ aspectRatio: '4 / 3' }}>
          <iframe
            src="https://embed.windy.com/embed2.html?lat=-34.42&lon=150.87&detailLat=-34.42&detailLon=150.87&width=650&height=450&zoom=8&level=surface&overlay=radar&product=radar&menu=&message=&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1"
            title="Rain radar Wollongong"
            className="absolute inset-0 w-full h-full border-0"
            loading="lazy"
            allowFullScreen
          />
        </div>
        <p className="text-[10px] text-stone-300 mt-2">
          Source: Windy.com / BOM
        </p>
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

function getWeatherSummary(temp: number, wind: number, humidity: number, condition: string): string {
  if (temp >= 35) return 'Extreme heat — stay hydrated and limit outdoor work.';
  if (temp >= 30) return 'Hot conditions — take breaks in the shade.';
  if (condition.toLowerCase().includes('thunder')) return 'Thunderstorms expected — avoid open paddocks.';
  if (condition.toLowerCase().includes('heavy') || condition.toLowerCase().includes('violent')) return 'Heavy rain — muddy conditions likely across paddocks.';
  if (condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('shower')) return 'Wet weather — pack a jacket for outdoor work.';
  if (condition.toLowerCase().includes('fog')) return 'Low visibility — take care on the driveway.';
  if (wind >= 40) return 'Strong winds — secure loose items around the property.';
  if (temp <= 5) return 'Cold morning — check water troughs for frost.';
  if (humidity >= 85 && temp >= 25) return 'Warm and humid — drink plenty of water.';
  if (condition.toLowerCase().includes('clear') || condition.toLowerCase().includes('sunny')) return 'Fine conditions — good day for outdoor work.';
  return 'Mild conditions across the property.';
}
