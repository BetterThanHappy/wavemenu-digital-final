import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { menuQueryOptions } from "@/lib/menu-queries";
import { DEFAULT_ALLERGEN_NOTE } from "@/lib/menu-types";
import { FilterBar } from "@/components/menu/FilterBar";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  // İlk açılışta menü verisini hazırlar; sayfa çizilirken ayrıca yükleniyor ekranı gerekmez.
  loader: ({ context }) => context.queryClient.ensureQueryData(menuQueryOptions),
  head: () => ({
    meta: [
      { title: "WAVE eatery lab. — Dijital Menü" },
      {
        name: "description",
        content:
          "WAVE eatery lab. dijital menüsü: kahvaltı, spring roll, salata, bowl ve içecekler; alerjen ve diyet rozetleriyle.",
      },
      { property: "og:title", content: "WAVE eatery lab. — Dijital Menü" },
      {
        property: "og:description",
        content: "Kahvaltı, spring roll, salata, bowl ve içecekler. Alerjen ve diyet bilgileriyle.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MenuPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-10 text-center text-sm text-muted-foreground">
      Menü yüklenemedi: {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">Menü bulunamadı.</div>,
});

function MenuPage() {
  // Yönetim panelinde kaydedilen kategori, ürün ve görünüm ayarları tek sorgudan gelir.
  const { data } = useSuspenseQuery(menuQueryOptions);
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const currency = data.settings?.currency ?? "TL";
  const restaurantName = data.settings?.restaurant_name ?? "WAVE";
  const tagline = data.settings?.tagline ?? "eatery lab.";

  useEffect(() => {
    // Koyu tema seçildiğinde tüm semantik renk değişkenleri styles.css içindeki .dark değerlerine geçer.
    document.documentElement.classList.toggle("dark", data.settings?.theme === "dark");
  }, [data.settings?.theme]);

  // Kullanıcının verdiği adres yalnızca web adresi veya kökten başlayan yerel yol ise kullanılır.
  // Böylece değer CSS metni olarak çalıştırılmaz; sadece background-image değişkenine atanır.
  const backgroundImageUrl = useMemo(() => {
    const value = data.settings?.background_image_url?.trim() ?? "/wave-bg.svg";
    if (!value) return "none";
    if (!value.startsWith("/") && !/^https?:\/\//i.test(value)) return "none";
    return `url(${JSON.stringify(value)})`;
  }, [data.settings?.background_image_url]);

  const backgroundColor = /^#[0-9a-f]{6}$/i.test(data.settings?.background_color ?? "")
    ? data.settings?.background_color
    : undefined;
  const overlayOpacity = Math.min(
    0.95,
    Math.max(0.35, Number(data.settings?.background_overlay_opacity ?? 0.82)),
  );
  const menuBackgroundStyle = {
    "--menu-background-color": backgroundColor,
    "--menu-background-image": backgroundImageUrl,
    "--menu-background-overlay-opacity": overlayOpacity,
  } as CSSProperties;

  // Arama ve rozetler aynı anda uygulanır. Birden fazla rozet seçilirse ürün hepsini taşımalıdır.
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("tr");
    return data.items.filter((item) => {
      const matchesSearch =
        !term ||
        item.name.toLocaleLowerCase("tr").includes(term) ||
        item.description.toLocaleLowerCase("tr").includes(term);
      const matchesTags = activeTags.every((tag) => item.tags.includes(tag));
      return matchesSearch && matchesTags;
    });
  }, [data.items, search, activeTags]);

  const groups = data.categories
    .map((category) => ({
      category,
      items: filtered.filter((item) => item.category_id === category.id),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="menu-background min-h-screen" style={menuBackgroundStyle}>
      <div className="menu-background-content">
      <header className="border-b border-border/70 bg-gradient-to-b from-mint/60 to-background">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-5 py-12 text-center">
          <h1 className="text-5xl font-semibold tracking-[0.2em] text-foreground uppercase">
            {restaurantName}
          </h1>
          <p className="mt-2 text-sm tracking-[0.35em] text-muted-foreground lowercase">
            {tagline}
          </p>
          {data.settings?.address && (
            <p className="mt-4 text-xs text-muted-foreground">{data.settings.address}</p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pt-8 pb-16">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          activeTags={activeTags}
          onToggleTag={(tag) =>
            // Seçili rozete yeniden basmak onu kaldırır; diğer seçimler korunur.
            setActiveTags((prev) =>
              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
            )
          }
          onClear={() => {
            setSearch("");
            setActiveTags([]);
          }}
        />

        {groups.length === 0 ? (
          <p className="mt-16 text-center text-sm text-muted-foreground">
            Seçtiğiniz filtrelere uygun ürün bulunamadı.
          </p>
        ) : (
          groups.map((group, index) => (
            // Filtre sonrasında içinde ürün kalmayan kategoriler yukarıdaki groups hesabında elenir.
            <section key={group.category.id} className={cn("mt-12", index === 0 && "mt-10")}>
              <h2 className="mb-5 text-center text-sm font-semibold tracking-[0.3em] text-primary uppercase">
                {group.category.name}
              </h2>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <MenuItemCard key={item.id} item={item} currency={currency} />
                ))}
              </div>
            </section>
          ))
        )}

                <footer className="mt-16 space-y-4 border-t border-border/70 pt-6 text-center">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {data.settings?.allergen_note || DEFAULT_ALLERGEN_NOTE}
          </p>

          {(data.settings?.phone || data.settings?.instagram) && (
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              {data.settings?.phone && (
                <a
                  href={`tel:${data.settings.phone}`}
                  className="hover:text-primary hover:underline"
                >
                  {data.settings.phone}
                </a>
              )}

              {data.settings?.phone && data.settings?.instagram && (
                <span>·</span>
              )}

              {data.settings?.instagram && (() => {
                const cleanUsername = data.settings.instagram.replace("@", "").trim();
                const instagramUrl = cleanUsername.startsWith("http")
                  ? cleanUsername
                  : `https://instagram.com/${cleanUsername}`;

                return (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    @{cleanUsername}
                  </a>
                );
              })()}
            </div>
          )}

          <Link to="/admin" className="inline-block text-xs text-primary hover:underline">
            Yönetim paneli
          </Link>
        </footer>

      </main>
      </div>
    </div>
  );
}
