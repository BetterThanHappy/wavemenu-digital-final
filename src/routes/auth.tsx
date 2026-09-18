import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ensureProfile, emailForUsername, isUsernameAvailable } from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Yönetici Girişi — WAVE eatery lab." },
      { name: "description", content: "WAVE eatery lab. menü yönetim paneli girişi." },
      { property: "og:title", content: "Yönetici Girişi — WAVE eatery lab." },
      { property: "og:description", content: "WAVE eatery lab. menü yönetim paneli girişi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot" | "magic";

const TITLES: Record<Mode, string> = {
  signin: "Hesabınızla giriş yapın.",
  signup: "Yeni yönetici hesabı oluşturun.",
  forgot: "E-postanıza şifre sıfırlama bağlantısı gönderelim.",
  magic: "Şifresiz giriş için e-postanıza sihirli bağlantı gönderelim.",
};

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  // Giriş alanı hem e-posta hem takma ad kabul eder; kayıt sırasında e-posta zorunludur.
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSignupHint, setShowSignupHint] = useState(false);
  const [sent, setSent] = useState<null | "reset" | "magic">(null);

  function switchMode(next: Mode) {
    setMode(next);
    setShowSignupHint(false);
    setSent(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        // Girilen değerde "@" yoksa takma ad kabul edilir ve e-posta adresi çözülür.
        let loginEmail = email.trim();
        if (!loginEmail.includes("@")) {
          const resolved = await emailForUsername(loginEmail);
          if (!resolved) {
            setShowSignupHint(true);
            throw new Error("Bu takma ada sahip bir hesap bulunamadı.");
          }
          loginEmail = resolved;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });
        if (error) {
          setShowSignupHint(true);
          throw error;
        }
        setShowSignupHint(false);
        await ensureProfile();
        navigate({ to: "/admin" });
      } else if (mode === "signup") {
        const desiredUsername = username.trim();
        if (desiredUsername.length < 3) {
          throw new Error("Takma ad en az 3 karakter olmalı.");
        }
        if (!(await isUsernameAvailable(desiredUsername))) {
          throw new Error("Bu takma ad zaten alınmış. Lütfen başka bir tane deneyin.");
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`,
            data: { username: desiredUsername },
          },
        });
        if (error) throw error;
        if (data.session) {
          await ensureProfile(desiredUsername);
          navigate({ to: "/admin" });
        } else {
          toast.success("Hesap oluşturuldu. E-postanızdaki onay bağlantısına tıklayın.");
        }
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("reset");
        toast.success("Şifre sıfırlama bağlantısı e-postanıza gönderildi.");
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        setSent("magic");
        toast.success("Giriş bağlantısı e-postanıza gönderildi.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "İşlem tamamlanamadı");
    } finally {
      setLoading(false);
    }
  }

  const showPassword = mode === "signin" || mode === "signup";
  const submitLabel =
    mode === "signin"
      ? "Giriş yap"
      : mode === "signup"
        ? "Kayıt ol"
        : mode === "forgot"
          ? "Sıfırlama bağlantısı gönder"
          : "Sihirli bağlantı gönder";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-mint/50 to-background px-5 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="tracking-[0.15em] uppercase">Yönetim Paneli</CardTitle>
          <CardDescription>{TITLES[mode]}</CardDescription>
        </CardHeader>
        <CardContent>
          {showSignupHint && mode === "signin" && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Giriş yapılamadı</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>E-posta veya şifre hatalı. Hesabınız yoksa hemen oluşturabilirsiniz.</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={() => switchMode("signup")}>
                    Kayıt olun
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => switchMode("forgot")}
                  >
                    Şifremi unuttum
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {sent && (
            <Alert className="mb-4">
              <AlertTitle>E-postanızı kontrol edin</AlertTitle>
              <AlertDescription>
                {sent === "reset"
                  ? "Şifre sıfırlama bağlantısını gönderdik. Bağlantıya tıklayıp yeni şifrenizi belirleyin."
                  : "Giriş bağlantısını gönderdik. Bağlantıya tıkladığınızda şifresiz giriş yapacaksınız."}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="username">Takma ad</Label>
                <Input
                  id="username"
                  required
                  minLength={3}
                  placeholder="ornek_kullanici"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Takma adınız benzersiz olmalı; girişte e-posta yerine de kullanabilirsiniz.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{mode === "signin" ? "E-posta veya takma ad" : "E-posta"}</Label>
              <Input
                id="email"
                type={mode === "signin" ? "text" : "email"}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {showPassword && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Şifre</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-xs text-primary hover:underline"
                    >
                      Şifremi unuttum
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {submitLabel}
            </Button>
          </form>

          <div className="mt-4 space-y-2 text-center text-xs">
            {mode === "signin" && (
              <button
                type="button"
                onClick={() => switchMode("magic")}
                className="w-full text-muted-foreground hover:text-primary"
              >
                Şifresiz giriş: sihirli bağlantı gönder
              </button>
            )}
            {(mode === "forgot" || mode === "magic") && (
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="w-full text-muted-foreground hover:text-primary"
              >
                Şifreyle girişe dön
              </button>
            )}
            <button
              type="button"
              onClick={() => switchMode(mode === "signup" ? "signin" : "signup")}
              className="w-full text-muted-foreground hover:text-primary"
            >
              {mode === "signup"
                ? "Zaten hesabınız var mı? Giriş yapın"
                : "Hesabınız yok mu? Kayıt olun"}
            </button>
            <Link to="/" className="block text-muted-foreground hover:text-primary">
              Menüye dön
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
