import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { avatarSignedUrl, isUsernameAvailable, type Profile } from "@/lib/profile";

export function ProfilePanel({ profile }: { profile: Profile | null }) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState(profile?.username ?? "");
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setUsername(profile?.username ?? "");
  }, [profile?.username]);

  // Avatar özel depoda tutulduğu için gösterimde imzalı adres kullanılır.
  const { data: avatarUrl } = useQuery({
    queryKey: ["avatar-url", profile?.avatar_url],
    queryFn: () => avatarSignedUrl(profile?.avatar_url ?? null),
    enabled: Boolean(profile?.avatar_url),
  });

  async function uploadAvatar(file: File) {
    if (!profile) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen bir görsel dosyası seçin.");
      return;
    }
    setUploading(true);
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${profile.id}/avatar-${Date.now()}.${extension}`;
    const upload = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upload.error) {
      setUploading(false);
      toast.error(upload.error.message);
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: path })
      .eq("id", profile.id);
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profil fotoğrafı güncellendi.");
    await queryClient.invalidateQueries({ queryKey: ["my-profile"] });
  }

  async function saveUsername() {
    if (!profile) return;
    const next = username.trim();
    if (next.length < 3) {
      toast.error("Takma ad en az 3 karakter olmalı.");
      return;
    }
    if (next.toLowerCase() !== profile.username.toLowerCase() && !(await isUsernameAvailable(next))) {
      toast.error("Bu takma ad başka bir kullanıcıya ait.");
      return;
    }
    setSavingName(true);
    const { error } = await supabase.from("profiles").update({ username: next }).eq("id", profile.id);
    setSavingName(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Takma ad güncellendi.");
    await queryClient.invalidateQueries({ queryKey: ["my-profile"] });
  }

  async function changePassword() {
    if (newPassword.length < 6) {
      toast.error("Yeni şifre en az 6 karakter olmalı.");
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      ...(currentPassword ? ({ current_password: currentPassword } as Record<string, string>) : {}),
    });
    setSavingPassword(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    toast.success("Şifreniz güncellendi.");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil bilgilerim</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-full border border-border bg-muted">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profil fotoğrafı" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted-foreground">
                  {(profile?.username ?? "?").slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="space-y-2">
              {/* Dosya seçici gizlidir; buton tıklanınca cihazdan görsel seçilir. */}
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadAvatar(file);
                  event.target.value = "";
                }}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
              >
                {uploading ? "Yükleniyor…" : "Fotoğraf yükle"}
              </Button>
              <p className="text-xs text-muted-foreground">PNG veya JPG, en fazla 5 MB.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-username">Takma ad</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="profile-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="max-w-xs"
              />
              <Button onClick={saveUsername} disabled={savingName}>
                Kaydet
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              E-posta: {profile?.email ?? "—"} · Durum: {profile?.is_approved ? "Onaylı" : "Onay bekliyor"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Şifre değiştir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Mevcut şifre</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="max-w-xs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Yeni şifre</Label>
            <Input
              id="new-password"
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="max-w-xs"
            />
          </div>
          <Button onClick={changePassword} disabled={savingPassword}>
            Şifreyi güncelle
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
