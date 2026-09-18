import { TagBadge } from "./TagBadge";
import { formatPrice, type MenuItem } from "@/lib/menu-types";
import { cn } from "@/lib/utils";

export function MenuItemCard({ item, currency }: { item: MenuItem; currency: string }) {
  return (
    // Kartların opak zemini, seçilen arka plan görseli yoğun olsa bile metni okunur tutar.
    <article
      className={cn(
        "rounded-2xl border border-border/70 bg-card/95 p-5 shadow-sm backdrop-blur-[2px] transition-shadow hover:shadow-md",
        // Tükenen ürün silinmez; müşteriye hâlâ listede, daha soluk biçimde gösterilir.
        item.is_sold_out && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold tracking-wide text-foreground uppercase">
          {item.name}
        </h3>
        <span className="shrink-0 text-base font-semibold text-primary">
          {formatPrice(item.price, currency)}
        </span>
      </div>
      {item.description && (
        // Malzeme açıklaması boşsa bu alan hiç oluşturulmaz ve kartta gereksiz boşluk kalmaz.
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground italic">
          {item.description}
        </p>
      )}
      {(item.tags.length > 0 || item.is_sold_out) && (
        // Alerjen/diyet rozetleri ve tükendi bilgisi aynı bilgi satırında toplanır.
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.is_sold_out && (
            <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-destructive uppercase">
              Tükendi
            </span>
          )}
          {item.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      )}
    </article>
  );
}
