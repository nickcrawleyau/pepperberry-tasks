'use client';

import { useState } from 'react';
import type { FuelData, FuelStationPrice } from '@/lib/fuel';

type FuelType = 'PDL' | 'U91' | 'P98';

const FUEL_LABELS: Record<FuelType, string> = {
  PDL: 'Premium Diesel (PDL)',
  U91: 'P91',
  P98: 'P98',
};

const FUEL_CALC: Record<FuelType, { litres: number; label: string }> = {
  PDL: { litres: 70, label: '70L' },
  U91: { litres: 150, label: '6 × 25L' },
  P98: { litres: 80, label: '80L' },
};

function formatPrice(centsPerLitre: number): string {
  return centsPerLitre.toFixed(1);
}

function formatCost(centsPerLitre: number, litres: number): string {
  return (centsPerLitre * litres / 100).toFixed(2);
}

function timeAgo(isoDate: string): string {
  const now = new Date();
  const then = new Date(isoDate);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

interface FuelSectionProps {
  fuelType: FuelType;
  stations: FuelStationPrice[];
  isSelected: boolean;
}

function CostCard({ fuelType, cheapestPrice }: { fuelType: FuelType; cheapestPrice: number }) {
  const calc = FUEL_CALC[fuelType];
  return (
    <div className="bg-fw-surface/50 rounded-lg px-4 py-3 mb-3">
      <p className="text-sm text-fw-text/70">
        <span className="font-medium text-fw-text">{calc.label}</span>
        {' '}@ {formatPrice(cheapestPrice)}c/L ={' '}
        <span className="font-bold text-fw-text text-base">${formatCost(cheapestPrice, calc.litres)}</span>
      </p>
    </div>
  );
}

function StationCard({
  stationPrice,
  isCheapest,
  isSelected,
}: {
  stationPrice: FuelStationPrice;
  isCheapest: boolean;
  isSelected: boolean;
}) {
  return (
    <div
      className={`bg-fw-surface rounded-xl p-4 ${
        isCheapest && isSelected ? 'border-2 border-fw-accent' : 'border border-fw-surface'
      }`}
    >
      <div className="flex items-baseline justify-between mb-1">
        <div>
          <span className="text-sm font-medium text-fw-text">{stationPrice.station.brand}</span>
          <span className="text-xs text-fw-text/50 ml-2">{stationPrice.station.suburb}</span>
        </div>
        {isCheapest && isSelected && (
          <span className="text-xs font-medium text-fw-accent">Cheapest</span>
        )}
      </div>
      <p className="text-2xl font-bold text-fw-text mb-2">
        {formatPrice(stationPrice.currentPrice)}
        <span className="text-sm font-normal text-fw-text/50 ml-1">c/L</span>
      </p>
      {stationPrice.history.length > 0 && (
        <div className="border-t border-fw-text/10 pt-2 space-y-1">
          {stationPrice.history.map((h, i) => (
            <div key={i} className="flex justify-between text-sm text-fw-text/70">
              <span>{timeAgo(h.fetchedAt)}</span>
              <span>{formatPrice(h.price)} c/L</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FuelSection({ fuelType, stations, isSelected }: FuelSectionProps) {
  if (stations.length === 0) {
    return (
      <div className={`mb-6 ${!isSelected ? 'opacity-60' : ''}`}>
        <h2 className={`text-base font-semibold text-fw-text mb-3 pl-3 ${
          isSelected ? 'border-l-4 border-fw-accent' : 'border-l-4 border-transparent'
        }`}>
          {FUEL_LABELS[fuelType]}
        </h2>
        <p className="text-sm text-fw-text/50 px-3">No stations found</p>
      </div>
    );
  }

  const cheapestPrice = stations[0].currentPrice; // Already sorted cheapest first

  return (
    <div className={`mb-6 ${!isSelected ? 'opacity-60' : ''}`}>
      <h2 className={`text-base font-semibold text-fw-text mb-3 pl-3 ${
        isSelected ? 'border-l-4 border-fw-accent' : 'border-l-4 border-transparent'
      }`}>
        {FUEL_LABELS[fuelType]}
      </h2>
      <CostCard fuelType={fuelType} cheapestPrice={cheapestPrice} />
      <div className="space-y-3">
        {stations.map((sp) => (
          <StationCard
            key={sp.station.stationCode}
            stationPrice={sp}
            isCheapest={sp.currentPrice === cheapestPrice}
            isSelected={isSelected}
          />
        ))}
      </div>
    </div>
  );
}

export default function FuelDisplay({ data }: { data: FuelData }) {
  const [selected, setSelected] = useState<FuelType>('PDL');

  const sections: { type: FuelType; stations: FuelStationPrice[] }[] = [
    { type: 'PDL', stations: data.pdl },
    { type: 'U91', stations: data.u91 },
    { type: 'P98', stations: data.p98 },
  ];

  // Stale data warning if fetched > 30 mins ago
  const fetchedAge = Date.now() - new Date(data.fetchedAt).getTime();
  const isStale = fetchedAge > 30 * 60 * 1000;

  return (
    <div>
      {isStale && (
        <div className="bg-yellow-900/30 border border-yellow-600/40 rounded-xl px-4 py-3 mb-4 text-sm text-yellow-200">
          Showing cached prices from {timeAgo(data.fetchedAt)}. Live update failed.
        </div>
      )}
      {/* Sticky fuel type selector */}
      <div className="sticky top-[73px] z-20 bg-fw-bg pb-4 pt-1">
        <div className="flex gap-2">
          {(['PDL', 'U91', 'P98'] as FuelType[]).map((ft) => (
            <button
              key={ft}
              onClick={() => setSelected(ft)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                selected === ft
                  ? 'bg-fw-accent text-white'
                  : 'bg-fw-surface text-fw-text/70 hover:text-fw-text'
              }`}
            >
              {ft === 'U91' ? 'P91' : ft}
            </button>
          ))}
        </div>
      </div>

      {/* Fuel sections */}
      {sections.map(({ type, stations }) => (
        <FuelSection
          key={type}
          fuelType={type}
          stations={stations}
          isSelected={selected === type}
        />
      ))}
    </div>
  );
}
