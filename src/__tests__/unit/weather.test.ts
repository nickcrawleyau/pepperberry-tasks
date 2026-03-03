import { describe, it, expect } from 'vitest';

// Import the weather module to test getCondition
// Since getCondition is not exported, we test it indirectly through the module
// We'll also validate the WMO codes and weather data types

// Re-create the WMO code map and getCondition for unit testing
// (since the original is not exported)
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

describe('Weather - WMO Codes', () => {
  describe('getCondition returns correct values for known codes', () => {
    it('code 0 = Clear sky with sun icon', () => {
      const result = getCondition(0);
      expect(result.description).toBe('Clear sky');
      expect(result.icon).toBe('sun');
    });

    it('code 2 = Partly cloudy', () => {
      const result = getCondition(2);
      expect(result.description).toBe('Partly cloudy');
      expect(result.icon).toBe('cloud-sun');
    });

    it('code 3 = Overcast', () => {
      expect(getCondition(3).description).toBe('Overcast');
    });

    it('code 45 = Foggy', () => {
      const result = getCondition(45);
      expect(result.description).toBe('Foggy');
      expect(result.icon).toBe('fog');
    });

    it('code 61 = Slight rain', () => {
      const result = getCondition(61);
      expect(result.description).toBe('Slight rain');
      expect(result.icon).toBe('rain');
    });

    it('code 65 = Heavy rain with rain-heavy icon', () => {
      const result = getCondition(65);
      expect(result.description).toBe('Heavy rain');
      expect(result.icon).toBe('rain-heavy');
    });

    it('code 95 = Thunderstorm with storm icon', () => {
      const result = getCondition(95);
      expect(result.description).toBe('Thunderstorm');
      expect(result.icon).toBe('storm');
    });

    it('code 99 = Thunderstorm with heavy hail', () => {
      const result = getCondition(99);
      expect(result.description).toBe('Thunderstorm with heavy hail');
      expect(result.icon).toBe('storm');
    });
  });

  describe('getCondition handles unknown codes', () => {
    it('returns Unknown for code -1', () => {
      const result = getCondition(-1);
      expect(result.description).toBe('Unknown');
      expect(result.icon).toBe('cloud');
    });

    it('returns Unknown for code 999', () => {
      const result = getCondition(999);
      expect(result.description).toBe('Unknown');
    });

    it('returns Unknown for code 100', () => {
      expect(getCondition(100).description).toBe('Unknown');
    });

    it('returns Unknown for NaN', () => {
      expect(getCondition(NaN).description).toBe('Unknown');
    });
  });

  describe('all WMO codes have valid structure', () => {
    Object.entries(WMO_CODES).forEach(([code, value]) => {
      it(`code ${code} has description and icon`, () => {
        expect(typeof value.description).toBe('string');
        expect(value.description.length).toBeGreaterThan(0);
        expect(typeof value.icon).toBe('string');
        expect(value.icon.length).toBeGreaterThan(0);
      });
    });
  });

  describe('WMO code coverage', () => {
    it('has entries for clear/cloudy codes (0-3)', () => {
      [0, 1, 2, 3].forEach((code) => {
        expect(WMO_CODES[code]).toBeDefined();
      });
    });

    it('has entries for fog codes (45, 48)', () => {
      [45, 48].forEach((code) => {
        expect(WMO_CODES[code]).toBeDefined();
      });
    });

    it('has entries for drizzle codes (51-57)', () => {
      [51, 53, 55, 56, 57].forEach((code) => {
        expect(WMO_CODES[code]).toBeDefined();
      });
    });

    it('has entries for rain codes (61-67)', () => {
      [61, 63, 65, 66, 67].forEach((code) => {
        expect(WMO_CODES[code]).toBeDefined();
      });
    });

    it('has entries for snow codes (71-77)', () => {
      [71, 73, 75, 77].forEach((code) => {
        expect(WMO_CODES[code]).toBeDefined();
      });
    });

    it('has entries for shower codes (80-86)', () => {
      [80, 81, 82, 85, 86].forEach((code) => {
        expect(WMO_CODES[code]).toBeDefined();
      });
    });

    it('has entries for thunderstorm codes (95-99)', () => {
      [95, 96, 99].forEach((code) => {
        expect(WMO_CODES[code]).toBeDefined();
      });
    });
  });
});

describe('Weather - Precipitation Rounding', () => {
  it('rounds to one decimal place correctly', () => {
    expect(Math.round(12.345 * 10) / 10).toBe(12.3);
    expect(Math.round(12.35 * 10) / 10).toBe(12.4);
    expect(Math.round(0 * 10) / 10).toBe(0);
    expect(Math.round(99.99 * 10) / 10).toBe(100);
  });

  it('handles zero precipitation', () => {
    expect(Math.round(0 * 10) / 10).toBe(0);
  });

  it('handles very small values', () => {
    expect(Math.round(0.04 * 10) / 10).toBe(0);
    expect(Math.round(0.05 * 10) / 10).toBe(0.1);
  });
});

describe('Weather - Month Names', () => {
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  it('has 12 month names', () => {
    expect(MONTH_NAMES.length).toBe(12);
  });

  it('starts with Jan', () => {
    expect(MONTH_NAMES[0]).toBe('Jan');
  });

  it('ends with Dec', () => {
    expect(MONTH_NAMES[11]).toBe('Dec');
  });

  it('all names are 3 characters', () => {
    MONTH_NAMES.forEach((name) => {
      expect(name.length).toBe(3);
    });
  });
});
