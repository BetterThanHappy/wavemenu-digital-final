import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { MenuData } from "./menu-types";

function createPublicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const getMenuData = createServerFn({ method: "GET" }).handler(
  async (): Promise<MenuData> => {
    const supabase = createPublicClient();

    const [categories, items, settings] = await Promise.all([
      supabase.from("categories").select("id, name, slug, sort_order").order("sort_order"),
      supabase
        .from("menu_items")
        .select("id, category_id, name, description, price, tags, is_sold_out, sort_order")
        .order("sort_order"),
      supabase.from("restaurant_settings").select("*").limit(1).maybeSingle(),
    ]);

    if (categories.error) throw new Error(categories.error.message);
    if (items.error) throw new Error(items.error.message);

    return {
      categories: categories.data ?? [],
      items: (items.data ?? []).map((item) => ({ ...item, price: Number(item.price) })),
      settings: settings.data ?? null,
    };
  },
);
