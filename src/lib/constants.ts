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
  'house',
  'front_garden',
  'back_garden',
  'driveway',
  'veggie_beds',
  'workshop',
  'paddocks',
  'other',
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

export const AREAS = ['garden', 'paddocks', 'house', 'animals'] as const;

export const AREA_LABELS: Record<string, string> = {
  garden: 'Garden',
  paddocks: 'Paddocks',
  house: 'House',
  animals: 'Animals',
};

export const AREA_LOCATIONS: Record<string, readonly string[]> = {
  garden: ['front_garden', 'back_garden', 'veggie_beds', 'other'],
  paddocks: ['paddocks', 'other'],
  house: ['house', 'driveway', 'workshop', 'other'],
  animals: ['paddocks', 'house', 'other'],
};

export const AREA_CATEGORIES: Record<string, readonly string[]> = {
  garden: ['maintenance', 'general'],
  paddocks: ['fencing', 'riding_school', 'maintenance', 'general'],
  house: ['maintenance', 'general'],
  animals: ['horses', 'donkeys', 'riding_school'],
};

export const MAX_SUBTASKS = 5;

export const MAX_PHOTOS_PER_TASK = 5;
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
];

export const SHOPPING_CATEGORIES = ['hardware', 'hay', 'feed', 'other'] as const;

export const MAX_CHAT_MESSAGE_LENGTH = 500;

export const SHOPPING_CATEGORY_LABELS: Record<string, string> = {
  hardware: 'Hardware',
  hay: 'Hay',
  feed: 'Feed',
  other: 'Other',
};

export const LOCATION_LABELS: Record<string, string> = {
  house: 'House',
  front_garden: 'Front Garden',
  back_garden: 'Back Garden',
  driveway: 'Driveway',
  veggie_beds: 'Veggie Beds',
  workshop: 'Workshop',
  paddocks: 'Paddocks',
  other: 'Other',
};
