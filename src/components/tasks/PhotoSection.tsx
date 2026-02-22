'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TaskPhoto } from '@/lib/types';
import { MAX_PHOTOS_PER_TASK } from '@/lib/constants';

interface PhotoSectionProps {
  taskId: string;
  photos: TaskPhoto[];
  currentUserId: string;
  currentUserRole: string;
  supabaseUrl: string;
}

export default function PhotoSection({
  taskId,
  photos: initialPhotos,
  currentUserId,
  currentUserRole,
  supabaseUrl,
}: PhotoSectionProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!viewingPhoto) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setViewingPhoto(null);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [viewingPhoto]);

  const canUpload = photos.length < MAX_PHOTOS_PER_TASK;

  function getPublicUrl(storagePath: string): string {
    return `${supabaseUrl}/storage/v1/object/public/task-photos/${storagePath}`;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || uploading) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/tasks/${taskId}/photos`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setPhotos([...photos, data.photo]);
        router.refresh();
      } else {
        setError(data.error || 'Failed to upload');
      }
    } catch {
      setError('Failed to upload photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleDelete(photoId: string) {
    if (deletingId) return;
    setDeletingId(photoId);

    try {
      const res = await fetch(`/api/tasks/${taskId}/photos/${photoId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setPhotos(photos.filter((p) => p.id !== photoId));
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  }

  function canDeletePhoto(photo: TaskPhoto): boolean {
    return currentUserRole === 'admin' || photo.uploaded_by === currentUserId;
  }

  return (
    <div>
      <p className="text-xs font-medium text-stone-500 mb-3">
        Photos
        {photos.length > 0 && (
          <span className="ml-1 text-stone-500 font-normal">
            ({photos.length}/{MAX_PHOTOS_PER_TASK})
          </span>
        )}
      </p>

      {/* Photo grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group aspect-square">
              <button
                type="button"
                onClick={() => setViewingPhoto(getPublicUrl(photo.storage_path))}
                className="w-full h-full"
              >
                <img
                  src={getPublicUrl(photo.storage_path)}
                  alt="Task photo"
                  className="w-full h-full object-cover rounded-lg"
                  loading="lazy"
                />
              </button>
              {canDeletePhoto(photo) && (
                <button
                  type="button"
                  onClick={() => handleDelete(photo.id)}
                  disabled={deletingId === photo.id}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white text-xs opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition hover:bg-red-500 disabled:opacity-50"
                >
                  {deletingId === photo.id ? '...' : '×'}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-stone-500 mb-4">No photos yet</p>
      )}

      {/* Upload input */}
      {canUpload && (
        <label
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-200 text-sm font-medium text-stone-700 transition cursor-pointer hover:bg-stone-100 ${
            uploading ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
          {uploading ? 'Uploading...' : 'Add photo'}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
            capture="environment"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
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
            alt="Task photo full size"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
