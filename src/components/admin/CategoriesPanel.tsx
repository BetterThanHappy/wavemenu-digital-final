import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Category, MenuItem } from "@/lib/menu-types";

function slugify(value: string) {
  const map: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
    Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u",
  };
  return value
    .split("")
    .map((char) => map[char] ?? char)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CategoriesPanel({
  categories,
  items,
}: {
  categories: Category[];
  items: MenuItem[];
}) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["menu"] });
  }

  async function addCategory() {
    if (!newName.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("categories").insert({
      name: newName.trim(),
      slug: `${slugify(newName)}-${Date.now().toString(36)}`,
      sort_order: categories.length + 1,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewName("");
    toast.success("Kategori eklendi.");
    await refresh();
  }

  async function renameCategory(category: Category, name: string) {
    if (!name.trim() || name === category.name) return;
    const { error } = await supabase
      .from("categories")
      .update({ name: name.trim() })
      .eq("id", category.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
  }

  async function updateSort(category: Category, sortOrder: number) {
    const { error } = await supabase
      .from("categories")
      .update({ sort_order: sortOrder })
      .eq("id", category.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
  }

  async function deleteCategory(category: Category) {
    const count = items.filter((item) => item.category_id === category.id).length;
    const message = count
      ? `"${category.name}" kategorisi ve içindeki ${count} ürün silinecek. Emin misiniz?`
      : `"${category.name}" kategorisi silinecek. Emin misiniz?`;
    if (!window.confirm(message)) return;
    const { error } = await supabase.from("categories").delete().eq("id", category.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Kategori silindi.");
    await refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kategoriler</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Yeni kategori adı"
          />
          <Button onClick={addCategory} disabled={busy}>
            Ekle
          </Button>
        </div>
        <ul className="space-y-2">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3"
            >
              <Input
                defaultValue={category.name}
                onBlur={(e) => renameCategory(category, e.target.value)}
                className="h-9 flex-1 min-w-40"
                aria-label={`${category.name} adı`}
              />
              <Input
                type="number"
                defaultValue={category.sort_order}
                onBlur={(e) => updateSort(category, Number(e.target.value) || 0)}
                className="h-9 w-20"
                aria-label={`${category.name} sırası`}
              />
              <span className="text-xs text-muted-foreground">
                {items.filter((item) => item.category_id === category.id).length} ürün
              </span>
              <Button variant="ghost" size="sm" onClick={() => deleteCategory(category)}>
                Sil
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
