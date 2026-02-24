import { Task } from '@/lib/types';

interface DashboardStatsProps {
  tasks: Task[];
}

export default function DashboardStats({ tasks }: DashboardStatsProps) {
  const today = new Date(new Date().toDateString());
  const openTasks = tasks.filter((t) => t.status !== 'done');

  const overdue = openTasks.filter(
    (t) => t.due_date && new Date(t.due_date) < today
  ).length;

  const urgentHigh = openTasks.filter(
    (t) => t.priority === 'urgent' || t.priority === 'high'
  ).length;

  const unassigned = openTasks.filter((t) => !t.assigned_to).length;

  // Worker workload — group open tasks by assigned user
  const workload: { name: string; count: number }[] = [];
  const byUser = new Map<string, { name: string; count: number }>();
  let unassignedCount = 0;

  for (const t of openTasks) {
    if (!t.assigned_to) {
      unassignedCount++;
    } else {
      const existing = byUser.get(t.assigned_to);
      if (existing) {
        existing.count++;
      } else {
        byUser.set(t.assigned_to, {
          name: t.assigned_user?.name || 'Unknown',
          count: 1,
        });
      }
    }
  }

  byUser.forEach((v) => workload.push(v));
  workload.sort((a, b) => b.count - a.count);
  if (unassignedCount > 0) {
    workload.push({ name: 'Unassigned', count: unassignedCount });
  }

  const stats = [
    { label: 'Open', value: openTasks.length, color: 'text-fw-text' },
    { label: 'Overdue', value: overdue, color: overdue > 0 ? 'text-red-500' : 'text-fw-text' },
    { label: 'Urgent / High', value: urgentHigh, color: urgentHigh > 0 ? 'text-orange-500' : 'text-fw-text' },
    { label: 'Unassigned', value: unassigned, color: unassigned > 0 ? 'text-fw-accent' : 'text-fw-text' },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-fw-surface rounded-xl border border-fw-surface px-3 py-3 text-center"
          >
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-fw-text/50 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Worker workload */}
      {workload.length > 0 && (
        <div className="bg-fw-surface rounded-xl border border-fw-surface px-4 py-3">
          <p className="text-xs font-medium text-fw-text/50 mb-2.5">Workload</p>
          <div className="flex flex-wrap gap-2">
            {workload.map((w) => (
              <span
                key={w.name}
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${
                  w.name === 'Unassigned'
                    ? 'border-fw-surface text-fw-text/50 italic'
                    : 'border-fw-surface text-fw-text/80'
                }`}
              >
                {w.name}
                <span className="text-fw-text/50 font-medium">{w.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
