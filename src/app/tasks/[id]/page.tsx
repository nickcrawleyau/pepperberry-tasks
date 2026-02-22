import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Task, TaskComment, TaskPhoto, TaskActivity } from '@/lib/types';
import {
  PRIORITY_LABELS,
  CATEGORY_LABELS,
  LOCATION_LABELS,
  RECURRENCE_LABELS,
} from '@/lib/constants';
import StatusUpdater from '@/components/tasks/StatusUpdater';
import CommentSection from '@/components/tasks/CommentSection';
import DeleteTaskButton from '@/components/tasks/DeleteTaskButton';
import DeleteSeriesButton from '@/components/tasks/DeleteSeriesButton';
import PhotoSection from '@/components/tasks/PhotoSection';
import ActivityLog from '@/components/tasks/ActivityLog';

const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-stone-500',
  medium: 'bg-stone-400',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/');

  const { id } = await params;

  // Fetch task with related user names
  const { data: task, error } = await supabaseAdmin
    .from('tasks')
    .select(`
      *,
      assigned_user:users!tasks_assigned_to_fkey(name),
      created_user:users!tasks_created_by_fkey(name)
    `)
    .eq('id', id)
    .single();

  if (error || !task) notFound();

  const typedTask = task as Task;

  // Permission check
  if (session.role === 'tradesperson' && typedTask.assigned_to !== session.userId) {
    notFound();
  }
  if (session.role === 'riding_school' && typedTask.category !== 'riding_school') {
    notFound();
  }

  // Fetch comments
  const { data: comments } = await supabaseAdmin
    .from('task_comments')
    .select('id, content, created_at, user:users(name)')
    .eq('task_id', id)
    .order('created_at', { ascending: true });

  const typedComments = (comments || []) as unknown as TaskComment[];

  // Fetch photos
  const { data: photos } = await supabaseAdmin
    .from('task_photos')
    .select('id, storage_path, uploaded_by, created_at, uploader:users!task_photos_uploaded_by_fkey(name)')
    .eq('task_id', id)
    .order('created_at', { ascending: true });

  const typedPhotos = (photos || []) as unknown as TaskPhoto[];

  // Fetch activity log
  const { data: activities } = await supabaseAdmin
    .from('task_activity')
    .select('id, task_id, user_id, action, detail, created_at, user:users(name)')
    .eq('task_id', id)
    .order('created_at', { ascending: true });

  const typedActivities = (activities || []) as unknown as TaskActivity[];

  const isOverdue =
    typedTask.due_date &&
    typedTask.status !== 'done' &&
    new Date(typedTask.due_date) < new Date(new Date().toDateString());

  return (
    <div className="min-h-screen bg-stone-950">
      <header className="bg-stone-900 border-b border-stone-700">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-stone-500 hover:text-stone-300 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-medium text-stone-100">
              Task Detail
            </h1>
          </div>
          {session.role === 'admin' && (
            <div className="flex items-center gap-2">
              <Link
                href={`/tasks/${id}/edit`}
                className="px-3 py-1.5 rounded-lg border border-stone-700 text-xs font-medium text-stone-300 hover:bg-stone-800 transition"
              >
                Edit
              </Link>
              <DeleteTaskButton taskId={id} />
              {typedTask.recurrence_group_id && (
                <DeleteSeriesButton groupId={typedTask.recurrence_group_id} />
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        {/* Title & Description */}
        <div>
          <h2 className="text-xl font-medium text-stone-100 leading-snug">
            {typedTask.title}
          </h2>
          {typedTask.description && (
            <p className="mt-2 text-sm text-stone-400 leading-relaxed">
              {typedTask.description}
            </p>
          )}
        </div>

        {/* Status Updater */}
        <div className="bg-stone-900 rounded-xl border border-stone-700 p-5">
          <p className="text-xs font-medium text-stone-400 mb-2">Status</p>
          <StatusUpdater taskId={typedTask.id} currentStatus={typedTask.status} />
        </div>

        {/* Details Grid */}
        <div className="bg-stone-900 rounded-xl border border-stone-700 p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-stone-500 mb-0.5">Priority</p>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[typedTask.priority]}`} />
                <span className="text-sm text-stone-200">
                  {PRIORITY_LABELS[typedTask.priority]}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs text-stone-500 mb-0.5">Category</p>
              <p className="text-sm text-stone-200">
                {CATEGORY_LABELS[typedTask.category] || typedTask.category}
              </p>
            </div>

            <div>
              <p className="text-xs text-stone-500 mb-0.5">Location</p>
              <p className="text-sm text-stone-200">
                {LOCATION_LABELS[typedTask.location] || typedTask.location}
              </p>
            </div>

            <div>
              <p className="text-xs text-stone-500 mb-0.5">Assigned to</p>
              <p className="text-sm text-stone-200">
                {typedTask.assigned_user?.name || 'Unassigned'}
              </p>
            </div>

            <div>
              <p className="text-xs text-stone-500 mb-0.5">Due date</p>
              <p className={`text-sm ${isOverdue ? 'text-red-500 font-medium' : 'text-stone-700'}`}>
                {isOverdue && 'Overdue — '}
                {formatDate(typedTask.due_date)}
              </p>
            </div>

            <div>
              <p className="text-xs text-stone-500 mb-0.5">Created by</p>
              <p className="text-sm text-stone-200">
                {typedTask.created_user?.name || 'Unknown'}
              </p>
            </div>

            <div>
              <p className="text-xs text-stone-500 mb-0.5">Created</p>
              <p className="text-sm text-stone-200">
                {formatDate(typedTask.created_at)}
              </p>
            </div>

            {typedTask.recurrence_pattern && (
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Repeats</p>
                <p className="text-sm text-stone-200">
                  {RECURRENCE_LABELS[typedTask.recurrence_pattern] || typedTask.recurrence_pattern}
                </p>
              </div>
            )}

            {typedTask.completed_at && (
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Completed</p>
                <p className="text-sm text-stone-200">
                  {formatDate(typedTask.completed_at)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Photos */}
        <div className="bg-stone-900 rounded-xl border border-stone-700 p-5">
          <PhotoSection
            taskId={typedTask.id}
            photos={typedPhotos}
            currentUserId={session.userId}
            currentUserRole={session.role}
            supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
          />
        </div>

        {/* Activity Log */}
        <div className="bg-stone-900 rounded-xl border border-stone-700 p-5">
          <ActivityLog activities={typedActivities} />
        </div>

        {/* Comments */}
        <div className="bg-stone-900 rounded-xl border border-stone-700 p-5">
          <CommentSection taskId={typedTask.id} comments={typedComments} />
        </div>
      </main>
    </div>
  );
}
