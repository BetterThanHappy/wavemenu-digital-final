import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

export function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState<"tr" | "en" | "ru">("tr");

  useEffect(() => {
    // Sayfa yenilendiğinde hafızadaki dili hatırla
    const match = document.cookie.match(/googtrans=\/tr\/(en|ru)/);
    if (match && (match[1] === "en" || match[1] === "ru")) {
      setCurrentLang(match[1] as "en" | "ru");
    }

    // Google Translate script'ini sayfaya bağla
    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "tr",
            includedLanguages: "tr,en,ru",
            autoDisplay: false,
          },
          "google_translate_element"
        );
      };
    }
  }, []);

  const changeLanguage = (lang: "tr" | "en" | "ru") => {
    setCurrentLang(lang);

    // Çerezleri güncelle
    if (lang === "tr") {
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}; path=/;`;
    } else {
      document.cookie = `googtrans=/tr/${lang}; path=/;`;
      document.cookie = `googtrans=/tr/${lang}; domain=${window.location.hostname}; path=/;`;
    }

    // Gizli Google seçicisini tetikle veya sayfayı yenile
    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event("change"));
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Gizli Google Translate öğesi */}
      <div id="google_translate_element" className="hidden" />

      {/* Dil Seçim Butonları */}
      <div className="inline-flex items-center rounded-full border border-border/80 bg-background/90 p-1 shadow-sm backdrop-blur-md">
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

      {/* TR dışındaki diller seçildiğinde çıkan not */}
      {currentLang !== "tr" && (
        <p className="text-[11px] font-light tracking-wide text-muted-foreground">
          {currentLang === "en" && "✦ Automatically translated via Google Translate"}
          {currentLang === "ru" && "✦ Переведено автоматически с помощью Google Translate"}
        </p>
      )}
    </div>
  );
}
