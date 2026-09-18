# Wave Eatery Lab — Dijital Menü & Yönetim Paneli

Açık adaçayı/mint pastel tonlarında, mobil öncelikli bir dijital menü ve arkasında çalışan bir yönetim paneli.

## 1. Müşteri menüsü (ana sayfa)

- Üstte "WAVE / eatery lab." başlığı, sade pastel yeşil arka plan.
- Kategori sekmeleri: Kahvaltı, Spring Roll, Salata, Ana Yemek, İçecek.
- Her ürün: isim, malzeme açıklaması, fiyat, rozetler (Vegan, Gluten, Kuruyemiş, Susam-Soya, Mantar).
- Filtre çubuğu: diyet/alerjen rozetine göre ürünleri süzme + isimle arama.
- "Tükendi" işaretli ürünler soluk ve sipariş dışı görünür.
- Sayfa altında uyarı: "Alerji ve hassasiyetleriniz için lütfen sipariş öncesi bilgi veriniz. Çapraz bulaşma riski bulunmaktadır."
- PDF'teki 19 ürünün tamamı ve fiyatları başlangıç verisi olarak yüklenir.

## 2. Yönetim paneli (/admin)

- Giriş ile korunur; yalnızca yetkili kullanıcı erişir.
- Ürün listesi: düzenle, sil, "tükendi" aç/kapat, yeni ürün ekle.
- Ürün alanları: ad, açıklama, fiyat, kategori, rozetler, sıra.
- Kategori ekleme/silme/sıralama.
- Ayarlar: restoran adı, iletişim bilgisi, para birimi, tema tonu.
- Yapılan her değişiklik müşteri menüsünde anında görünür.

## 3. Altyapı

- Lovable Cloud: kategoriler, ürünler, rozetler ve restoran ayarları için veritabanı; menü herkese açık okunur, değişiklik yalnız yönetici hesabıyla yapılır.
- Yönetici hesabı e-posta/şifre ile giriş yapar; rol ayrı bir tabloda tutulur.
- Başlangıç menüsü veritabanına hazır olarak yüklenir.

## Teknik notlar

- TanStack Start route'ları: `/` (menü), `/admin` (panel), `/auth` (giriş).
- Supabase (Lovable Cloud) tabloları: `categories`, `menu_items`, `item_tags`, `restaurant_settings`, `user_roles` + RLS: anon SELECT, admin write (`has_role`).
- Seed verisi migration içinde literal INSERT olarak.
- Tasarım tokenları `src/styles.css` içinde pastel adaçayı/mint paleti (oklch), bileşenlerde sabit renk yok.
- Modüler yapı: `src/components/menu/*`, `src/components/admin/*`, `src/lib/menu.functions.ts`.
