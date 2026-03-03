'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Task } from '@/lib/types';
import TaskCard from './TaskCard';

const DELETE_BUTTON_WIDTH = 80;
const LOCK_THRESHOLD = 10;
const SNAP_THRESHOLD = 40;
const VELOCITY_THRESHOLD = 0.3;

interface SwipeableTaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onMarkDone?: (taskId: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SwipeableTaskCard({
  task,
  onDelete,
  onMarkDone,
  isOpen,
  onOpenChange,
}: SwipeableTaskCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const directionLocked = useRef<'horizontal' | 'vertical' | null>(null);
  const dragging = useRef(false);
  const didSwipe = useRef(false);
  const currentOffset = useRef(0);

  const [confirmStep, setConfirmStep] = useState(false);
  const [removing, setRemoving] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external isOpen prop to card position
  useEffect(() => {
    if (!cardRef.current) return;
    if (!dragging.current) {
      const target = isOpen ? -DELETE_BUTTON_WIDTH : 0;
      currentOffset.current = target;
      cardRef.current.style.transition =
        'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      cardRef.current.style.transform = `translateX(${target}px)`;
    }
    if (!isOpen) {
      setConfirmStep(false);
      if (confirmTimer.current) {
        clearTimeout(confirmTimer.current);
        confirmTimer.current = null;
      }
    }
  }, [isOpen]);

  // Cleanup confirm timer
  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (removing) return;
      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      startTime.current = Date.now();
      directionLocked.current = null;
      dragging.current = false;
      didSwipe.current = false;

      if (cardRef.current) {
        cardRef.current.style.transition = 'none';
      }
    },
    [removing]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (removing) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX.current;
      const deltaY = touch.clientY - startY.current;

      if (directionLocked.current === 'vertical') return;

      if (directionLocked.current === null) {
        const absDX = Math.abs(deltaX);
        const absDY = Math.abs(deltaY);
        if (absDX < LOCK_THRESHOLD && absDY < LOCK_THRESHOLD) return;
        if (absDY > absDX) {
          directionLocked.current = 'vertical';
          return;
        }
        directionLocked.current = 'horizontal';
        dragging.current = true;
      }

      didSwipe.current = true;

      const base = isOpen ? -DELETE_BUTTON_WIDTH : 0;
      let offset = base + deltaX;
      // Clamp: can't go right past 0, slight over-drag allowed left
      offset = Math.max(-DELETE_BUTTON_WIDTH * 1.2, Math.min(0, offset));
      currentOffset.current = offset;

      if (cardRef.current) {
        cardRef.current.style.transform = `translateX(${offset}px)`;
      }
    },
    [isOpen, removing]
  );

  const onTouchEnd = useCallback(() => {
    if (removing) return;
    if (directionLocked.current !== 'horizontal') {
      dragging.current = false;
      return;
    }

    const elapsed = Date.now() - startTime.current;
    const velocity = Math.abs(currentOffset.current) / elapsed;
    const shouldOpen =
      Math.abs(currentOffset.current) > SNAP_THRESHOLD ||
      velocity > VELOCITY_THRESHOLD;

    const target = shouldOpen ? -DELETE_BUTTON_WIDTH : 0;
    currentOffset.current = target;

    if (cardRef.current) {
      cardRef.current.style.transition =
        'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      cardRef.current.style.transform = `translateX(${target}px)`;
    }

    onOpenChange(shouldOpen);
    dragging.current = false;
  }, [onOpenChange, removing]);

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      if (didSwipe.current) {
        e.preventDefault();
        e.stopPropagation();
        didSwipe.current = false;
        return;
      }
      if (isOpen) {
        e.preventDefault();
        e.stopPropagation();
        onOpenChange(false);
      }
    },
    [isOpen, onOpenChange]
  );

  const handleDelete = useCallback(() => {
    if (!confirmStep) {
      setConfirmStep(true);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => {
        setConfirmStep(false);
      }, 3000);
      return;
    }

    // Confirmed — trigger removal animation
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setRemoving(true);

    // Slide card fully off screen
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.25s ease-in';
      cardRef.current.style.transform = 'translateX(-100%)';
    }

    // After slide, collapse and delete
    setTimeout(() => {
      onDelete(task.id);
    }, 350);
  }, [confirmStep, onDelete, task.id]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${
        removing
          ? 'transition-all duration-300 ease-out'
          : ''
      }`}
      style={
        removing
          ? { maxHeight: 0, opacity: 0, marginBottom: 0 }
          : {}
      }
    >
      {/* Delete action panel (behind card) */}
      <div className="absolute inset-y-0 right-0 w-20 bg-red-500 flex items-center justify-center">
        <button
          type="button"
          onClick={handleDelete}
          className={`flex flex-col items-center gap-0.5 w-full h-full justify-center transition-colors ${
            confirmStep ? 'bg-red-600' : 'bg-red-500'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
          <span className="text-white text-[10px] font-semibold">
            {confirmStep ? 'Sure?' : 'Delete'}
          </span>
        </button>
      </div>

      {/* Sliding card */}
      <div
        ref={cardRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClickCapture={handleCardClick}
        style={{ touchAction: 'pan-y' }}
      >
        <TaskCard task={task} onMarkDone={onMarkDone} onDelete={onDelete} />
      </div>
    </div>
  );
}
