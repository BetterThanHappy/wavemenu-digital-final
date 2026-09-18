// Bu dosya, menüde kullanılan verilerin ortak sözlüğüdür.
// Bir alan eklediğinizde hem veritabanı sorgusunu hem de ilgili formu güncellemeyi unutmayın.
export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  tags: string[];
  is_sold_out: boolean;
  sort_order: number;
};

export type RestaurantSettings = {
  id: string;
  restaurant_name: string;
  tagline: string;
  phone: string;
  address: string;
  instagram: string;
  currency: string;
  theme: string;
  allergen_note: string;
  // Ana sayfanın kişiselleştirilebilir zemin ayarları.
  // Görsel boş bırakılırsa CSS'teki --menu-background-image değeri kullanılır.
  background_image_url: string;
  background_color: string;
  background_overlay_opacity: number;
  updated_at: string;
};

export type MenuData = {
  categories: Category[];
  items: MenuItem[];
  settings: RestaurantSettings | null;
};

// Filtre çubuklarında ve ürün düzenleme ekranında kullanılan sabit rozet listesi.
export const ALL_TAGS = ["Vegan", "Gluten", "Kuruyemiş", "Susam - Soya", "Mantar"] as const;

export const DEFAULT_ALLERGEN_NOTE =
  "Alerji ve hassasiyetleriniz için lütfen sipariş öncesi bilgi veriniz. Çapraz bulaşma riski bulunmaktadır.";

// Fiyatı hem tam sayılar hem de kuruş içeren değerler için düzenli gösterir.
export function formatPrice(price: number, currency: string) {
  const rounded = Number.isInteger(price) ? price.toString() : price.toFixed(2);
  return `${rounded} ${currency}`;
}
