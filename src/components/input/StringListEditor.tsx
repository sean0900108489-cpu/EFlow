import { useLanguage } from "../../lib/i18n/language-context";

type StringListEditorProps = {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
};

export function StringListEditor({
  label,
  values,
  onChange,
  placeholder,
}: StringListEditorProps) {
  const { t } = useLanguage();
  const effectivePlaceholder = placeholder ?? t("input.common.addItemPlaceholder");

  function updateValue(index: number, value: string) {
    onChange(values.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function addValue() {
    onChange([...values, ""]);
  }

  function removeValue(index: number) {
    onChange(values.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="string-list">
      <div className="field-row">
        <label>{label}</label>
        <button className="mini-button" type="button" onClick={addValue}>
          {t("input.common.add")}
        </button>
      </div>
      {values.length === 0 ? <p className="muted-small">{t("input.common.noItemsYet")}</p> : null}
      {values.map((value, index) => (
        <div className="inline-edit" key={`${label}-${index}`}>
          <input
            value={value}
            onChange={(event) => updateValue(index, event.target.value)}
            placeholder={effectivePlaceholder}
          />
          <button className="icon-button" type="button" onClick={() => removeValue(index)}>
            x
          </button>
        </div>
      ))}
    </div>
  );
}
