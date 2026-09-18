import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { claimAdminRole } from "@/lib/claim-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Şifre Sıfırlama — WAVE eatery lab." },
      { name: "description", content: "WAVE eatery lab. yönetim paneli için yeni şifre belirleyin." },
      { property: "og:title", content: "Şifre Sıfırlama — WAVE eatery lab." },
      { property: "og:description", content: "WAVE eatery lab. yönetim paneli için yeni şifre belirleyin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setReady(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      toast.error("Şifreler eşleşmiyor.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await claimAdminRole();
      toast.success("Şifreniz güncellendi.");
      navigate({ to: "/admin" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Şifre güncellenemedi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-mint/50 to-background px-5">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="tracking-[0.15em] uppercase">Yeni Şifre</CardTitle>
          <CardDescription>
            {ready
              ? "Hesabınız için yeni bir şifre belirleyin."
              : "Bağlantı doğrulanıyor. E-postanızdaki sıfırlama bağlantısını kullandığınızdan emin olun."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Yeni şifre</Label>
              <Input
                id="new-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Yeni şifre (tekrar)</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !ready}>
              Şifreyi güncelle
            </Button>
          </form>
          <Link
            to="/auth"
            className="mt-4 block text-center text-xs text-muted-foreground hover:text-primary"
          >
            Giriş sayfasına dön
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
