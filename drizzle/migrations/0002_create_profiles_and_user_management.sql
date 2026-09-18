-- Kullanıcı profilleri
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  username text NOT NULL UNIQUE,
  email text,
  avatar_url text,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanicilar kendi profilini gorur"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Kullanicilar kendi profilini gunceller"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND is_approved = (SELECT p.is_approved FROM public.profiles p WHERE p.id = auth.uid()));

CREATE POLICY "Adminler profilleri gunceller"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Adminler rol verip alabilsin
CREATE POLICY "Adminler rolleri gorur"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Adminler rol ekler"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Adminler rol siler"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

GRANT INSERT, DELETE ON public.user_roles TO authenticated;

-- Ana yöneticinin admin rolü silinemez
CREATE OR REPLACE FUNCTION public.protect_main_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _email text;
BEGIN
  IF OLD.role <> 'admin'::app_role THEN RETURN OLD; END IF;
  SELECT lower(u.email) INTO _email FROM auth.users u WHERE u.id = OLD.user_id;
  IF _email IS NOT NULL AND EXISTS (SELECT 1 FROM public.admin_allowlist a WHERE lower(a.email) = _email) THEN
    RAISE EXCEPTION 'Ana yöneticinin yetkisi kaldırılamaz.';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER protect_main_admin_delete
BEFORE DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.protect_main_admin();

-- Giriş/kayıt sonrası profili oluşturur, allowlist'teki e-postayı admin + onaylı yapar
CREATE OR REPLACE FUNCTION public.ensure_profile(_username text DEFAULT NULL)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _base text;
  _candidate text;
  _n int := 0;
  _row public.profiles;
  _is_main boolean := false;
BEGIN
  IF _uid IS NULL THEN RETURN NULL; END IF;

  SELECT lower(u.email) INTO _email FROM auth.users u WHERE u.id = _uid;
  _is_main := _email IS NOT NULL AND EXISTS (SELECT 1 FROM public.admin_allowlist a WHERE lower(a.email) = _email);

  SELECT * INTO _row FROM public.profiles WHERE id = _uid;

  IF _row.id IS NULL THEN
    _base := lower(regexp_replace(coalesce(nullif(trim(_username), ''), split_part(coalesce(_email, 'kullanici'), '@', 1)), '[^a-z0-9_.-]', '', 'g'));
    IF _base = '' THEN _base := 'kullanici'; END IF;
    _candidate := _base;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = _candidate) LOOP
      _n := _n + 1;
      _candidate := _base || _n::text;
    END LOOP;

    INSERT INTO public.profiles (id, username, email, is_approved)
    VALUES (_uid, _candidate, _email, _is_main)
    RETURNING * INTO _row;
  ELSE
    IF _row.email IS DISTINCT FROM _email THEN
      UPDATE public.profiles SET email = _email WHERE id = _uid RETURNING * INTO _row;
    END IF;
  END IF;

  IF _is_main THEN
    IF NOT _row.is_approved THEN
      UPDATE public.profiles SET is_approved = true WHERE id = _uid RETURNING * INTO _row;
    END IF;
    INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN _row;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_profile(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_profile(text) TO authenticated;

-- Takma adla giriş için e-posta çözümleme
CREATE OR REPLACE FUNCTION public.email_for_username(_username text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE lower(username) = lower(trim(_username)) LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.email_for_username(text) TO anon, authenticated;

-- Takma adın müsait olup olmadığını kontrol eder
CREATE OR REPLACE FUNCTION public.username_available(_username text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(trim(_username)));
$$;

GRANT EXECUTE ON FUNCTION public.username_available(text) TO anon, authenticated;
