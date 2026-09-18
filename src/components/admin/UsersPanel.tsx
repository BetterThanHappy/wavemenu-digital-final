import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MAIN_ADMIN_EMAIL, type Profile } from "@/lib/profile";

type Row = Profile & { isAdmin: boolean };

// Tüm kullanıcıları ve rollerini tek listede toplar (yalnız yöneticiler okuyabilir).
function useUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<Row[]> => {
      const [profiles, roles] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, email, avatar_url, is_approved, created_at")
          .order("created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (profiles.error) throw profiles.error;
      if (roles.error) throw roles.error;
      const adminIds = new Set(
        (roles.data ?? []).filter((r) => r.role === "admin").map((r) => r.user_id),
      );
      return (profiles.data ?? []).map((p) => ({ ...p, isAdmin: adminIds.has(p.id) }) as Row);
    },
  });
}

export function UsersPanel() {
  const queryClient = useQueryClient();
  const { data: users, isLoading, error } = useUsers();

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  }

  async function toggleApproval(row: Row) {
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: !row.is_approved })
      .eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(row.is_approved ? "Onay kaldırıldı." : "Kullanıcı onaylandı.");
    await refresh();
  }

  async function toggleAdmin(row: Row) {
    if (row.isAdmin) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", row.id)
        .eq("role", "admin");
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Yönetici yetkisi kaldırıldı.");
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: row.id, role: "admin" });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Yönetici yetkisi verildi.");
    }
    await refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kullanıcılar &amp; yetkiler</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Kullanıcılar yükleniyor…</p>}
        {error && <p className="text-sm text-destructive">Kullanıcı listesi alınamadı.</p>}
        {users?.length === 0 && <p className="text-sm text-muted-foreground">Henüz kullanıcı yok.</p>}

        {users?.map((row) => {
          // Ana yöneticinin onayı ve rolü arayüzden değiştirilemez.
          const isMain = (row.email ?? "").toLowerCase() === MAIN_ADMIN_EMAIL;
          return (
            <div
              key={row.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
            >
              <div className="min-w-48 flex-1">
                <p className="text-sm font-medium">{row.username}</p>
                <p className="text-xs text-muted-foreground">{row.email}</p>
              </div>
              <Badge variant={row.is_approved ? "default" : "secondary"}>
                {row.is_approved ? "Onaylı" : "Onay bekliyor"}
              </Badge>
              <Badge variant={row.isAdmin ? "default" : "outline"}>
                {row.isAdmin ? "Yönetici" : "Kullanıcı"}
              </Badge>
              {isMain ? (
                <span className="text-xs text-muted-foreground">Ana yönetici</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleApproval(row)}>
                    {row.is_approved ? "Onayı kaldır" : "Onayla"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleAdmin(row)}>
                    {row.isAdmin ? "Yöneticiliği al" : "Yönetici yap"}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
