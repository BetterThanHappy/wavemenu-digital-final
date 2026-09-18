import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { menuQueryOptions } from "@/lib/menu-queries";
import { formatPrice, type MenuItem } from "@/lib/menu-types";
import { ensureProfile, type Profile } from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemDialog } from "@/components/admin/ItemDialog";
import { CategoriesPanel } from "@/components/admin/CategoriesPanel";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { UsersPanel } from "@/components/admin/UsersPanel";
import { ProfilePanel } from "@/components/admin/ProfilePanel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Yönetim Paneli — WAVE eatery lab." },
      { name: "description", content: "Menü ürünlerini, kategorileri ve ayarları yönetin." },
      { property: "og:title", content: "Yönetim Paneli — WAVE eatery lab." },
      { property: "og:description", content: "Menü ürünlerini, kategorileri ve ayarları yönetin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function useIsAdmin() {
  // Rol kontrolü tarayıcıdaki bir değere değil, oturum açmış kullanıcının güvenli rol kaydına dayanır.
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return { isAdmin: false, email: "" };
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return { isAdmin: Boolean(data), email: userData.user?.email ?? "" };
    },
  });
}

// Kendi profil kaydımız: yoksa otomatik oluşturulur, onay durumu buradan okunur.
function useMyProfile() {
  return useQuery({
    queryKey: ["my-profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("id, username, email, avatar_url, is_approved, created_at")
        .eq("id", userId)
        .maybeSingle();
      if (data) return data as Profile;
      return await ensureProfile();
    },
  });
}

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: menu } = useSuspenseQuery(menuQueryOptions);
  const { data: access, isLoading } = useIsAdmin();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);

  useEffect(() => {
    // Yönetici ekranı da müşterinin göreceği açık/koyu temayı aynı renklerle önizler.
    document.documentElement.classList.toggle("dark", menu.settings?.theme === "dark");
  }, [menu.settings?.theme]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function toggleSoldOut(item: MenuItem, soldOut: boolean) {
    // Bu işlem ürünü silmez; yalnızca müşteri kartını soluklaştırıp "Tükendi" rozeti ekler.
    const { error } = await supabase
      .from("menu_items")
      .update({ is_sold_out: soldOut })
      .eq("id", item.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["menu"] });
  }

  async function deleteItem(item: MenuItem) {
    // Kalıcı silme öncesinde yanlış dokunmaları önlemek için tarayıcı onayı alınır.
    if (!window.confirm(`"${item.name}" silinecek. Emin misiniz?`)) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", item.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Ürün silindi.");
    await queryClient.invalidateQueries({ queryKey: ["menu"] });
  }

  const currency = menu.settings?.currency ?? "TL";
  const isAdmin = Boolean(access?.isAdmin);
  // Menü ve ayar sekmeleri yalnızca onaylı hesaplara veya yöneticilere açıktır.
  const canManage = isAdmin || Boolean(profile?.is_approved);
  const checking = isLoading || profileLoading;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-[0.15em] uppercase">Yönetim Paneli</h1>
            <p className="text-xs text-muted-foreground">{profile?.username ?? access?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-sm text-primary hover:underline">
              Menüyü gör
            </Link>
            <Button variant="outline" size="sm" onClick={signOut}>
              Çıkış yap
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        {checking && <p className="text-sm text-muted-foreground">Yetkiler kontrol ediliyor…</p>}

        {!checking && !canManage && (
          <Card className="mx-auto max-w-lg text-center">
            <CardHeader>
              <CardTitle className="text-xl">Hesabınız onay bekliyor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Kaydınız alındı. Bir yönetici hesabınızı onayladıktan sonra menü ve ayar sekmeleri
                burada görünecek.
              </p>
              <p>
                Takma adınız: <span className="font-medium text-foreground">{profile?.username}</span>
              </p>
              <div className="flex justify-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/">Menüye dön</Link>
                </Button>
                <Button size="sm" onClick={signOut}>
                  Çıkış yap
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!checking && canManage && (
          <Tabs defaultValue="items">
            {/* Her sekme ayrı bir yönetim işini toplar; ürün listesi varsayılan olarak açıktır. */}
            <TabsList>
              <TabsTrigger value="items">Ürünler</TabsTrigger>
              <TabsTrigger value="categories">Kategoriler</TabsTrigger>
              <TabsTrigger value="settings">Ayarlar</TabsTrigger>
              {isAdmin && <TabsTrigger value="users">Kullanıcılar &amp; Yetkiler</TabsTrigger>}
              <TabsTrigger value="profile">Profilim</TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="mt-6 space-y-6">
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setEditing(null);
                    setDialogOpen(true);
                  }}
                >
                  Yeni ürün ekle
                </Button>
              </div>
              {menu.categories.map((category) => {
                // Ürünler kendi kategori kartlarının altında gösterilir.
                const items = menu.items.filter((item) => item.category_id === category.id);
                return (
                  <Card key={category.id}>
                    <CardHeader>
                      <CardTitle className="text-sm tracking-[0.2em] text-primary uppercase">
                        {category.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {items.length === 0 && (
                        <p className="text-sm text-muted-foreground">Bu kategoride ürün yok.</p>
                      )}
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            "flex flex-wrap items-center gap-3 rounded-lg border border-border p-3",
                            item.is_sold_out && "opacity-70",
                          )}
                        >
                          <div className="min-w-48 flex-1">
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="line-clamp-1 text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-primary">
                            {formatPrice(item.price, currency)}
                          </span>
                          <label className="flex items-center gap-2 text-xs text-muted-foreground">
                            Tükendi
                            <Switch
                              checked={item.is_sold_out}
                              onCheckedChange={(checked) => toggleSoldOut(item, checked)}
                            />
                          </label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditing(item);
                              setDialogOpen(true);
                            }}
                          >
                            Düzenle
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteItem(item)}>
                            Sil
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="categories" className="mt-6">
              <CategoriesPanel categories={menu.categories} items={menu.items} />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <SettingsPanel settings={menu.settings} />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="users" className="mt-6">
                <UsersPanel />
              </TabsContent>
            )}

            <TabsContent value="profile" className="mt-6">
              <ProfilePanel profile={profile ?? null} />
            </TabsContent>
          </Tabs>
        )}
      </main>

      <ItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        categories={menu.categories}
      />
    </div>
  );
}
