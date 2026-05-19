import { useId, useState, type ReactNode } from "react";
import { useLanguage } from "../../lib/i18n/language-context";

type CollapsibleSectionProps = {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  defaultOpen?: boolean;
  tour?: {
    id: string;
    step: string;
    title: string;
    body: string;
    position?: string;
  };
  children: ReactNode;
};

export function CollapsibleSection({
  title,
  subtitle,
  meta,
  defaultOpen = false,
  tour,
  children,
}: CollapsibleSectionProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const sectionId = useId();
  const contentId = `${sectionId}-content`;
  const disclosureLabel = t(
    isOpen ? "common.disclosure.collapseWithTitle" : "common.disclosure.expandWithTitle",
    { title },
  );

  return (
    <section
      className={`collapsible-section ${isOpen ? "is-open" : "is-closed"}`}
      data-tour={tour?.id}
      data-tour-step={tour?.step}
      data-tour-title={tour?.title}
      data-tour-body={tour?.body}
      data-tour-position={tour?.position}
    >
      <button
        className="collapsible-section-header"
        type="button"
        aria-label={disclosureLabel}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen((currentIsOpen) => !currentIsOpen)}
      >
        <span className="collapsible-section-title-block">
          <span className="collapsible-section-title">{title}</span>
          {subtitle ? <span className="collapsible-section-subtitle">{subtitle}</span> : null}
        </span>
        <span className="collapsible-section-right">
          {meta ? <span className="collapsible-section-meta">{meta}</span> : null}
          <span className="collapsible-section-toggle" aria-hidden="true">
            {isOpen ? "-" : "+"}
          </span>
        </span>
      </button>
      <div className="collapsible-section-body" id={contentId} hidden={!isOpen}>
        {children}
      </div>
    </section>
  );
}
