import type { EngineeringFlowInput } from "../types/engineeringFlow";
import { nowIso } from "../lib/dates";

const createdAt = nowIso();

export const emptyEngineeringFlowInput: EngineeringFlowInput = {
  schemaVersion: "engineering-flow-input/v0",
  id: "engineering-flow-input-empty",
  projectName: "Untitled Engineering Flow",
  projectIntent: "",
  sourceType: "user_input",
  createdAt,
  updatedAt: createdAt,
  userTypes: [],
  mainScreens: [],
  coreFunctions: [],
  flowSteps: [],
  dataObjects: [],
  aiRoles: [],
  unknowns: [],
};
