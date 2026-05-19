import { useMemo, useState } from "react";
import { useLanguage } from "../../lib/i18n/language-context";

type CopyJsonButtonProps = {
  label: string;
  value: unknown;
  disabled?: boolean;
  compact?: boolean;
};

export function CopyJsonButton({ label, value, disabled = false, compact = false }: CopyJsonButtonProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [fallbackText, setFallbackText] = useState("");

  const json = useMemo(() => JSON.stringify(value, null, 2), [value]);

  async function copyJson() {
    if (disabled) return;
    setFallbackText("");

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API is unavailable.");
      }

      await navigator.clipboard.writeText(json);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setFallbackText(json);
    }
  }

  return (
    <div className={compact ? "copy-json copy-json-compact" : "copy-json"}>
      <button className="button button-secondary" type="button" onClick={copyJson} disabled={disabled}>
        {copied ? t("common.copied") : label}
      </button>
      {fallbackText ? (
        <textarea
          className="fallback-textarea"
          readOnly
          value={fallbackText}
          aria-label={t("export.copy.fallbackJson", { label })}
        />
      ) : null}
    </div>
  );
}
