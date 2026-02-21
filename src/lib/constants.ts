export const STATUSES = ['todo', 'in_progress', 'done'] as const;

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export const CATEGORIES = [
  'maintenance',
  'riding_school',
  'horses',
  'donkeys',
  'fencing',
  'general',
] as const;

export const LOCATIONS = [
  'workshop',
  'house',
  'Big_Paddock',
  'Front_paddock',
  'Back_paddock',
  'driveway',
  'riding_arena',
  'stables',
  'Front_garden',
  'Back_garden',
  'VegebtalePatch',
  'front_gate',
] as const;

export const STATUS_LABELS: Record<string, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const CATEGORY_LABELS: Record<string, string> = {
  maintenance: 'Maintenance',
  riding_school: 'Riding School',
  horses: 'Horses',
  donkeys: 'Donkeys',
  fencing: 'Fencing',
  general: 'General',
};

export const RECURRENCE_PATTERNS = ['daily', 'weekly', 'fortnightly', 'monthly'] as const;

export const RECURRENCE_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  fortnightly: 'Fortnightly',
  monthly: 'Monthly',
};

export const LOCATION_LABELS: Record<string, string> = {
  workshop: 'Workshop',
  house: 'House',
  Big_Paddock: 'Big Paddock',
  Front_paddock: 'Front Paddock',
  Back_paddock: 'Back Paddock',
  driveway: 'Driveway',
  riding_arena: 'Riding Arena',
  stables: 'Stables',
  Front_garden: 'Front Garden',
  Back_garden: 'Back Garden',
  VegebtalePatch: 'Veggie Patch',
  front_gate: 'Front Gate',
};
