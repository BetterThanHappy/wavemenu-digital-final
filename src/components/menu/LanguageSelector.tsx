
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Sitemizde desteklenen diller.
type Language = "tr" | "en" | "ru";

// Google Translate'in tarayıcıya eklediği nesnelerin tipleri.
declare global {
  interface Window {
    google?: {
      translate: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            includedLanguages: string;
            autoDisplay: boolean;
          },
          elementId: string
        ) => unknown;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

// Çerezde kayıtlı dili okur.
// Çerez bulunamazsa Türkçe seçilir.
function getSavedLanguage(): Language {
  if (typeof document === "undefined") return "tr";

  const match = document.cookie.match(
    /(?:^|;\s*)googtrans=\/tr\/(tr|en|ru)(?:;|$)/
  );

  if (match?.[1] === "en") return "en";
  if (match?.[1] === "ru") return "ru";

  return "tr";
}

// Seçilen dili Google Translate çerezine kaydeder.
function saveLanguage(lang: Language) {
  const value = `/tr/${lang}`;

  document.cookie =
    `googtrans=${value}; path=/; SameSite=Lax`;

  // Alt alan adlarında da dil bilgisini tutmaya çalışır.
  const hostname = window.location.hostname;

  if (hostname.includes(".") && hostname !== "localhost") {
    document.cookie =
      `googtrans=${value}; domain=${hostname}; path=/; SameSite=Lax`;
  }
}

export function LanguageSelector() {
  // Ekranda seçili görünen dil.
  const [currentLang, setCurrentLang] =
    useState<Language>("tr");

  useEffect(() => {
    // Sayfa açılınca kayıtlı dili bul.
    setCurrentLang(getSavedLanguage());

    // Google Translate'i başlatan fonksiyon.
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;

      // Aynı elementi ikinci kez oluşturmamaya çalışır.
      const container = document.getElementById(
        "google_translate_element"
      );

      if (!container || container.childNodes.length > 0) {
        return;
      }

      new window.google.translate.TranslateElement(
        {
          // Sitenin orijinal dili Türkçe.
          pageLanguage: "tr",

          // Kullanılabilecek diller.
          includedLanguages: "tr,en,ru",

          // Google'ın otomatik açılır penceresini kapatır.
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };

    // Google Translate script'i zaten varsa tekrar ekleme.
    if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
      return;
    }

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");

      script.id = "google-translate-script";

      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";

      script.async = true;

      document.body.appendChild(script);
    }
  }, []);

  // Dil butonuna basıldığında çalışır.
  const changeLanguage = (lang: Language) => {
    if (lang === currentLang) return;

    // Yeni dili kaydet.
    saveLanguage(lang);

    // Google Translate ve React'in aynı anda HTML'i
    // değiştirmesini azaltmak için sayfayı yeniden yükle.
    window.location.reload();
  };

  return (
    <div className="my-2 flex flex-col items-center gap-1.5">
      {/* Google Translate'in kendi kontrol alanı.
          Kullanıcıya gösterilmez. */}
      <div
        id="google_translate_element"
        className="hidden"
      />

      {/* Dil seçme butonları.
          notranslate: Google bu butonları çevirmesin. */}
      <div
        className="notranslate inline-flex items-center rounded-full border border-border/80 bg-background/90 p-1 shadow-sm backdrop-blur-md"
        translate="no"
      >
        {/* Türkçe */}
        <button
          type="button"
          onClick={() => changeLanguage("tr")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-all",
            currentLang === "tr"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          🇹🇷 TR
        </button>

        {/* İngilizce */}
        <button
          type="button"
          onClick={() => changeLanguage("en")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-all",
            currentLang === "en"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          🇬🇧 EN
        </button>

        {/* Rusça */}
        <button
          type="button"
          onClick={() => changeLanguage("ru")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-all",
            currentLang === "ru"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          🇷🇺 RU
        </button>
      </div>

      {/* Otomatik çeviri bilgilendirmesi.
          Türkçe seçiliyken gösterilmez. */}
      {currentLang !== "tr" && (
        <p
          className="notranslate text-[11px] font-light tracking-wide text-muted-foreground"
          translate="no"
        >
          {currentLang === "en" &&
            "✦ Automatically translated via Google Translate"}

          {currentLang === "ru" &&
            "✦ Переведено автоматически с помощью Google Translate"}
        </p>
      )}
    </div>
  );
}
