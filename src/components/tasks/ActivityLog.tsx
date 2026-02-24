import { TaskActivity } from '@/lib/types';

interface ActivityLogProps {
  activities: TaskActivity[];
}

const ACTION_ICONS: Record<string, string> = {
  created: 'M12 5v14',
  status_changed: 'M5 12h14',
  assigned: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
  edited: 'M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z',
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ActivityLog({ activities }: ActivityLogProps) {
  if (activities.length === 0) {
    return (
      <div>
        <p className="text-xs font-medium text-fw-text/50 mb-3">Activity</p>
        <p className="text-xs text-fw-text/50">No activity recorded</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium text-fw-text/50 mb-3">Activity</p>
      <div className="space-y-3">
        {activities.map((a) => (
          <div key={a.id} className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-fw-text/40"
              >
                <path d={ACTION_ICONS[a.action] || ACTION_ICONS.edited} />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-fw-text/80">{a.detail}</p>
              <p className="text-[11px] text-fw-text/40 mt-0.5">
                {a.user?.name || 'Unknown'} &middot; {formatTime(a.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
