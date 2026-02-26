-- Migration: Update location check constraint for new subcategory locations
-- Created: 2026-02-26
-- Rollback: ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_location_check;

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_location_check;

ALTER TABLE public.tasks ADD CONSTRAINT tasks_location_check CHECK (
  location IS NULL OR location IN (
    'garden_front', 'garden_back', 'garden_veggie', 'garden_trees', 'garden_other',
    'paddock_big', 'paddock_front', 'paddock_back', 'paddock_other',
    'house_inside', 'house_patio', 'house_carport', 'house_gym', 'house_other',
    'animals_girls', 'animals_regal', 'animals_donkeys', 'animals_other',
    'workshop', 'house', 'Big_Paddock', 'Front_paddock', 'Back_paddock',
    'driveway', 'riding_arena', 'stables', 'Front_garden', 'Back_garden',
    'VegetablePatch', 'front_gate', 'other'
  )
);
