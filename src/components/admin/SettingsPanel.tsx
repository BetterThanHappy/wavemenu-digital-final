import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_ALLERGEN_NOTE, type RestaurantSettings } from "@/lib/menu-types";

// Yönetici, renk kodu yazmak yerine bu güvenli pastel seçeneklerden birini de seçebilir.
const BACKGROUND_PRESETS = [
  { label: "Wave mavisi", value: "#f4f7f9" },
  { label: "Açık gök", value: "#e6eef4" },
  { label: "Kırık beyaz", value: "#fbfcfd" },
] as const;

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export function SettingsPanel({ settings }: { settings: RestaurantSettings | null }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    restaurant_name: settings?.restaurant_name ?? "WAVE",
    tagline: settings?.tagline ?? "eatery lab.",
    phone: settings?.phone ?? "",
    address: settings?.address ?? "",
    instagram: settings?.instagram ?? "",
    currency: settings?.currency ?? "TL",
    theme: settings?.theme ?? "sage",
    allergen_note: settings?.allergen_note || DEFAULT_ALLERGEN_NOTE,
    // Yeni bir kurulumda yerel dalga deseni ve açık adaçayı zemini otomatik kullanılır.
    background_image_url: settings?.background_image_url ?? "/wave-bg.svg",
    background_color: settings?.background_color ?? "#f4f7f9",
    background_overlay_opacity: settings?.background_overlay_opacity ?? 0.82,
  });
  const [saving, setSaving] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    // CSS'e aktarılacak renk değerini yalnızca altı haneli HEX biçiminde kabul ediyoruz.
    if (!HEX_COLOR_PATTERN.test(form.background_color)) {
      toast.error("Arka plan rengi #f4f7f9 biçiminde olmalıdır.");
      return;
    }
    setSaving(true);
    const { error } = settings
      ? await supabase.from("restaurant_settings").update(form).eq("id", settings.id)
      : await supabase.from("restaurant_settings").insert(form);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Ayarlar kaydedildi.");
    // Menü sorgusunu yenilemek, açık menü sekmesinde de yeni görünümün alınmasını sağlar.
    await queryClient.invalidateQueries({ queryKey: ["menu"] });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Restoran ayarları</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rname">Restoran adı</Label>
            <Input
              id="rname"
              value={form.restaurant_name}
              onChange={(e) => update("restaurant_name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tagline">Alt başlık</Label>
            <Input
              id="tagline"
              value={form.tagline}
              onChange={(e) => update("tagline", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              value={form.instagram}
              onChange={(e) => update("instagram", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Adres</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Para birimi</Label>
            <Input
              id="currency"
              value={form.currency}
              onChange={(e) => update("currency", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Tema</Label>
            <Select value={form.theme} onValueChange={(value) => update("theme", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sage">Açık adaçayı</SelectItem>
                <SelectItem value="mint">Mint</SelectItem>
                <SelectItem value="dark">Koyu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Arka plan bölümü: URL boşsa görsel kapatılır; /wave-bg.svg varsayılan yerel desendir. */}
        <div className="space-y-4 border-t border-border pt-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Menü arka planı</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Bir görsel adresi kullanın veya boş bırakarak yalnızca seçtiğiniz rengi gösterin.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="background-image">Arka plan görsel URL&apos;si</Label>
            <Input
              id="background-image"
              type="url"
              placeholder="/wave-bg.svg veya https://..."
              value={form.background_image_url}
              onChange={(event) => update("background_image_url", event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => update("background_image_url", "/wave-bg.svg")}
              >
                Dalga desenini kullan
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => update("background_image_url", "")}
              >
                Görseli kaldır
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="background-color">Arka plan rengi</Label>
            <div className="flex items-center gap-3">
              <Input
                id="background-color-picker"
                type="color"
                aria-label="Arka plan rengini seç"
                value={HEX_COLOR_PATTERN.test(form.background_color) ? form.background_color : "#f4f7f9"}
                onChange={(event) => update("background_color", event.target.value)}
                className="h-10 w-14 cursor-pointer p-1"
              />
              <Input
                id="background-color"
                value={form.background_color}
                onChange={(event) => update("background_color", event.target.value)}
                placeholder="#f4f7f9"
                maxLength={7}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {BACKGROUND_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  type="button"
                  variant={form.background_color === preset.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => update("background_color", preset.value)}
                >
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 rounded-full border border-border"
                    style={{ backgroundColor: preset.value }}
                  />
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="background-opacity">Görsel örtüsü</Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                %{Math.round(form.background_overlay_opacity * 100)}
              </span>
            </div>
            <Slider
              id="background-opacity"
              min={0.35}
              max={0.95}
              step={0.05}
              value={[form.background_overlay_opacity]}
              onValueChange={([value]) => {
                if (value !== undefined) {
                  setForm((previous) => ({ ...previous, background_overlay_opacity: value }));
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Değer yükseldikçe görsel silikleşir ve menü metinleri daha rahat okunur.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="allergen">Alerjen uyarısı</Label>
          <Textarea
            id="allergen"
            rows={3}
            value={form.allergen_note}
            onChange={(e) => update("allergen_note", e.target.value)}
          />
        </div>
        <Button onClick={save} disabled={saving}>
          Kaydet
        </Button>
      </CardContent>
    </Card>
  );
}
