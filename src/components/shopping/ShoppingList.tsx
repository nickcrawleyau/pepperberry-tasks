'use client';

import { useState } from 'react';
import { ShoppingItem } from '@/lib/types';
import { SHOPPING_CATEGORIES, SHOPPING_CATEGORY_LABELS } from '@/lib/constants';
import { useToast } from '@/components/ui/ToastProvider';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface ShoppingListProps {
  initialItems: ShoppingItem[];
  admins: { id: string; name: string }[];
  isAdmin: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  hardware: 'bg-blue-900/40 text-blue-400',
  hay: 'bg-yellow-900/40 text-yellow-400',
  feed: 'bg-green-900/40 text-green-400',
  other: 'bg-fw-bg text-fw-text/70',
};

export default function ShoppingList({ initialItems, admins, isAdmin }: ShoppingListProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<ShoppingItem[]>(initialItems);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [assignedTo, setAssignedTo] = useState<string>(admins[0]?.id || '');
  const [filter, setFilter] = useState<string>('all');
  const [adding, setAdding] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [clearBoughtOpen, setClearBoughtOpen] = useState(false);

  const unbought = items.filter((i) => !i.is_bought);
  const bought = items.filter((i) => i.is_bought);
  const filtered = filter === 'all' ? unbought : unbought.filter((i) => i.category === filter);

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
        toast('Item added');
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleBought(id: string, currentlyBought: boolean) {
    const res = await fetch(`/api/shopping/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_bought: !currentlyBought }),
    });
    if (res.ok) {
      const updated = await res.json();
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      toast(updated.is_bought ? 'Marked as bought' : 'Unmarked');
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/shopping/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast('Item deleted');
    }
    setDeletingItemId(null);
  }

  async function handleClearBought() {
    for (const item of bought) {
      await fetch(`/api/shopping/${item.id}`, { method: 'DELETE' });
    }
    setItems((prev) => prev.filter((i) => !i.is_bought));
    toast('Cleared bought items');
    setClearBoughtOpen(false);
  }

  return (
    <div className="space-y-4">
      {/* Add item form */}
      <form onSubmit={handleAdd} className="bg-fw-surface rounded-xl border border-fw-text/10 p-4">
        <div className="grid grid-cols-[1fr_auto] gap-2 sm:flex">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add item..."
            className="min-w-0 rounded-lg border border-fw-text/10 px-3 py-2.5 text-sm text-fw-text bg-fw-surface focus:outline-none focus:ring-2 focus:ring-fw-accent focus:border-transparent transition"
          />
          <button
            type="submit"
            disabled={!title.trim() || adding}
            className="rounded-lg bg-fw-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-fw-hover active:bg-fw-hover transition disabled:opacity-40"
          >
            Add
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Category"
            className="rounded-lg border border-fw-text/10 px-3 py-2.5 text-sm text-fw-text/80 bg-fw-surface focus:outline-none focus:ring-2 focus:ring-fw-accent transition"
          >
            {SHOPPING_CATEGORIES.map((c) => (
              <option key={c} value={c}>{SHOPPING_CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            aria-label="Assigned buyer"
            className="rounded-lg border border-fw-text/10 px-3 py-2.5 text-sm text-fw-text/80 bg-fw-surface focus:outline-none focus:ring-2 focus:ring-fw-accent transition"
          >
            {admins.map((a) => (
              <option key={a.id} value={a.id}>{a.name.split(' ')[0]}</option>
            ))}
          </select>
        </div>
      </form>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        {['all', ...SHOPPING_CATEGORIES].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            className={`px-3 py-2.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              filter === c
                ? 'bg-fw-bg text-white'
                : 'bg-fw-surface border border-fw-text/10 text-fw-text/70 hover:bg-fw-surface'
            }`}
          >
            {c === 'all' ? 'All' : SHOPPING_CATEGORY_LABELS[c]}
            {c === 'all'
              ? ` (${unbought.length})`
              : ` (${unbought.filter((i) => i.category === c).length})`}
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="bg-fw-surface rounded-xl border border-fw-text/10 divide-y divide-fw-text/10">
        {filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-fw-text/50">No items yet</p>
        )}

        {filtered.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => handleToggleBought(item.id, false)}
              className="w-10 h-10 -m-2 shrink-0 hover:bg-fw-bg/30 transition flex items-center justify-center group rounded-lg"
              aria-label="Mark as bought"
            >
              <span className="w-6 h-6 rounded border-2 border-fw-text/20 group-hover:border-emerald-500 group-hover:bg-emerald-500 transition flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 transition">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-fw-text truncate">{item.title}</p>
              <p className="text-xs text-fw-text/50">
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

      {/* Bought items */}
      {bought.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-fw-text/50">Bought ({bought.length})</p>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setClearBoughtOpen(true)}
                className="text-xs text-fw-text/50 hover:text-red-400 transition"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="bg-fw-surface rounded-xl border border-fw-text/10 divide-y divide-fw-text/10 opacity-60">
            {bought.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleToggleBought(item.id, true)}
                  className="w-10 h-10 -m-2 shrink-0 hover:bg-fw-bg/30 transition flex items-center justify-center rounded-lg"
                  aria-label="Unmark as bought"
                >
                  <span className="w-6 h-6 rounded bg-emerald-500 hover:bg-emerald-400 transition flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                </button>
                <p className="text-sm text-fw-text/50 line-through truncate flex-1">{item.title}</p>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setDeletingItemId(item.id)}
                    className="p-2.5 -m-1 text-fw-text/40 hover:text-red-400 transition"
                    aria-label="Delete item"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deletingItemId}
        title="Delete item?"
        message="This item will be permanently removed."
        confirmLabel="Delete"
        destructive
        onConfirm={() => deletingItemId && handleDelete(deletingItemId)}
        onCancel={() => setDeletingItemId(null)}
      />
      <ConfirmDialog
        open={clearBoughtOpen}
        title="Clear bought items?"
        message={`Remove all ${bought.length} bought items?`}
        confirmLabel="Clear all"
        destructive
        onConfirm={handleClearBought}
        onCancel={() => setClearBoughtOpen(false)}
      />
    </div>
  );
}
