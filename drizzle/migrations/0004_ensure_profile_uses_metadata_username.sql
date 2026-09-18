CREATE OR REPLACE FUNCTION public.ensure_profile(_username text DEFAULT NULL)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _meta text;
  _base text;
  _candidate text;
  _n int := 0;
  _row public.profiles;
  _is_main boolean := false;
BEGIN
  IF _uid IS NULL THEN RETURN NULL; END IF;

  SELECT lower(u.email), u.raw_user_meta_data->>'username'
    INTO _email, _meta
    FROM auth.users u WHERE u.id = _uid;

  _is_main := _email IS NOT NULL AND EXISTS (SELECT 1 FROM public.admin_allowlist a WHERE lower(a.email) = _email);

  SELECT * INTO _row FROM public.profiles WHERE id = _uid;

  IF _row.id IS NULL THEN
    _base := lower(regexp_replace(
      coalesce(nullif(trim(_username), ''), nullif(trim(_meta), ''), split_part(coalesce(_email, 'kullanici'), '@', 1)),
      '[^a-z0-9_.-]', '', 'g'));
    IF _base = '' THEN _base := 'kullanici'; END IF;
    _candidate := _base;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = _candidate) LOOP
      _n := _n + 1;
      _candidate := _base || _n::text;
    END LOOP;

    INSERT INTO public.profiles (id, username, email, is_approved)
    VALUES (_uid, _candidate, _email, _is_main)
    RETURNING * INTO _row;
  ELSIF _row.email IS DISTINCT FROM _email THEN
    UPDATE public.profiles SET email = _email WHERE id = _uid RETURNING * INTO _row;
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
