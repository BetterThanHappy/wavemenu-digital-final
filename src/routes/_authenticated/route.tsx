import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ensureProfile } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    // Profil kaydı yoksa oluşturulur; ana yönetici e-postası otomatik onaylanıp admin olur.
    await ensureProfile();
    return { user: data.user };
  },
  component: () => <Outlet />,
});
