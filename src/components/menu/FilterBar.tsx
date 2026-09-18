import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ALL_TAGS } from "@/lib/menu-types";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  activeTags: string[];
  onToggleTag: (tag: string) => void;
  onClear: () => void;
};

export function FilterBar({ search, onSearchChange, activeTags, onToggleTag, onClear }: Props) {
  return (
    <div className="space-y-3">
      {/* Arama değeri üst sayfada tutulur; böylece arama ve rozet filtreleri birlikte çalışır. */}
      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Ürün veya malzeme ara..."
        aria-label="Menüde ara"
        className="h-11 rounded-full border-border bg-card px-5"
      />
      <div className="flex flex-wrap items-center gap-2">
        {/* ALL_TAGS listesine menu-types.ts içinden yeni bir değer eklemek burada otomatik görünür. */}
        {ALL_TAGS.map((tag) => {
          const active = activeTags.includes(tag);
          return (
            <Button
              key={tag}
              type="button"
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleTag(tag)}
              aria-pressed={active}
              className={cn(
                "rounded-full px-3.5 text-xs font-medium tracking-wide",
                !active && "bg-card/90 text-muted-foreground",
              )}
            >
              {tag}
            </Button>
          );
        })}
        {(activeTags.length > 0 || search) && (
          <Button variant="ghost" size="sm" onClick={onClear} className="rounded-full text-xs">
            Filtreleri temizle
          </Button>
        )}
      </div>
    </div>
  );
}
