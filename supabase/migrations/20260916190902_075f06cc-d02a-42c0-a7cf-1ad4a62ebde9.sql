-- roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are public" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- menu items
CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  tags text[] NOT NULL DEFAULT '{}',
  is_sold_out boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Menu items are public" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Admins manage menu items" ON public.menu_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- settings (single row)
CREATE TABLE public.restaurant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_name text NOT NULL DEFAULT 'WAVE eatery lab.',
  tagline text NOT NULL DEFAULT 'eatery lab.',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  instagram text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'TL',
  theme text NOT NULL DEFAULT 'sage',
  allergen_note text NOT NULL DEFAULT 'Alerji ve hassasiyetleriniz için lütfen sipariş öncesi bilgi veriniz. Çapraz bulaşma riski bulunmaktadır.',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.restaurant_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_settings TO authenticated;
GRANT ALL ON public.restaurant_settings TO service_role;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings are public" ON public.restaurant_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON public.restaurant_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER restaurant_settings_updated_at BEFORE UPDATE ON public.restaurant_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.restaurant_settings (restaurant_name, tagline, currency) VALUES ('WAVE', 'eatery lab.', 'TL');

INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Kahvaltı', 'kahvalti', 1),
  ('Spring Roll', 'spring-roll', 2),
  ('Salata', 'salata', 3),
  ('Ana Yemek', 'ana-yemek', 4),
  ('İçecek', 'icecek', 5);

INSERT INTO public.menu_items (category_id, name, description, price, tags, sort_order)
SELECT c.id, v.name, v.description, v.price, v.tags, v.sort_order
FROM (VALUES
  ('kahvalti', 'Yeşil Omlet Tabağı', 'Ispanak ve fesleğenli yulaflı omlet, istiridye mantar, akdeniz yeşillik, yeşil zeytin', 385, ARRAY['Mantar','Gluten'], 1),
  ('kahvalti', 'Pancake', 'Glutensiz pancake, kakaolu avokado ve antep fıstığı kırığı, yaban mersini reçeli ve limon zest, muz, yaban mersini', 350, ARRAY['Vegan','Kuruyemiş'], 2),
  ('kahvalti', 'Ekmek Üstü Pembe Humus', 'Çavdar ekmeği, pancar humus, istiridye mantar, kuşkonmaz, akdeniz yeşillik, baby turp, çıtır nohut, yeşil zeytin', 420, ARRAY['Vegan','Gluten','Mantar','Susam - Soya'], 3),
  ('kahvalti', 'Ekmek Üstü Poşe Yumurta', 'Çavdar ekmeği, fıstıklı pesto sos, cherry domates, şeftali ızgara, kırmızı soğan, göz yumurta, fesleğen, akdeniz yeşilliği, yeşil zeytin', 450, ARRAY['Gluten','Kuruyemiş'], 4),
  ('kahvalti', 'Chia Pudding Granola Kasesi', 'Yoğurt, matcha chia jeli, yaban mersini reçeli, mango, ruby granola, antep fıstığı ezmesi, hindistan cevizi tozu', 420, ARRAY['Kuruyemiş'], 5),
  ('spring-roll', 'Pinkyroll', 'Pirinç yufkası, pancar humus, avokado, kapya biber, salatalık, ıspanak, çörek otu, tahin sos, limon zest', 385, ARRAY['Vegan','Susam - Soya'], 1),
  ('spring-roll', 'Guacroll', 'Pirinç yufkası, baby turp, guacamole, istiridye mantar, havuç, roka, susam, tahin sos, limon zest', 385, ARRAY['Vegan','Susam - Soya','Mantar'], 2),
  ('salata', 'Green Detox Salata', 'Kale, ıspanak, salatalık, kabak, kinoa, ıspanak sosu, çıtır nohut, kabak çekirdeği', 450, ARRAY['Vegan'], 1),
  ('salata', 'Crunchy Veggie Salata', 'Kale, mor lahana, havuç, salatalık, taze soğan, maydanoz, kapya biber, maş fasulyesi, susam', 430, ARRAY['Vegan','Susam - Soya'], 2),
  ('salata', 'Zesty Avokado Salata', 'Salatalık, taze soğan, maydanoz, akdeniz yeşilliği, avokado, edamame, chili biber, jalapeno biber', 450, ARRAY['Vegan','Susam - Soya'], 3),
  ('ana-yemek', 'Steak Bowl', 'Akdeniz yeşilliği, baby turp, siyah pirinç, ananas salsa, bonfile, fıstıklı pesto sos, kuşkonmaz', 770, ARRAY['Kuruyemiş'], 1),
  ('ana-yemek', 'Somon Bowl', 'Roka, siyah pirinç, edamame, kereviz püresi, somon ızgara, avokado, çörek otu, susam, limon zest', 650, ARRAY['Susam - Soya'], 2),
  ('ana-yemek', 'Tavuk Bowl', 'Roka, kinoa, istiridye mantar, guacamole, tavuk göğsü, confit sos, tatlı patates, jalapeno biber, mango', 550, ARRAY['Mantar'], 3),
  ('ana-yemek', 'Kabak Spagetti', 'Kabak spagetti, ıspanak sos, çıtır nohut, limon zest, fesleğen', 420, ARRAY['Vegan'], 4),
  ('icecek', 'Soğuk Filtre Kahve', '', 170, ARRAY[]::text[], 1),
  ('icecek', 'Soda', '', 100, ARRAY[]::text[], 2),
  ('icecek', 'Wave Detox Suyu', 'Salatalık, limon, chia tohumu', 70, ARRAY['Vegan'], 3),
  ('icecek', 'Türk Kahvesi', '', 120, ARRAY[]::text[], 4),
  ('icecek', 'Double Türk Kahvesi', '', 140, ARRAY[]::text[], 5),
  ('icecek', 'Filtre Kahve', '', 160, ARRAY[]::text[], 6),
  ('icecek', 'Su', '', 50, ARRAY[]::text[], 7)
) AS v(slug, name, description, price, tags, sort_order)
JOIN public.categories c ON c.slug = v.slug;