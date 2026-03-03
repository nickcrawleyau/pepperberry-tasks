'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogbookEntry, LogbookPhoto } from '@/lib/types';
import { MAX_PHOTOS_PER_LOGBOOK_ENTRY } from '@/lib/constants';

interface LogbookListProps {
  initialEntries: LogbookEntry[];
  supabaseUrl: string;
  currentUserId: string;
  currentUserRole: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function todayStr(): string {
  return new Date().toLocaleDateString('en-CA');
}

export default function LogbookList({
  initialEntries,
  supabaseUrl,
  currentUserId,
  currentUserRole,
}: LogbookListProps) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);

  // Add form state
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');

  // Delete confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Photo upload state
  const [uploadingEntryId, setUploadingEntryId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileEntryRef = useRef<string | null>(null);

  // Photo viewer
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  // Photo delete
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  useEffect(() => {
    if (!viewingPhoto) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setViewingPhoto(null);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [viewingPhoto]);

  function getPublicUrl(storagePath: string): string {
    return `${supabaseUrl}/storage/v1/object/public/logbook-photos/${storagePath}`;
  }

  function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      function tryCompress(img: HTMLImageElement, maxDim: number, quality: number) {
        try {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('Canvas not supported')); return; }
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) { reject(new Error('Compression failed')); return; }
              if (blob.size > 2 * 1024 * 1024) {
                if (quality > 0.3) {
                  tryCompress(img, maxDim, quality - 0.15);
                } else if (maxDim > 800) {
                  tryCompress(img, maxDim - 400, 0.6);
                } else {
                  resolve(blob);
                }
                return;
              }
              resolve(blob);
            },
            'image/jpeg',
            quality
          );
        } catch (err) {
          reject(err);
        }
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        tryCompress(img, 1280, 0.7);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not read image'));
      };
      img.src = objectUrl;
    });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim() || adding) return;

    setAdding(true);
    try {
      const res = await fetch('/api/logbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_date: date, note: note.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.entry) {
        setEntries([data.entry, ...entries]);
        setNote('');
        setDate(todayStr());
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleSaveEdit(entryId: string) {
    if (!editNote.trim()) return;

    try {
      const res = await fetch(`/api/logbook/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: editNote.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.entry) {
        setEntries(entries.map((e) => (e.id === entryId ? { ...e, note: data.entry.note } : e)));
        setEditingId(null);
      }
    } catch {
      // silently fail
    }
  }

  async function handleDelete(entryId: string) {
    try {
      const res = await fetch(`/api/logbook/${entryId}`, { method: 'DELETE' });
      if (res.ok) {
        setEntries(entries.filter((e) => e.id !== entryId));
        setConfirmDeleteId(null);
      }
    } catch {
      // silently fail
    }
  }

  function triggerPhotoUpload(entryId: string) {
    fileEntryRef.current = entryId;
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const entryId = fileEntryRef.current;
    if (!file || !entryId || uploadingEntryId) return;

    setUploadingEntryId(entryId);

    try {
      let uploadBlob: Blob;
      try {
        uploadBlob = await compressImage(file);
      } catch {
        uploadBlob = file;
      }

      const formData = new FormData();
      formData.append('file', uploadBlob, 'photo.jpg');

      const res = await fetch(`/api/logbook/${entryId}/photos`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.photo) {
        setEntries(
          entries.map((entry) =>
            entry.id === entryId
              ? { ...entry, photos: [...(entry.photos || []), data.photo] }
              : entry
          )
        );
        router.refresh();
      }
    } finally {
      setUploadingEntryId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleDeletePhoto(entryId: string, photoId: string) {
    if (deletingPhotoId) return;
    setDeletingPhotoId(photoId);

    try {
      const res = await fetch(`/api/logbook/${entryId}/photos/${photoId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setEntries(
          entries.map((entry) =>
            entry.id === entryId
              ? { ...entry, photos: (entry.photos || []).filter((p) => p.id !== photoId) }
              : entry
          )
        );
        router.refresh();
      }
    } finally {
      setDeletingPhotoId(null);
    }
  }

  function canDeletePhoto(photo: LogbookPhoto): boolean {
    return currentUserRole === 'admin' || photo.uploaded_by === currentUserId;
  }

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Add entry form */}
      <form onSubmit={handleAdd} className="bg-fw-surface rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-fw-bg border border-fw-text/20 rounded-lg px-3 py-2 text-sm text-fw-text focus:outline-none focus:border-fw-accent"
          />
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What happened today?"
          rows={2}
          className="w-full bg-fw-bg border border-fw-text/20 rounded-lg px-3 py-2 text-sm text-fw-text placeholder:text-fw-text/50 focus:outline-none focus:border-fw-accent resize-none mb-3"
        />
        <button
          type="submit"
          disabled={!note.trim() || adding}
          className="px-4 py-2 rounded-lg bg-fw-accent text-white text-sm font-medium hover:bg-fw-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {adding ? 'Adding...' : 'Add Entry'}
        </button>
      </form>

      {/* Entries list */}
      {entries.length === 0 ? (
        <p className="text-sm text-fw-text/50 text-center py-8">No log book entries yet</p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-fw-surface rounded-xl p-4">
              {/* Date and actions row */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-medium text-fw-text">{formatDate(entry.entry_date)}</p>
                  {entry.author?.name && (
                    <p className="text-xs text-fw-text/50">{entry.author.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Edit button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (editingId === entry.id) {
                        setEditingId(null);
                      } else {
                        setEditingId(entry.id);
                        setEditNote(entry.note);
                      }
                    }}
                    className="p-1.5 rounded-lg text-fw-text/40 hover:text-fw-accent hover:bg-fw-text/5 transition"
                    aria-label="Edit entry"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </button>
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() =>
                      confirmDeleteId === entry.id
                        ? handleDelete(entry.id)
                        : setConfirmDeleteId(entry.id)
                    }
                    className={`p-1.5 rounded-lg transition ${
                      confirmDeleteId === entry.id
                        ? 'text-red-400 bg-red-500/10'
                        : 'text-fw-text/40 hover:text-red-400 hover:bg-red-500/10'
                    }`}
                    aria-label={confirmDeleteId === entry.id ? 'Confirm delete' : 'Delete entry'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Confirm delete */}
              {confirmDeleteId === entry.id && (
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <span className="text-red-400">Delete this entry?</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    className="px-2 py-1 rounded bg-red-500 text-white font-medium hover:bg-red-600 transition"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-2 py-1 rounded bg-fw-text/10 text-fw-text/70 font-medium hover:bg-fw-text/20 transition"
                  >
                    No
                  </button>
                </div>
              )}

              {/* Note content (view or edit) */}
              {editingId === entry.id ? (
                <div className="mb-3">
                  <textarea
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    rows={3}
                    className="w-full bg-fw-bg border border-fw-text/20 rounded-lg px-3 py-2 text-sm text-fw-text focus:outline-none focus:border-fw-accent resize-none mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(entry.id)}
                      className="px-3 py-1.5 rounded-lg bg-fw-accent text-white text-xs font-medium hover:bg-fw-hover transition"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded-lg bg-fw-text/10 text-fw-text/70 text-xs font-medium hover:bg-fw-text/20 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-fw-text/80 whitespace-pre-wrap mb-3">{entry.note}</p>
              )}

              {/* Photos */}
              {(entry.photos?.length ?? 0) > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {entry.photos!.map((photo) => (
                    <div key={photo.id} className="relative group aspect-square">
                      <button
                        type="button"
                        onClick={() => setViewingPhoto(getPublicUrl(photo.storage_path))}
                        className="w-full h-full"
                      >
                        <img
                          src={getPublicUrl(photo.storage_path)}
                          alt="Log book photo"
                          className="w-full h-full object-cover rounded-lg"
                          loading="lazy"
                        />
                      </button>
                      {canDeletePhoto(photo) && (
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(entry.id, photo.id)}
                          disabled={deletingPhotoId === photo.id}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white text-xs opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition hover:bg-red-500 disabled:opacity-50"
                        >
                          {deletingPhotoId === photo.id ? '...' : '×'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add photo button */}
              {(entry.photos?.length ?? 0) < MAX_PHOTOS_PER_LOGBOOK_ENTRY && (
                <button
                  type="button"
                  onClick={() => triggerPhotoUpload(entry.id)}
                  disabled={uploadingEntryId === entry.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-fw-text/20 text-xs font-medium text-fw-text/60 hover:bg-fw-bg transition disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                  {uploadingEntryId === entry.id ? 'Uploading...' : 'Add photo'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Full-size photo overlay */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingPhoto(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white text-2xl bg-black/50 rounded-full hover:bg-black/70 transition"
            onClick={() => setViewingPhoto(null)}
          >
            ×
          </button>
          <img
            src={viewingPhoto}
            alt="Log book photo full size"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
