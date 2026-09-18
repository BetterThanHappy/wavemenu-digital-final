# Menü arka planı özelleştirme ve Türkçe kod rehberi

## Yapılacaklar

- Restoran ayarlarına iki yeni alan eklemek:
  - Arka plan görseli URL’si
  - Arka plan rengi
- Ana menüde seçilen rengi temel zemin olarak, görseli ise okunabilirliği koruyan yarı saydam bir katmanın arkasında göstermek.
- Görsel URL’si boş bırakıldığında kullanılmak üzere projeye zarif, düşük yoğunluklu bir dalga deseni eklemek.
- Yönetim panelindeki **Ayarlar** bölümüne:
  - Görsel URL alanı
  - Renk seçici ve elle renk kodu girişi
  - Hazır pastel renk seçenekleri
  - Görseli kapatma/varsayılan desene dönme açıklamaları eklemek.
- Kaydetme sonrasında menü önizlemesinin yeni arka planı hemen kullanmasını sağlamak.

## Okunabilirlik ve görünüm

- Arka plan görseli sayfayı kaplayacak, ortalanacak ve sabit duracak.
- Menü metinleri doğrudan yoğun görsel üzerinde kalmayacak; zemin renginden üretilen saydam bir örtü kullanılacak.
- Ürün kartları yeterli opaklıkta kalacak ve hem açık hem koyu temada kontrast korunacak.
- Mobil ve masaüstü ekranlarda aynı ayarlar uyumlu çalışacak.

## Türkçe kod açıklamaları

Aşağıdaki ana dosyalara, kodu değiştirecek kişinin kolayca takip edebileceği açıklayıcı Türkçe yorumlar eklenecek:

- Ana menü sayfası
- Yönetim paneli sayfası
- Restoran ayarları paneli
- Genel renk ve arka plan stilleri
- Menü veri tipleri ve yardımcıları
- Arama/filtre alanı
- Ürün kartı

Yorumlar; veri akışını, filtre mantığını, tema uygulamasını ve CSS üzerinden varsayılan renk/görsel değiştirmenin yerini açıklayacak. Çalışan kodu tekrar eden gereksiz yorumlar yerine, düzenleme yapacak kişiye yol gösteren bölüm notları kullanılacak.

## Teknik ayrıntılar

- Veritabanındaki `restaurant_settings` kaydına `background_image_url` ve `background_color` sütunları güvenli varsayılanlarla eklenecek.
- Arka plan değeri yalnızca CSS özel değişkenleri üzerinden ana sayfaya aktarılacak; kullanıcı girdisi doğrudan CSS metni olarak çalıştırılmayacak.
- Renk girdisi geçerli hex biçimiyle sınırlandırılacak; boş/bozuk değerlerde CSS varsayılanı kullanılacak.
- Dalga deseni yerel bir görsel olarak projede tutulacak.
- İlgili sayfaların başlık ve sosyal paylaşım bilgileri korunacak ve yönetim sayfasındaki eksik standart bilgiler tamamlanacak.
- Sonuç, uygulama derlemesi ve masaüstü/mobil görünüm kontrolleriyle doğrulanacak.
