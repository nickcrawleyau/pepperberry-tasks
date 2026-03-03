'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TaskPhoto } from '@/lib/types';
import { MAX_PHOTOS_PER_TASK } from '@/lib/constants';
import { useToast } from '@/components/ui/ToastProvider';

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
  const { toast } = useToast();
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
              if (!blob) { reject(new Error('Compression failed - no blob')); return; }
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
          reject(new Error('Compress error: ' + (err instanceof Error ? err.message : String(err))));
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
        reject(new Error('Could not read image. Try taking a new photo.'));
      };
      img.src = objectUrl;
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || uploading) return;

    setError(null);
    setUploading(true);

    try {
      // Step 1: Compress image (if this fails, try raw file)
      let uploadBlob: Blob;
      try {
        uploadBlob = await compressImage(file);
      } catch {
        // Compression failed — use the raw file instead
        uploadBlob = file;
      }

      // Step 2: Upload via server (FormData)
      const formData = new FormData();
      formData.append('file', uploadBlob, 'photo.jpg');

      const res = await fetch(`/api/tasks/${taskId}/photos`, {
        method: 'POST',
        body: formData,
      });

      if (res.status === 413) {
        setError('Photo too large (' + Math.round(uploadBlob.size / 1024) + 'KB). Try a smaller photo.');
        return;
      }

      let data;
      try {
        data = await res.json();
      } catch {
        setError('Server error (status ' + res.status + '). Try again.');
        return;
      }

      if (res.ok && data.photo) {
        setPhotos([...photos, data.photo]);
        toast('Photo uploaded');
        router.refresh();
      } else {
        setError(data.error || 'Upload failed (status ' + res.status + ')');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError('Error: ' + msg);
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
        toast('Photo removed');
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
      <p className="text-xs font-medium text-fw-text/50 mb-3">
        Photos
        {photos.length > 0 && (
          <span className="ml-1 text-fw-text/50 font-normal">
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
                  alt="Job photo"
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
        <p className="text-xs text-fw-text/50 mb-4">No photos yet</p>
      )}

      {/* Upload input */}
      {canUpload && (
        <label
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-fw-text/20 text-sm font-medium text-fw-text/80 transition cursor-pointer hover:bg-fw-bg ${
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
            accept="image/*"
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
            alt="Job photo full size"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
