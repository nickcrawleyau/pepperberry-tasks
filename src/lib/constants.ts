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
  'garden_front',
  'garden_back',
  'garden_veggie',
  'garden_trees',
  'garden_other',
  'paddock_big',
  'paddock_front',
  'paddock_back',
  'paddock_other',
  'house_inside',
  'house_patio',
  'house_carport',
  'house_gym',
  'house_other',
  'animals_girls',
  'animals_regal',
  'animals_donkeys',
  'animals_dolly',
  'animals_other',
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
  garden: ['garden_front', 'garden_back', 'garden_veggie', 'garden_trees', 'garden_other'],
  paddocks: ['paddock_big', 'paddock_front', 'paddock_back', 'paddock_other'],
  house: ['house_inside', 'house_patio', 'house_carport', 'house_gym', 'house_other'],
  animals: ['animals_girls', 'animals_regal', 'animals_donkeys', 'animals_dolly', 'animals_other'],
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
  garden_front: 'Front',
  garden_back: 'Back',
  garden_veggie: 'Veggie Beds',
  garden_trees: 'Trees',
  garden_other: 'Other',
  paddock_big: 'Big',
  paddock_front: 'Front',
  paddock_back: 'Back',
  paddock_other: 'Other',
  house_inside: 'Inside',
  house_patio: 'Patio',
  house_carport: 'Car Port',
  house_gym: 'Gym',
  house_other: 'Other',
  animals_girls: 'The Girls',
  animals_regal: 'Regal',
  animals_donkeys: 'Donkeys',
  animals_dolly: 'Dolly',
  animals_other: 'Other',
};
