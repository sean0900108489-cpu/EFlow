import { LanguageSwitcher } from "../language/LanguageSwitcher";
import { useLanguage } from "../../lib/i18n/language-context";

export function TutorialPage() {
  const { t } = useLanguage();

  return (
    <main className="tutorial-page">
      <header className="tutorial-page-header">
        <div>
          <p className="eyebrow">{t("tutorial.eyebrow")}</p>
          <h1>{t("tutorial.title")}</h1>
          <p>{t("tutorial.intro")}</p>
        </div>
        <LanguageSwitcher />
      </header>

      <section className="tutorial-page-actions" aria-label={t("tutorial.eyebrow")}>
        <a className="button button-primary" href="/?tour=1">
          {t("tutorial.openTour")}
        </a>
        <a className="button button-secondary" href="/">
          {t("tutorial.openApp")}
        </a>
      </section>

      <section className="tutorial-primer-grid">
        <article>
          <span>1</span>
          <h2>{t("tutorial.modeTitle")}</h2>
          <p>{t("tutorial.modeBody")}</p>
        </article>
        <article>
          <span>2</span>
          <h2>{t("tutorial.pageTitle")}</h2>
          <p>{t("tutorial.pageBody")}</p>
        </article>
        <article>
          <span>3</span>
          <h2>{t("tutorial.languageTitle")}</h2>
          <p>{t("tutorial.languageBody")}</p>
        </article>
        <article>
          <span>4</span>
          <h2>{t("tutorial.boundaryTitle")}</h2>
          <p>{t("tutorial.boundaryBody")}</p>
        </article>
      </section>
    </main>
  );
}
