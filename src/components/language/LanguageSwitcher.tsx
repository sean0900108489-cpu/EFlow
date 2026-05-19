import { useLanguage } from "../../lib/i18n/language-context";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div className="language-switcher" aria-label={t("language.label")}>
      <span>{t("language.label")}</span>
      <button
        className={locale === "zh-TW" ? "is-active" : ""}
        type="button"
        aria-pressed={locale === "zh-TW"}
        onClick={() => setLocale("zh-TW")}
      >
        {t("language.zhTw")}
      </button>
      <button
        className={locale === "en" ? "is-active" : ""}
        type="button"
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
      >
        {t("language.en")}
      </button>
    </div>
  );
}
