import { getSession, getSessionExpiry } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Task, TaskComment, TaskPhoto, TaskActivity, TaskSubtask } from '@/lib/types';
import {
  PRIORITY_LABELS,
  LOCATION_LABELS,
  RECURRENCE_LABELS,
  AREA_LABELS,
} from '@/lib/constants';
import StatusUpdater from '@/components/tasks/StatusUpdater';
import CommentSection from '@/components/tasks/CommentSection';
import DeleteTaskButton from '@/components/tasks/DeleteTaskButton';
import DeleteSeriesButton from '@/components/tasks/DeleteSeriesButton';
import PhotoSection from '@/components/tasks/PhotoSection';
import ActivityLog from '@/components/tasks/ActivityLog';
import TransferTask from '@/components/tasks/TransferTask';
import SubtaskChecklist from '@/components/tasks/SubtaskChecklist';
import SessionTimer from '@/components/SessionTimer';
import LogoutButton from '@/components/LogoutButton';
import UnreadBadges from '@/components/UnreadBadges';

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

  // Fetch task and session expiry in parallel
  const [sessionExpiry, { data: task, error }] = await Promise.all([
    getSessionExpiry(),
    supabaseAdmin
      .from('tasks')
      .select(`
        *,
        assigned_user:users!tasks_assigned_to_fkey(name),
        created_user:users!tasks_created_by_fkey(name)
      `)
      .eq('id', id)
      .single(),
  ]);

  if (error || !task) notFound();

  const typedTask = task as Task;

  // Permission check
  if (session.role === 'tradesperson' && typedTask.assigned_to !== session.userId) {
    notFound();
  }
  if (session.role === 'riding_school' && typedTask.category !== 'riding_school') {
    notFound();
  }

  // Fetch all task details in parallel
  const [
    { data: comments },
    { data: photos },
    { data: activities },
    { data: subtasks },
    { data: activeUsers },
  ] = await Promise.all([
    supabaseAdmin
      .from('task_comments')
      .select('id, content, created_at, user:users(name)')
      .eq('task_id', id)
      .order('created_at', { ascending: true }),
    supabaseAdmin
      .from('task_photos')
      .select('id, storage_path, uploaded_by, created_at, uploader:users!task_photos_uploaded_by_fkey(name)')
      .eq('task_id', id)
      .order('created_at', { ascending: true }),
    supabaseAdmin
      .from('task_activity')
      .select('id, task_id, user_id, action, detail, created_at, user:users(name)')
      .eq('task_id', id)
      .order('created_at', { ascending: true }),
    supabaseAdmin
      .from('task_subtasks')
      .select('*')
      .eq('task_id', id)
      .order('sort_order', { ascending: true }),
    supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),
  ]);

  const typedComments = (comments || []) as unknown as TaskComment[];
  const typedPhotos = (photos || []) as unknown as TaskPhoto[];
  const typedActivities = (activities || []) as unknown as TaskActivity[];
  const typedSubtasks = (subtasks || []) as TaskSubtask[];
  const transferUsers = (activeUsers || []).map((u) => ({ id: u.id as string, name: u.name as string }));

  const isOverdue =
    typedTask.due_date &&
    typedTask.status !== 'done' &&
    new Date(typedTask.due_date) < new Date(new Date().toDateString());

  return (
    <div className="min-h-screen bg-fw-bg overflow-x-hidden">
      <header className="bg-fw-surface border-b border-fw-surface sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-5 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-fw-text/50 hover:text-fw-text/80 transition p-2 -m-2"
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
            <div className="flex items-center gap-2.5 min-w-0">
              <Link href="/dashboard">
                <img src="/PBLogo.png" alt="Pepperberry" className="w-7 h-7 object-contain" />
              </Link>
              <h1 className="text-lg font-medium text-fw-text truncate">
                Job Detail
              </h1>
            </div>
            <div className="flex-1" />
            <div className="text-right">
              <p className="text-sm font-medium text-fw-text hidden sm:block">{session.name}</p>
              {sessionExpiry && <SessionTimer expiresAt={sessionExpiry} />}
            </div>
            <UnreadBadges />
            <LogoutButton />
          </div>
          {session.role === 'admin' && (
            <div className="flex items-center gap-2 flex-wrap mt-3">
              <TransferTask
                taskId={typedTask.id}
                currentAssignedTo={typedTask.assigned_to}
                users={transferUsers}
              />
              <Link
                href={`/tasks/${id}/edit`}
                className="px-3 py-1.5 rounded-lg border border-fw-text/20 text-xs font-medium text-fw-text/80 hover:bg-fw-bg transition"
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
          <h2 className={`text-xl font-medium leading-snug ${typedTask.status === 'done' ? 'text-fw-text/50 line-through' : 'text-fw-text'}`}>
            {typedTask.status === 'done' && (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1.5 -mt-0.5 text-fw-accent">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
            {typedTask.title}
          </h2>
          {typedTask.description && (
            <p className="mt-2 text-sm text-fw-text/50 leading-relaxed">
              {typedTask.description}
            </p>
          )}
        </div>

        {/* Status Updater */}
        <div className="bg-fw-surface rounded-xl border border-fw-surface p-5">
          <p className="text-xs font-medium text-fw-text/50 mb-2">Status</p>
          <StatusUpdater taskId={typedTask.id} currentStatus={typedTask.status} />
        </div>

        {/* Details Grid */}
        <div className="bg-fw-surface rounded-xl border border-fw-surface p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-fw-text/50 mb-0.5">Priority</p>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[typedTask.priority]}`} />
                <span className="text-sm text-fw-text">
                  {PRIORITY_LABELS[typedTask.priority]}
                </span>
              </div>
            </div>

            {typedTask.area && (
              <div>
                <p className="text-xs text-fw-text/50 mb-0.5">Area</p>
                <p className="text-sm text-fw-text">
                  {AREA_LABELS[typedTask.area] || typedTask.area}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs text-fw-text/50 mb-0.5">Sub-category</p>
              <p className="text-sm text-fw-text">
                {LOCATION_LABELS[typedTask.location] || typedTask.location}
              </p>
            </div>

            <div>
              <p className="text-xs text-fw-text/50 mb-0.5">Assigned to</p>
              <p className="text-sm text-fw-text">
                {typedTask.assigned_user?.name || 'Unassigned'}
              </p>
            </div>

            <div>
              <p className="text-xs text-fw-text/50 mb-0.5">Due date</p>
              <p className={`text-sm ${isOverdue ? 'text-red-500 font-medium' : 'text-fw-text/80'}`}>
                {isOverdue && 'Overdue — '}
                {formatDate(typedTask.due_date)}
              </p>
            </div>

            <div>
              <p className="text-xs text-fw-text/50 mb-0.5">Created by</p>
              <p className="text-sm text-fw-text">
                {typedTask.created_user?.name || 'Unknown'}
              </p>
            </div>

            <div>
              <p className="text-xs text-fw-text/50 mb-0.5">Created</p>
              <p className="text-sm text-fw-text">
                {formatDate(typedTask.created_at)}
              </p>
            </div>

            {typedTask.recurrence_pattern && (
              <div>
                <p className="text-xs text-fw-text/50 mb-0.5">Repeats</p>
                <p className="text-sm text-fw-text">
                  {RECURRENCE_LABELS[typedTask.recurrence_pattern] || typedTask.recurrence_pattern}
                </p>
              </div>
            )}

            {typedTask.completed_at && (
              <div>
                <p className="text-xs text-fw-text/50 mb-0.5">Completed</p>
                <p className="text-sm text-fw-text">
                  {formatDate(typedTask.completed_at)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sub-tasks */}
        {typedSubtasks.length > 0 && (
          <div className="bg-fw-surface rounded-xl border border-fw-surface p-5">
            <SubtaskChecklist taskId={typedTask.id} subtasks={typedSubtasks} />
          </div>
        )}

        {/* Photos */}
        <div className="bg-fw-surface rounded-xl border border-fw-surface p-5">
          <PhotoSection
            taskId={typedTask.id}
            photos={typedPhotos}
            currentUserId={session.userId}
            currentUserRole={session.role}
            supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
          />
        </div>

        {/* Activity Log */}
        <div className="bg-fw-surface rounded-xl border border-fw-surface p-5">
          <ActivityLog activities={typedActivities} />
        </div>

        {/* Comments */}
        <div className="bg-fw-surface rounded-xl border border-fw-surface p-5">
          <CommentSection taskId={typedTask.id} comments={typedComments} />
        </div>
      </main>
    </div>
  );
}
