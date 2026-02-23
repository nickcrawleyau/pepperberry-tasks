const LATITUDE = -34.77;
const LONGITUDE = 150.69;
const TIMEZONE = 'Australia/Sydney';

// WMO Weather interpretation codes
const WMO_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: 'Clear sky', icon: 'sun' },
  1: { description: 'Mainly clear', icon: 'sun' },
  2: { description: 'Partly cloudy', icon: 'cloud-sun' },
  3: { description: 'Overcast', icon: 'cloud' },
  45: { description: 'Foggy', icon: 'fog' },
  48: { description: 'Rime fog', icon: 'fog' },
  51: { description: 'Light drizzle', icon: 'drizzle' },
  53: { description: 'Drizzle', icon: 'drizzle' },
  55: { description: 'Dense drizzle', icon: 'drizzle' },
  56: { description: 'Freezing drizzle', icon: 'drizzle' },
  57: { description: 'Heavy freezing drizzle', icon: 'drizzle' },
  61: { description: 'Slight rain', icon: 'rain' },
  63: { description: 'Moderate rain', icon: 'rain' },
  65: { description: 'Heavy rain', icon: 'rain-heavy' },
  66: { description: 'Freezing rain', icon: 'rain' },
  67: { description: 'Heavy freezing rain', icon: 'rain-heavy' },
  71: { description: 'Slight snow', icon: 'cloud' },
  73: { description: 'Moderate snow', icon: 'cloud' },
  75: { description: 'Heavy snow', icon: 'cloud' },
  77: { description: 'Snow grains', icon: 'cloud' },
  80: { description: 'Slight showers', icon: 'rain' },
  81: { description: 'Moderate showers', icon: 'rain' },
  82: { description: 'Violent showers', icon: 'rain-heavy' },
  85: { description: 'Slight snow showers', icon: 'cloud' },
  86: { description: 'Heavy snow showers', icon: 'cloud' },
  95: { description: 'Thunderstorm', icon: 'storm' },
  96: { description: 'Thunderstorm with hail', icon: 'storm' },
  99: { description: 'Thunderstorm with heavy hail', icon: 'storm' },
};

function getCondition(code: number): { description: string; icon: string } {
  return WMO_CODES[code] ?? { description: 'Unknown', icon: 'cloud' };
}

export interface DailyWeather {
  date: string;
  precipitationSum: number;
  precipitationProbability: number | null;
  temperatureMax: number;
  temperatureMin: number;
  weatherCode: number;
  condition: { description: string; icon: string };
  isForecast: boolean;
}

export interface MonthlyRainfall {
  month: string; // "Jan", "Feb", etc.
  thisYear: number;
  lastYear: number;
}

export interface WeatherData {
  current: {
    temperature: number;
    weatherCode: number;
    condition: { description: string; icon: string };
    humidity: number;
    windSpeed: number;
    precipitation: number;
    seaTemperature: number | null;
  };
  daily: DailyWeather[];
  lastYearDaily: { date: string; precipitationSum: number }[];
  ytdThisYear: number;
  ytdLastYear: number;
  monthlyComparison: MonthlyRainfall[];
  fetchedAt: string;
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    weather_code: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    precipitation: number;
  };
  daily: {
    time: string[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
}

interface ArchiveResponse {
  daily: {
    time: string[];
    precipitation_sum: number[];
  };
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export async function fetchWeatherData(): Promise<WeatherData> {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
  const currentYear = parseInt(today.slice(0, 4));
  const lastYear = currentYear - 1;

  // Current forecast + 30 days history
  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&daily=precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min,weather_code&past_days=30&forecast_days=7&timezone=${TIMEZONE}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,precipitation`;

  // Last year same 30-day window
  const todayDate = new Date(today + 'T00:00:00');
  const ly30Start = new Date(todayDate);
  ly30Start.setFullYear(ly30Start.getFullYear() - 1);
  ly30Start.setDate(ly30Start.getDate() - 30);
  const ly30End = new Date(todayDate);
  ly30End.setFullYear(ly30End.getFullYear() - 1);
  const lastYear30Url = `https://archive-api.open-meteo.com/v1/archive?latitude=${LATITUDE}&longitude=${LONGITUDE}&daily=precipitation_sum&start_date=${ly30Start.toISOString().slice(0, 10)}&end_date=${ly30End.toISOString().slice(0, 10)}&timezone=${TIMEZONE}`;

  // YTD this year: Jan 1 to yesterday (archive needs past dates)
  const yesterday = new Date(todayDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const ytdThisYearUrl = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&daily=precipitation_sum&start_date=${currentYear}-01-01&end_date=${yesterday.toISOString().slice(0, 10)}&timezone=${TIMEZONE}`;

  // YTD last year: Jan 1 to same day last year
  const ytdLastYearUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${LATITUDE}&longitude=${LONGITUDE}&daily=precipitation_sum&start_date=${lastYear}-01-01&end_date=${ly30End.toISOString().slice(0, 10)}&timezone=${TIMEZONE}`;

  // Sea temperature at Kiama
  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=-34.67&longitude=150.85&current=sea_surface_temperature`;

  // Fetch all in parallel
  const [forecastRes, ly30Res, ytdThisRes, ytdLastRes, marineRes] = await Promise.all([
    fetch(forecastUrl, { next: { revalidate: 3600 } }),
    fetch(lastYear30Url, { next: { revalidate: 86400 } }),
    fetch(ytdThisYearUrl, { next: { revalidate: 3600 } }),
    fetch(ytdLastYearUrl, { next: { revalidate: 86400 } }),
    fetch(marineUrl, { next: { revalidate: 3600 } }),
  ]);

  if (!forecastRes.ok) {
    throw new Error(`Open-Meteo API error: ${forecastRes.status}`);
  }

  const raw: OpenMeteoResponse = await forecastRes.json();

  // Parse sea temperature
  let seaTemperature: number | null = null;
  if (marineRes.ok) {
    const marine = await marineRes.json();
    seaTemperature = marine.current?.sea_surface_temperature ?? null;
  }

  const daily: DailyWeather[] = raw.daily.time.map((date, i) => ({
    date,
    precipitationSum: raw.daily.precipitation_sum[i],
    precipitationProbability: raw.daily.precipitation_probability_max?.[i] ?? null,
    temperatureMax: raw.daily.temperature_2m_max[i],
    temperatureMin: raw.daily.temperature_2m_min[i],
    weatherCode: raw.daily.weather_code[i],
    condition: getCondition(raw.daily.weather_code[i]),
    isForecast: date > today,
  }));

  // Last year 30-day rainfall
  let lastYearDaily: { date: string; precipitationSum: number }[] = [];
  if (ly30Res.ok) {
    const lyRaw: ArchiveResponse = await ly30Res.json();
    lastYearDaily = lyRaw.daily.time.map((date, i) => ({
      date,
      precipitationSum: lyRaw.daily.precipitation_sum[i] ?? 0,
    }));
  }

  // YTD totals and monthly breakdown
  let ytdThisYear = 0;
  let ytdLastYear = 0;
  const monthlyThis: number[] = new Array(12).fill(0);
  const monthlyLast: number[] = new Array(12).fill(0);

  if (ytdThisRes.ok) {
    const ytdThis: ArchiveResponse = await ytdThisRes.json();
    ytdThis.daily.time.forEach((date, i) => {
      const precip = ytdThis.daily.precipitation_sum[i] ?? 0;
      ytdThisYear += precip;
      const month = parseInt(date.slice(5, 7)) - 1;
      monthlyThis[month] += precip;
    });
  }

  if (ytdLastRes.ok) {
    const ytdLast: ArchiveResponse = await ytdLastRes.json();
    ytdLast.daily.time.forEach((date, i) => {
      const precip = ytdLast.daily.precipitation_sum[i] ?? 0;
      ytdLastYear += precip;
      const month = parseInt(date.slice(5, 7)) - 1;
      monthlyLast[month] += precip;
    });
  }

  // Build monthly comparison up to current month
  const currentMonth = parseInt(today.slice(5, 7)) - 1;
  const monthlyComparison: MonthlyRainfall[] = [];
  for (let m = 0; m <= currentMonth; m++) {
    monthlyComparison.push({
      month: MONTH_NAMES[m],
      thisYear: Math.round(monthlyThis[m] * 10) / 10,
      lastYear: Math.round(monthlyLast[m] * 10) / 10,
    });
  }

  return {
    current: {
      temperature: raw.current.temperature_2m,
      weatherCode: raw.current.weather_code,
      condition: getCondition(raw.current.weather_code),
      humidity: raw.current.relative_humidity_2m,
      windSpeed: raw.current.wind_speed_10m,
      precipitation: raw.current.precipitation,
      seaTemperature,
    },
    daily,
    lastYearDaily,
    ytdThisYear: Math.round(ytdThisYear * 10) / 10,
    ytdLastYear: Math.round(ytdLastYear * 10) / 10,
    monthlyComparison,
    fetchedAt: new Date().toISOString(),
  };
}
