import { useMemo, useState } from "react";

type CopyJsonButtonProps = {
  label: string;
  value: unknown;
  disabled?: boolean;
  compact?: boolean;
};

export function CopyJsonButton({ label, value, disabled = false, compact = false }: CopyJsonButtonProps) {
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
        {copied ? "Copied" : label}
      </button>
      {fallbackText ? (
        <textarea
          className="fallback-textarea"
          readOnly
          value={fallbackText}
          aria-label={`${label} fallback JSON`}
        />
      ) : null}
    </div>
  );
}
