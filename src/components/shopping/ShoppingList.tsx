'use client';

import { useState } from 'react';
import { ShoppingItem } from '@/lib/types';
import { SHOPPING_CATEGORIES, SHOPPING_CATEGORY_LABELS } from '@/lib/constants';

interface ShoppingListProps {
  initialItems: ShoppingItem[];
  userId: string;
  role: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  hardware: 'bg-blue-100 text-blue-700',
  hay: 'bg-yellow-100 text-yellow-700',
  feed: 'bg-green-100 text-green-700',
  other: 'bg-stone-100 text-stone-600',
};

export default function ShoppingList({ initialItems, userId, role }: ShoppingListProps) {
  const [items, setItems] = useState<ShoppingItem[]>(initialItems);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [filter, setFilter] = useState<string>('all');
  const [adding, setAdding] = useState(false);

  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter);
  const unbought = filtered.filter((i) => !i.is_bought);
  const bought = filtered.filter((i) => i.is_bought);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || adding) return;

    setAdding(true);
    try {
      const res = await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), category }),
      });
      if (res.ok) {
        const item = await res.json();
        setItems((prev) => [item, ...prev]);
        setTitle('');
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(id: string) {
    const res = await fetch(`/api/shopping/${id}`, { method: 'PATCH' });
    if (res.ok) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, is_bought: !i.is_bought } : i))
      );
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/shopping/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  }

  const canDelete = (item: ShoppingItem) => role === 'admin' || item.added_by === userId;

  return (
    <div className="space-y-4">
      {/* Add item form */}
      <form onSubmit={handleAdd} className="bg-white rounded-xl border border-stone-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add item..."
            className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-stone-200 px-2 py-2 text-sm text-stone-700 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300 transition"
          >
            {SHOPPING_CATEGORIES.map((c) => (
              <option key={c} value={c}>{SHOPPING_CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!title.trim() || adding}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 active:bg-amber-700 transition disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </form>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto">
        {['all', ...SHOPPING_CATEGORIES].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              filter === c
                ? 'bg-stone-900 text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {c === 'all' ? 'All' : SHOPPING_CATEGORY_LABELS[c]}
            {c === 'all'
              ? ` (${items.filter((i) => !i.is_bought).length})`
              : ` (${items.filter((i) => i.category === c && !i.is_bought).length})`}
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
        {unbought.length === 0 && bought.length === 0 && (
          <p className="p-8 text-center text-sm text-stone-400">No items yet</p>
        )}

        {unbought.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => handleToggle(item.id)}
              className="w-5 h-5 rounded border-2 border-stone-300 shrink-0 hover:border-amber-500 transition"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-stone-900 truncate">{item.title}</p>
              <p className="text-[10px] text-stone-400">{item.adder?.name}</p>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[item.category]}`}>
              {SHOPPING_CATEGORY_LABELS[item.category]}
            </span>
            {canDelete(item) && (
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="text-stone-300 hover:text-red-500 transition shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}

        {/* Bought items */}
        {bought.length > 0 && (
          <>
            {unbought.length > 0 && (
              <div className="px-4 py-2 bg-stone-50">
                <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wide">Bought</p>
              </div>
            )}
            {bought.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 opacity-50">
                <button
                  type="button"
                  onClick={() => handleToggle(item.id)}
                  className="w-5 h-5 rounded border-2 border-emerald-400 bg-emerald-400 shrink-0 flex items-center justify-center"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-500 line-through truncate">{item.title}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[item.category]}`}>
                  {SHOPPING_CATEGORY_LABELS[item.category]}
                </span>
                {canDelete(item) && (
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="text-stone-300 hover:text-red-500 transition shrink-0"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
