import { supabase } from "@/integrations/supabase/client";

// Ana yönetici: bu e-posta her zaman onaylı ve yöneticidir, yetkisi arayüzden kaldırılamaz.
export const MAIN_ADMIN_EMAIL = "xxalmedalmeda96@gmail.com";

export type Profile = {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  is_approved: boolean;
  created_at: string;
};

/**
 * Giriş/kayıt sonrasında profil kaydını oluşturur veya günceller.
 * Allowlist'teki e-posta otomatik olarak onaylanır ve yönetici rolü alır.
 */
export async function ensureProfile(username?: string): Promise<Profile | null> {
  const { data, error } = await supabase.rpc(
    "ensure_profile",
    username ? { _username: username } : {},
  );
  if (error) return null;
  return (data as Profile | null) ?? null;
}

/** Takma adın boşta olup olmadığını kontrol eder. */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("username_available", { _username: username });
  if (error) return false;
  return data === true;
}

/** Takma addan e-posta çözer (takma adla giriş için). */
export async function emailForUsername(username: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("email_for_username", { _username: username });
  if (error) return null;
  return (data as string | null) ?? null;
}

/**
 * Avatar dosyaları özel bir depoda tutulur; görüntülemek için kısa ömürlü imzalı adres üretilir.
 */
export async function avatarSignedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}
