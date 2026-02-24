'use client';

import { useState } from 'react';
import { ShoppingItem } from '@/lib/types';
import { SHOPPING_CATEGORIES, SHOPPING_CATEGORY_LABELS } from '@/lib/constants';

interface ShoppingListProps {
  initialItems: ShoppingItem[];
  admins: { id: string; name: string }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  hardware: 'bg-blue-100 text-blue-700',
  hay: 'bg-yellow-100 text-yellow-700',
  feed: 'bg-green-100 text-green-700',
  other: 'bg-fw-bg text-fw-text/70',
};

export default function ShoppingList({ initialItems, admins }: ShoppingListProps) {
  const [items, setItems] = useState<ShoppingItem[]>(initialItems);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [assignedTo, setAssignedTo] = useState<string>(admins[0]?.id || '');
  const [filter, setFilter] = useState<string>('all');
  const [adding, setAdding] = useState(false);

  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || adding) return;

    setAdding(true);
    try {
      const res = await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), category, assigned_to: assignedTo || null }),
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

  async function handleDelete(id: string) {
    const res = await fetch(`/api/shopping/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  }

  return (
    <div className="space-y-4">
      {/* Add item form */}
      <form onSubmit={handleAdd} className="bg-fw-surface rounded-xl border border-fw-surface p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add item..."
            className="flex-1 rounded-lg border border-fw-surface px-3 py-2 text-sm text-fw-text bg-fw-surface focus:outline-none focus:ring-2 focus:ring-fw-accent focus:border-transparent transition"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-fw-surface px-2 py-2 text-sm text-fw-text/80 bg-fw-surface focus:outline-none focus:ring-2 focus:ring-fw-accent transition"
          >
            {SHOPPING_CATEGORIES.map((c) => (
              <option key={c} value={c}>{SHOPPING_CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="rounded-lg border border-fw-surface px-2 py-2 text-sm text-fw-text/80 bg-fw-surface focus:outline-none focus:ring-2 focus:ring-fw-accent transition"
          >
            {admins.map((a) => (
              <option key={a.id} value={a.id}>{a.name.split(' ')[0]}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!title.trim() || adding}
            className="rounded-lg bg-fw-accent px-4 py-2 text-sm font-medium text-white hover:bg-fw-hover active:bg-fw-hover transition disabled:opacity-40"
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
                ? 'bg-fw-bg text-white'
                : 'bg-fw-surface border border-fw-surface text-fw-text/70 hover:bg-fw-surface'
            }`}
          >
            {c === 'all' ? 'All' : SHOPPING_CATEGORY_LABELS[c]}
            {c === 'all'
              ? ` (${items.length})`
              : ` (${items.filter((i) => i.category === c).length})`}
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="bg-fw-surface rounded-xl border border-fw-surface divide-y divide-fw-surface">
        {filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-fw-text/40">No items yet</p>
        )}

        {filtered.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              className="w-5 h-5 rounded border-2 border-fw-text/20 shrink-0 hover:border-emerald-500 hover:bg-emerald-500 transition flex items-center justify-center group"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 transition">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-fw-text truncate">{item.title}</p>
              <p className="text-[10px] text-fw-text/40">
                {item.adder?.name}
                {item.assignee?.name && <> &middot; <span className="text-fw-accent font-medium">{item.assignee.name.split(' ')[0]}</span></>}
              </p>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[item.category]}`}>
              {SHOPPING_CATEGORY_LABELS[item.category]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
