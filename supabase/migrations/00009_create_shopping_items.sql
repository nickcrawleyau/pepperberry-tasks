-- ===========================================
-- SHOPPING LIST (Need to Buy)
-- ===========================================
CREATE TABLE public.shopping_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('hardware', 'hay', 'feed', 'other')),
  added_by uuid NOT NULL REFERENCES public.users(id),
  is_bought boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_shopping_items_category ON public.shopping_items(category);
CREATE INDEX idx_shopping_items_added_by ON public.shopping_items(added_by);
