ALTER TABLE public.restaurant_settings
  ADD COLUMN background_image_url text NOT NULL DEFAULT '/wave-bg.svg',
  ADD COLUMN background_color text NOT NULL DEFAULT '#f1f7f1',
  ADD COLUMN background_overlay_opacity numeric(3,2) NOT NULL DEFAULT 0.82
    CHECK (background_overlay_opacity >= 0 AND background_overlay_opacity <= 1);