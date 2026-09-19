import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MAIN_ADMIN_EMAIL, avatarSignedUrl, type Profile } from "@/lib/profile";

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

// Kullanıcının profil fotoğrafını yükleyip gösteren, yoksa baş harfini basan bileşen
function UserAvatar({ path, username }: { path: string | null; username: string }) {
  const { data: url } = useQuery({
    queryKey: ["avatar-url", path],
    queryFn: () => avatarSignedUrl(path),
    enabled: Boolean(path),
  });

  return (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
      {url ? (
        <img src={url} alt={username} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-semibold uppercase text-muted-foreground">
          {(username || "?").slice(0, 1)}
        </div>
      )}
    </div>
  );
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

  async function deleteUser(row: Row) {
    if ((row.email ?? "").toLowerCase() === MAIN_ADMIN_EMAIL) {
      toast.error("Ana yönetici hesabı silinemez.");
      return;
    }

    if (!confirm(`${row.username || row.email} kullanıcısını silmek istediğinize emin misiniz?`)) {
      return;
    }

    await supabase.from("user_roles").delete().eq("user_id", row.id);
    const { error } = await supabase.from("profiles").delete().eq("id", row.id);

    if (error) {
      toast.error("Kullanıcı silinemedi: " + error.message);
      return;
    }

    toast.success("Kullanıcı başarıyla silindi.");
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
          const isMain = (row.email ?? "").toLowerCase() === MAIN_ADMIN_EMAIL;
          return (
            <div
              key={row.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
            >
              {/* PROFİL FOTOĞRAFI + KULLANICI BİLGİSİ */}
              <div className="flex min-w-48 flex-1 items-center gap-3">
                <UserAvatar path={row.avatar_url} username={row.username} />
                <div>
                  <p className="text-sm font-medium">{row.username}</p>
                  <p className="text-xs text-muted-foreground">{row.email}</p>
                </div>
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
                  <Button variant="destructive" size="sm" onClick={() => deleteUser(row)}>
                    Sil
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
