'use client';

import { useMemo } from 'react';
import { AREA_LABELS } from '@/lib/constants';

interface ReportTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  area: string | null;
  assigned_to: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  assigned_user?: { name: string }[] | { name: string } | null;
}

interface ReportActivity {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  detail: string;
  created_at: string;
  user?: { name: string }[] | { name: string } | null;
  task?: { title: string }[] | { title: string } | null;
}

interface ReportUser {
  id: string;
  name: string;
  role: string;
  trade_type: string | null;
  is_active: boolean;
}

interface CompletedTask {
  id: string;
  assigned_to: string | null;
  completed_at: string | null;
  assigned_user?: { name: string }[] | { name: string } | null;
}

interface ReportLogin {
  user_id: string;
  logged_in_at: string;
  latitude: number | null;
  longitude: number | null;
  ip_address: string | null;
  user?: { name: string }[] | { name: string } | null;
}

interface ReportViewProps {
  allTasks: ReportTask[];
  recentActivity: ReportActivity[];
  users: ReportUser[];
  completedRecent: CompletedTask[];
  recentLogins: ReportLogin[];
}

const ACTION_ICONS: Record<string, string> = {
  created: 'M12 5v14',
  status_changed: 'M5 12h14',
  assigned: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
  edited: 'M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z',
};

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Australia/Sydney',
  });
}

function getWeekLabel(weeksAgo: number): string {
  if (weeksAgo === 0) return 'This week';
  if (weeksAgo === 1) return 'Last week';
  return `${weeksAgo} weeks ago`;
}

export default function ReportView({ allTasks, recentActivity, users, completedRecent, recentLogins }: ReportViewProps) {
  const today = useMemo(() => new Date(new Date().toDateString()), []);

  // Summary stats
  const openTasks = allTasks.filter((t) => t.status !== 'done');
  const overdue = openTasks.filter((t) => t.due_date && new Date(t.due_date) < today).length;

  const startOfWeek = useMemo(() => {
    const now = new Date();
    const s = new Date(now);
    const dow = now.getDay();
    s.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    s.setHours(0, 0, 0, 0);
    return s;
  }, []);

  const startOfMonth = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);

  const completedThisWeek = completedRecent.filter(
    (t) => t.completed_at && new Date(t.completed_at) >= startOfWeek
  ).length;
  const completedThisMonth = completedRecent.filter(
    (t) => t.completed_at && new Date(t.completed_at) >= startOfMonth
  ).length;

  const stats = [
    { label: 'Open', value: openTasks.length, color: 'text-fw-text' },
    { label: 'Done this week', value: completedThisWeek, color: 'text-fw-accent' },
    { label: 'Done this month', value: completedThisMonth, color: 'text-fw-accent' },
    { label: 'Overdue', value: overdue, color: overdue > 0 ? 'text-red-500' : 'text-fw-text' },
  ];

  // Jobs by area
  const areaBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of openTasks) {
      const key = t.area || 'none';
      counts[key] = (counts[key] || 0) + 1;
    }
    const max = Math.max(...Object.values(counts), 1);
    return Object.entries(counts)
      .map(([area, count]) => ({
        area,
        label: area === 'none' ? 'No area' : AREA_LABELS[area] || area,
        count,
        pct: (count / max) * 100,
      }))
      .sort((a, b) => b.count - a.count);
  }, [openTasks]);

  // Worker performance
  const workerStats = useMemo(() => {
    const map = new Map<string, { name: string; assigned: number; completedWeek: number; completedMonth: number }>();

    for (const u of users) {
      if (u.role === 'admin') continue;
      map.set(u.id, { name: u.name, assigned: 0, completedWeek: 0, completedMonth: 0 });
    }

    for (const t of openTasks) {
      if (t.assigned_to && map.has(t.assigned_to)) {
        map.get(t.assigned_to)!.assigned++;
      }
    }

    for (const t of completedRecent) {
      if (!t.assigned_to || !map.has(t.assigned_to)) continue;
      const entry = map.get(t.assigned_to)!;
      if (t.completed_at && new Date(t.completed_at) >= startOfWeek) entry.completedWeek++;
      if (t.completed_at && new Date(t.completed_at) >= startOfMonth) entry.completedMonth++;
    }

    return Array.from(map.values()).sort((a, b) => b.assigned - a.assigned);
  }, [users, openTasks, completedRecent, startOfWeek, startOfMonth]);

  // Completion trends (4 weeks)
  const weeklyTrends = useMemo(() => {
    const weeks: { label: string; count: number; pct: number }[] = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(startOfWeek);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const count = completedRecent.filter(
        (t) => t.completed_at && new Date(t.completed_at) >= weekStart && new Date(t.completed_at) < weekEnd
      ).length;

      weeks.push({ label: getWeekLabel(i), count, pct: 0 });
    }
    const max = Math.max(...weeks.map((w) => w.count), 1);
    weeks.forEach((w) => (w.pct = (w.count / max) * 100));
    return weeks;
  }, [completedRecent, startOfWeek]);

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-fw-surface rounded-xl border border-fw-surface px-3 py-3 text-center">
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-fw-text/50 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Jobs by area */}
      {areaBreakdown.length > 0 && (
        <div className="bg-fw-surface rounded-xl border border-fw-surface px-4 py-3">
          <p className="text-xs font-medium text-fw-text/50 mb-3">Open Jobs by Area</p>
          <div className="space-y-2">
            {areaBreakdown.map(({ area, label, count, pct }) => (
              <div key={area}>
                <div className="flex justify-between text-sm text-fw-text/80 mb-1">
                  <span>{label}</span>
                  <span className="text-fw-text/50">{count}</span>
                </div>
                <div className="h-2 bg-fw-bg rounded-full overflow-hidden">
                  <div className="h-full bg-fw-accent rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion trends */}
      <div className="bg-fw-surface rounded-xl border border-fw-surface px-4 py-3">
        <p className="text-xs font-medium text-fw-text/50 mb-3">Completion Trends</p>
        <div className="space-y-2">
          {weeklyTrends.map((week) => (
            <div key={week.label}>
              <div className="flex justify-between text-sm text-fw-text/80 mb-1">
                <span>{week.label}</span>
                <span className="text-fw-text/50">{week.count} completed</span>
              </div>
              <div className="h-2 bg-fw-bg rounded-full overflow-hidden">
                <div className="h-full bg-fw-accent rounded-full" style={{ width: `${week.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Worker performance */}
      {workerStats.length > 0 && (
        <div className="bg-fw-surface rounded-xl border border-fw-surface px-4 py-3">
          <p className="text-xs font-medium text-fw-text/50 mb-3">Worker Performance</p>
          <div className="space-y-0">
            {workerStats.map((w) => (
              <div key={w.name} className="flex items-center justify-between py-2 border-b border-fw-bg last:border-0">
                <span className="text-sm text-fw-text/80">{w.name}</span>
                <div className="flex gap-4 text-xs text-fw-text/50">
                  <span>{w.assigned} assigned</span>
                  <span className="text-fw-accent">{w.completedWeek}/wk</span>
                  <span>{w.completedMonth}/mo</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div className="bg-fw-surface rounded-xl border border-fw-surface px-4 py-3">
          <p className="text-xs font-medium text-fw-text/50 mb-3">Recent Activity</p>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fw-text/40">
                    <path d={ACTION_ICONS[a.action] || ACTION_ICONS.edited} />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-fw-text/80">{a.detail}</p>
                  <p className="text-xs text-fw-text/50 mt-0.5">
                    {(Array.isArray(a.user) ? a.user[0]?.name : a.user?.name) || 'Unknown'}
                    {(() => { const title = Array.isArray(a.task) ? a.task[0]?.title : a.task?.title; return title ? <> &middot; <span className="text-fw-text/50">{title}</span></> : null; })()}
                    {' '}&middot; {formatTime(a.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent logins */}
      {recentLogins.length > 0 && (
        <div className="bg-fw-surface rounded-xl border border-fw-surface px-4 py-3">
          <p className="text-xs font-medium text-fw-text/50 mb-3">Recent Logins</p>
          <div className="space-y-2">
            {recentLogins.map((l, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-fw-bg last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-fw-text/80">{(Array.isArray(l.user) ? l.user[0]?.name : l.user?.name) || 'Unknown'}</span>
                  {l.latitude && l.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${l.latitude},${l.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-fw-accent hover:text-fw-accent/80 transition"
                      title="View on map"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </a>
                  )}
                </div>
                <span className="text-xs text-fw-text/50 shrink-0">{formatTime(l.logged_in_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
