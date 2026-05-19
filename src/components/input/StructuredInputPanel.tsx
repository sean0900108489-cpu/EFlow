import { useLanguage } from "../../lib/i18n/language-context";
import type { EngineeringFlowInput } from "../../types/engineeringFlow";
import { AiRolesEditor } from "./AiRolesEditor";
import { CoreFunctionsEditor } from "./CoreFunctionsEditor";
import { DataObjectsEditor } from "./DataObjectsEditor";
import { FlowStepsEditor } from "./FlowStepsEditor";
import { ImportInputJson } from "./ImportInputJson";
import { ProjectIntentEditor } from "./ProjectIntentEditor";
import { ScreensEditor } from "./ScreensEditor";
import { UnknownsEditor } from "./UnknownsEditor";
import { UserTypesEditor } from "./UserTypesEditor";

type StructuredInputPanelProps = {
  input: EngineeringFlowInput;
  inputDirtySinceGeneration: boolean;
  onChange: (input: EngineeringFlowInput) => void;
  onImport: (input: EngineeringFlowInput) => void;
};

export function StructuredInputPanel({
  input,
  inputDirtySinceGeneration,
  onChange,
  onImport,
}: StructuredInputPanelProps) {
  const { t } = useLanguage();

  return (
    <div
      className="structured-input-panel"
      data-tour="structured-input"
      data-tour-step="3"
      data-tour-title={t("tour.structuredInput.title")}
      data-tour-body={t("tour.structuredInput.body")}
      data-tour-position="right"
    >
      <ProjectIntentEditor input={input} onChange={onChange} />
      {inputDirtySinceGeneration ? (
        <div className="dirty-note">Input changed. Generate again to refresh graph.</div>
      ) : null}
      <ImportInputJson onImport={onImport} />
      <UserTypesEditor
        users={input.userTypes}
        onChange={(userTypes) => onChange({ ...input, userTypes })}
      />
      <ScreensEditor
        screens={input.mainScreens}
        onChange={(mainScreens) => onChange({ ...input, mainScreens })}
      />
      <CoreFunctionsEditor
        coreFunctions={input.coreFunctions}
        onChange={(coreFunctions) => onChange({ ...input, coreFunctions })}
      />
      <FlowStepsEditor
        flowSteps={input.flowSteps}
        onChange={(flowSteps) => onChange({ ...input, flowSteps })}
      />
      <DataObjectsEditor
        dataObjects={input.dataObjects}
        onChange={(dataObjects) => onChange({ ...input, dataObjects })}
      />
      <AiRolesEditor aiRoles={input.aiRoles} onChange={(aiRoles) => onChange({ ...input, aiRoles })} />
      <UnknownsEditor
        unknowns={input.unknowns}
        onChange={(unknowns) => onChange({ ...input, unknowns })}
      />
    </div>
  );
}
