-- Migration: Simplify location values to flat list
-- Created: 2026-02-27
-- Rollback: Re-run previous constraint migration

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_location_check;

ALTER TABLE public.tasks ADD CONSTRAINT tasks_location_check CHECK (
  location IS NULL OR location IN (
    'house', 'front_garden', 'back_garden', 'driveway',
    'veggie_beds', 'workshop', 'paddocks', 'other',
    -- Legacy values for existing tasks
    'garden_front', 'garden_back', 'garden_veggie', 'garden_trees', 'garden_other',
    'paddock_big', 'paddock_front', 'paddock_back', 'paddock_other',
    'house_inside', 'house_patio', 'house_carport', 'house_gym', 'house_other',
    'animals_girls', 'animals_regal', 'animals_donkeys', 'animals_dolly', 'animals_other',
    'Big_Paddock', 'Front_paddock', 'Back_paddock',
    'riding_arena', 'stables', 'Front_garden', 'Back_garden',
    'VegetablePatch', 'front_gate'
  )
);
