import { supabase } from "@/integrations/supabase/client";

/**
 * Giriş yapan kullanıcının e-postası yönetici listesindeyse
 * admin rolünü otomatik olarak tanımlar.
 */
export async function claimAdminRole(): Promise<boolean> {
  const { data, error } = await supabase.rpc("claim_admin_role");
  if (error) return false;
  return data === true;
}
