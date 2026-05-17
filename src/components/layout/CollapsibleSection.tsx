import { useId, useState, type ReactNode } from "react";

type CollapsibleSectionProps = {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function CollapsibleSection({
  title,
  subtitle,
  meta,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const sectionId = useId();
  const contentId = `${sectionId}-content`;

  return (
    <section className={`collapsible-section ${isOpen ? "is-open" : "is-closed"}`}>
      <button
        className="collapsible-section-header"
        type="button"
        aria-label={`${isOpen ? "Collapse" : "Expand"} ${title}`}
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
