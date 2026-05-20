# CONTEXT MANIFEST SCHEMA

This document proposes the canonical `context-manifest.json` schema for a future
AI Context Console in this repository.

The manifest is not ordinary file metadata. It is the repository's cognition
map: a governed index of architecture documents, AI prompts, repo context files,
export artifacts, trust boundaries, review state, update rules, and dependency
relationships.

The manifest should help future AI agents and maintainers answer:

- Which documents define architecture truth?
- Which files are safe for AI to edit?
- Which files require human review before they become trusted context?
- Which generated artifacts must not be edited directly?
- Which prompts depend on which architecture rules?
- Which context is stale because its dependencies changed?
- Which documents are constitution-level and effectively immutable?

This design does not implement the AI Context Console. It defines the metadata
contract that such a console should read and maintain.

## Design Goals

- Preserve local-first, schema-first architecture governance.
- Prevent architecture drift from stale docs, hidden AI edits, or duplicated
  context.
- Make human review status explicit.
- Distinguish human-authored, AI-assisted, generated, imported, and derived
  context.
- Support document hierarchy without duplicating content.
- Support dependency and prompt association graphs.
- Make AI update safety machine-readable.
- Keep generated exports separate from canonical architecture documents.
- Avoid inventing backend, database, cloud sync, or autonomous agent systems.

## Proposed Filename

```text
context-manifest.json
```

Suggested optional companion files for future implementation:

```text
context-manifest.schema.json
context-manifest.generated.json
```

`context-manifest.json` should be human-reviewed canonical governance data.
Generated console views or computed staleness reports should use separate
derived artifacts.

## JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://eflow.local/schemas/context-manifest/v0.1",
  "title": "EFlow Context Manifest",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schemaVersion",
    "manifestId",
    "project",
    "lastUpdated",
    "governance",
    "nodes"
  ],
  "properties": {
    "schemaVersion": {
      "const": "eflow-context-manifest/v0.1"
    },
    "manifestId": {
      "type": "string",
      "minLength": 1
    },
    "project": {
      "$ref": "#/$defs/project"
    },
    "description": {
      "type": "string"
    },
    "lastUpdated": {
      "$ref": "#/$defs/isoDateTime"
    },
    "lastReviewed": {
      "$ref": "#/$defs/nullableIsoDateTime"
    },
    "governance": {
      "$ref": "#/$defs/governance"
    },
    "nodes": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/contextNode"
      }
    }
  },
  "$defs": {
    "isoDateTime": {
      "type": "string",
      "format": "date-time"
    },
    "nullableIsoDateTime": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ]
    },
    "project": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "name"],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "name": {
          "type": "string",
          "minLength": 1
        },
        "repositoryRoot": {
          "type": "string"
        },
        "localFirst": {
          "type": "boolean"
        },
        "schemaFirst": {
          "type": "boolean"
        }
      }
    },
    "governance": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "constitutionTiers",
        "defaultReviewPolicy",
        "staleDetectionPolicy"
      ],
      "properties": {
        "constitutionTiers": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/tier"
          },
          "uniqueItems": true
        },
        "defaultReviewPolicy": {
          "type": "object",
          "additionalProperties": false,
          "required": ["requiresHumanReviewForAIChanges"],
          "properties": {
            "requiresHumanReviewForAIChanges": {
              "type": "boolean"
            },
            "humanReviewerIds": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "uniqueItems": true
            },
            "aiMayCreateNewNodes": {
              "type": "boolean"
            },
            "aiMayEditConstitutionNodes": {
              "type": "boolean"
            }
          }
        },
        "staleDetectionPolicy": {
          "type": "object",
          "additionalProperties": false,
          "required": ["dependencyNewerThanReviewMeansStale"],
          "properties": {
            "dependencyNewerThanReviewMeansStale": {
              "type": "boolean"
            },
            "defaultStaleAfterDays": {
              "type": "integer",
              "minimum": 1
            },
            "generatedArtifactSourceChangeMeansStale": {
              "type": "boolean"
            }
          }
        }
      }
    },
    "contextNode": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "id",
        "title",
        "path",
        "category",
        "tier",
        "status",
        "criticality",
        "description",
        "architectureRole",
        "origin",
        "dependsOn",
        "generatedBy",
        "updateStrategy",
        "requiresHumanReview",
        "mutableByAI",
        "review",
        "lastReviewed",
        "lastUpdated"
      ],
      "properties": {
        "id": {
          "$ref": "#/$defs/nodeId"
        },
        "title": {
          "type": "string",
          "minLength": 1
        },
        "path": {
          "anyOf": [
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          ]
        },
        "anchor": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "description": "Optional file section, symbol, route, export name, or code anchor."
        },
        "parentId": {
          "anyOf": [
            {
              "$ref": "#/$defs/nodeId"
            },
            {
              "type": "null"
            }
          ]
        },
        "order": {
          "type": "integer",
          "minimum": 0
        },
        "category": {
          "$ref": "#/$defs/category"
        },
        "tier": {
          "$ref": "#/$defs/tier"
        },
        "status": {
          "$ref": "#/$defs/nodeStatus"
        },
        "criticality": {
          "$ref": "#/$defs/criticality"
        },
        "description": {
          "type": "string",
          "minLength": 1
        },
        "architectureRole": {
          "$ref": "#/$defs/architectureRole"
        },
        "origin": {
          "$ref": "#/$defs/origin"
        },
        "owner": {
          "$ref": "#/$defs/owner"
        },
        "dependsOn": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/nodeId"
          },
          "uniqueItems": true
        },
        "promptAssociations": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/promptAssociation"
          }
        },
        "generatedBy": {
          "anyOf": [
            {
              "$ref": "#/$defs/generatedBy"
            },
            {
              "type": "null"
            }
          ]
        },
        "updateStrategy": {
          "$ref": "#/$defs/updateStrategy"
        },
        "requiresHumanReview": {
          "type": "boolean"
        },
        "mutableByAI": {
          "type": "boolean"
        },
        "review": {
          "$ref": "#/$defs/review"
        },
        "staleDetection": {
          "$ref": "#/$defs/staleDetection"
        },
        "lastReviewed": {
          "$ref": "#/$defs/nullableIsoDateTime"
        },
        "lastUpdated": {
          "$ref": "#/$defs/nullableIsoDateTime"
        },
        "contentHash": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "description": "Optional future hash for detecting file content drift."
        },
        "tags": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "uniqueItems": true
        },
        "notes": {
          "type": "string"
        }
      }
    },
    "nodeId": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9]*(\\.[a-z0-9][a-z0-9-]*)+$"
    },
    "category": {
      "enum": [
        "architecture_document",
        "ai_prompt",
        "repo_context",
        "export_artifact",
        "schema",
        "workflow",
        "handoff",
        "memory",
        "release",
        "config"
      ]
    },
    "tier": {
      "enum": [
        "tier_0_constitution",
        "tier_1_architecture",
        "tier_2_operational",
        "tier_3_reference",
        "tier_4_generated"
      ]
    },
    "nodeStatus": {
      "enum": [
        "proposed",
        "active",
        "evolving",
        "legacy",
        "deprecated",
        "archived"
      ]
    },
    "criticality": {
      "enum": [
        "constitution",
        "critical",
        "high",
        "medium",
        "low"
      ]
    },
    "architectureRole": {
      "enum": [
        "constitution",
        "architecture_overview",
        "architecture_decision_record",
        "state_ownership_contract",
        "agent_instruction",
        "owner_workflow",
        "handoff_context",
        "schema_contract",
        "prompt_contract",
        "export_contract",
        "generated_snapshot",
        "project_memory",
        "release_history",
        "supporting_reference"
      ]
    },
    "origin": {
      "enum": [
        "human_authored",
        "ai_assisted",
        "system_generated",
        "derived_export",
        "imported",
        "unknown"
      ]
    },
    "owner": {
      "type": "object",
      "additionalProperties": false,
      "required": ["type", "id"],
      "properties": {
        "type": {
          "enum": ["human", "ai_agent", "system", "shared"]
        },
        "id": {
          "type": "string",
          "minLength": 1
        },
        "name": {
          "type": "string"
        }
      }
    },
    "promptAssociation": {
      "type": "object",
      "additionalProperties": false,
      "required": ["promptId", "role"],
      "properties": {
        "promptId": {
          "$ref": "#/$defs/nodeId"
        },
        "role": {
          "enum": [
            "included_context",
            "generation_source",
            "review_prompt",
            "maintenance_prompt",
            "handoff_prompt",
            "forbidden_context"
          ]
        },
        "required": {
          "type": "boolean"
        },
        "notes": {
          "type": "string"
        }
      }
    },
    "generatedBy": {
      "type": "object",
      "additionalProperties": false,
      "required": ["type", "name", "deterministic"],
      "properties": {
        "type": {
          "enum": ["human_process", "ai_agent", "script", "export_builder", "unknown"]
        },
        "name": {
          "type": "string",
          "minLength": 1
        },
        "sourceNodeIds": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/nodeId"
          },
          "uniqueItems": true
        },
        "sourcePaths": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "uniqueItems": true
        },
        "deterministic": {
          "type": "boolean"
        },
        "command": {
          "type": "string"
        }
      }
    },
    "updateStrategy": {
      "type": "object",
      "additionalProperties": false,
      "required": ["mode", "allowedAIActions", "forbiddenAIActions"],
      "properties": {
        "mode": {
          "enum": [
            "immutable_human_only",
            "human_only",
            "ai_propose_human_review",
            "ai_edit_requires_review",
            "ai_edit_allowed",
            "generated_only",
            "derived_do_not_edit",
            "deprecated_no_update"
          ]
        },
        "allowedAIActions": {
          "type": "array",
          "items": {
            "enum": [
              "read",
              "summarize",
              "quote_short_excerpt",
              "classify",
              "detect_staleness",
              "propose_patch",
              "edit",
              "regenerate"
            ]
          },
          "uniqueItems": true
        },
        "forbiddenAIActions": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "uniqueItems": true
        },
        "changeTriggers": {
          "type": "array",
          "items": {
            "enum": [
              "architecture_decision_changed",
              "state_ownership_changed",
              "schema_changed",
              "command_interface_changed",
              "ai_boundary_changed",
              "persistence_changed",
              "export_format_changed",
              "prompt_changed",
              "release_checkpoint"
            ]
          },
          "uniqueItems": true
        },
        "reviewSlaDays": {
          "type": "integer",
          "minimum": 1
        }
      }
    },
    "review": {
      "type": "object",
      "additionalProperties": false,
      "required": ["status"],
      "properties": {
        "status": {
          "enum": [
            "unreviewed",
            "needs_review",
            "reviewed",
            "approved",
            "rejected",
            "stale"
          ]
        },
        "reviewerId": {
          "type": "string"
        },
        "reviewedAt": {
          "$ref": "#/$defs/nullableIsoDateTime"
        },
        "nextReviewDue": {
          "$ref": "#/$defs/nullableIsoDateTime"
        },
        "notes": {
          "type": "string"
        }
      }
    },
    "staleDetection": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "strategy": {
          "enum": [
            "manual",
            "dependency_timestamp",
            "content_hash",
            "generated_source_hash",
            "release_checkpoint"
          ]
        },
        "staleAfterDays": {
          "type": "integer",
          "minimum": 1
        },
        "invalidatedByNodeIds": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/nodeId"
          },
          "uniqueItems": true
        },
        "invalidatedByPaths": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "uniqueItems": true
        },
        "invalidatedBySchemaVersions": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "uniqueItems": true
        }
      }
    }
  }
}
```

## Example Manifest Skeleton

```json
{
  "schemaVersion": "eflow-context-manifest/v0.1",
  "manifestId": "eflow.context-manifest",
  "project": {
    "id": "eflow",
    "name": "EFlow",
    "repositoryRoot": ".",
    "localFirst": true,
    "schemaFirst": true
  },
  "description": "Canonical cognition map for EFlow architecture docs, prompts, repo context, and generated AI context artifacts.",
  "lastUpdated": "2026-05-20T00:00:00.000Z",
  "lastReviewed": null,
  "governance": {
    "constitutionTiers": ["tier_0_constitution"],
    "defaultReviewPolicy": {
      "requiresHumanReviewForAIChanges": true,
      "humanReviewerIds": ["local-owner"],
      "aiMayCreateNewNodes": true,
      "aiMayEditConstitutionNodes": false
    },
    "staleDetectionPolicy": {
      "dependencyNewerThanReviewMeansStale": true,
      "defaultStaleAfterDays": 180,
      "generatedArtifactSourceChangeMeansStale": true
    }
  },
  "nodes": []
}
```

## Example Manifest Entries

These examples are illustrative. They are not claiming that a reviewed
`context-manifest.json` already exists.

### Current Governance Read Order

For current repo handoff, read:

1. `CONTEXT_MANIFEST.md`
2. `CURRENT_ARCHITECTURE_STATE.md`
3. `CURRENT_STATUS.md`
4. Constitution docs: `SYSTEM_OVERVIEW.md`, `INVARIANT_REGISTRY.md`,
   `STATE_OWNERSHIP.md`, `MUTATION_RULES.md`, `ARCHITECTURE_DECISIONS.md`,
   and `AGENTS.md`
5. Boundary/navigation docs: `ENTRYPOINTS.md` and `MODULE_BOUNDARIES.md`

`CURRENT_STATUS.md` is present and serves as the current repo status snapshot:
validation state, working-tree caveats, completed source-fix passes, and active
watch items. It supplements this manifest and `CURRENT_ARCHITECTURE_STATE.md`;
it does not replace the constitution docs or make the whole architecture
source-verified.

### Current Source Verification Note

Source tree verification has begun. The first and second source-level
architecture gap passes have partial source verification for workspace graph
import validation, graph integrity duplicate-edge checks, command lifecycle
update behavior, command provenance source type validation, owner UI edge
relationship edits, workspace trust-field validation, owner UI metadata edit
audit events, manual edge insertion duplicate checks, and the corresponding
`validateExample` invariant checks.

This does not make the entire architecture source-verified. Constitution-level
documents remain document-authoritative until owner review says otherwise, while
the fixed implementation paths are source-verified only for the specific
behaviors listed above.

### Constitution-Level Agent Instructions

```json
{
  "id": "doc.agents",
  "title": "AI Engineering Instructions",
  "path": "AGENTS.md",
  "anchor": null,
  "parentId": null,
  "order": 10,
  "category": "repo_context",
  "tier": "tier_0_constitution",
  "status": "active",
  "criticality": "constitution",
  "description": "Defines project identity, core principles, AI agent boundaries, validation expectations, and scope limits.",
  "architectureRole": "agent_instruction",
  "origin": "human_authored",
  "owner": {
    "type": "human",
    "id": "local-owner",
    "name": "Local owner"
  },
  "dependsOn": [],
  "promptAssociations": [
    {
      "promptId": "prompt.codex-state-check",
      "role": "included_context",
      "required": true,
      "notes": "AI coding agents should read this before architecture-sensitive edits."
    }
  ],
  "generatedBy": null,
  "updateStrategy": {
    "mode": "immutable_human_only",
    "allowedAIActions": ["read", "summarize", "quote_short_excerpt", "detect_staleness", "propose_patch"],
    "forbiddenAIActions": [
      "directly_edit_without_explicit_user_request",
      "weaken_local_first_boundary",
      "add_backend_scope_without_user_approval",
      "remove_human_review_requirement"
    ],
    "changeTriggers": ["architecture_decision_changed", "ai_boundary_changed", "release_checkpoint"],
    "reviewSlaDays": 7
  },
  "requiresHumanReview": true,
  "mutableByAI": false,
  "review": {
    "status": "approved",
    "reviewerId": "local-owner",
    "reviewedAt": null,
    "nextReviewDue": null,
    "notes": "Constitution-level operating instructions."
  },
  "staleDetection": {
    "strategy": "manual",
    "staleAfterDays": 180,
    "invalidatedByNodeIds": ["doc.architecture-decisions", "doc.state-ownership"],
    "invalidatedByPaths": ["src/types/engineeringFlow.ts", "src/types/eflowCommand.ts"]
  },
  "lastReviewed": null,
  "lastUpdated": null,
  "contentHash": null,
  "tags": ["agent-boundary", "constitution", "local-first"],
  "notes": "AI may propose changes, but should not directly rewrite this file."
}
```

### State Ownership Contract

```json
{
  "id": "doc.state-ownership",
  "title": "State Ownership",
  "path": "STATE_OWNERSHIP.md",
  "parentId": "doc.system-overview",
  "order": 30,
  "category": "architecture_document",
  "tier": "tier_0_constitution",
  "status": "active",
  "criticality": "constitution",
  "description": "Defines canonical state ownership, derived-only state, persistence ownership, graph ownership, AI temporary state, and synchronization risks.",
  "architectureRole": "state_ownership_contract",
  "origin": "ai_assisted",
  "owner": {
    "type": "shared",
    "id": "local-owner-and-codex"
  },
  "dependsOn": ["doc.readme", "doc.system-overview", "doc.agents"],
  "promptAssociations": [
    {
      "promptId": "prompt.architecture-review",
      "role": "included_context",
      "required": true
    },
    {
      "promptId": "prompt.ai-maintenance",
      "role": "maintenance_prompt",
      "required": true
    }
  ],
  "generatedBy": {
    "type": "ai_agent",
    "name": "Codex",
    "sourceNodeIds": ["doc.readme", "doc.system-overview"],
    "sourcePaths": ["src/App.tsx", "src/lib/workspacePersistence.ts", "src/lib/buildEflowContextExport.ts"],
    "deterministic": false
  },
  "updateStrategy": {
    "mode": "ai_propose_human_review",
    "allowedAIActions": ["read", "summarize", "detect_staleness", "propose_patch"],
    "forbiddenAIActions": [
      "make_direct_unreviewed_architecture_changes",
      "turn_derived_state_into_canonical_state",
      "weaken_ai_chat_draft_only_rule"
    ],
    "changeTriggers": ["state_ownership_changed", "schema_changed", "persistence_changed", "ai_boundary_changed"],
    "reviewSlaDays": 7
  },
  "requiresHumanReview": true,
  "mutableByAI": false,
  "review": {
    "status": "needs_review",
    "reviewerId": "local-owner",
    "reviewedAt": null,
    "nextReviewDue": "2026-05-27T00:00:00.000Z",
    "notes": "AI-generated architecture governance doc should be owner-reviewed before constitution status is final."
  },
  "staleDetection": {
    "strategy": "dependency_timestamp",
    "staleAfterDays": 90,
    "invalidatedByNodeIds": ["doc.architecture-decisions"],
    "invalidatedByPaths": ["src/App.tsx", "src/types/engineeringFlow.ts", "src/lib/workspacePersistence.ts"]
  },
  "lastReviewed": null,
  "lastUpdated": "2026-05-20T00:00:00.000Z",
  "tags": ["state", "graph-truth", "autosave", "ai-boundary"]
}
```

### Architecture Decisions

```json
{
  "id": "doc.architecture-decisions",
  "title": "Architecture Decisions",
  "path": "ARCHITECTURE_DECISIONS.md",
  "parentId": "doc.system-overview",
  "order": 40,
  "category": "architecture_document",
  "tier": "tier_1_architecture",
  "status": "active",
  "criticality": "critical",
  "description": "Records intentional architectural decisions around local-first design, graph truth, schema-first boundaries, AI authority, provenance, command intake, persistence, and backend avoidance.",
  "architectureRole": "architecture_decision_record",
  "origin": "ai_assisted",
  "owner": {
    "type": "shared",
    "id": "local-owner-and-codex"
  },
  "dependsOn": ["doc.readme", "doc.agents", "doc.system-overview", "doc.state-ownership"],
  "promptAssociations": [
    {
      "promptId": "prompt.architecture-review",
      "role": "included_context",
      "required": true
    }
  ],
  "generatedBy": {
    "type": "ai_agent",
    "name": "Codex",
    "sourceNodeIds": ["doc.readme", "doc.system-overview", "doc.state-ownership"],
    "deterministic": false
  },
  "updateStrategy": {
    "mode": "ai_propose_human_review",
    "allowedAIActions": ["read", "summarize", "detect_staleness", "propose_patch"],
    "forbiddenAIActions": [
      "invent_nonexistent_systems",
      "hide_tradeoffs",
      "remove_trust_boundaries"
    ],
    "changeTriggers": ["architecture_decision_changed", "schema_changed", "command_interface_changed", "export_format_changed"],
    "reviewSlaDays": 14
  },
  "requiresHumanReview": true,
  "mutableByAI": false,
  "review": {
    "status": "needs_review",
    "reviewerId": "local-owner",
    "reviewedAt": null,
    "nextReviewDue": "2026-06-03T00:00:00.000Z"
  },
  "staleDetection": {
    "strategy": "dependency_timestamp",
    "staleAfterDays": 120,
    "invalidatedByPaths": ["src/types/eflowCommand.ts", "src/lib/applyEflowCommand.ts", "src/lib/buildEflowContextExport.ts"]
  },
  "lastReviewed": null,
  "lastUpdated": "2026-05-20T00:00:00.000Z",
  "tags": ["adr", "architecture", "governance"]
}
```

### AI Prompt Contract From Code

```json
{
  "id": "prompt.codex-milestone",
  "title": "Codex Milestone Prompt Mode",
  "path": "src/lib/buildAIChatPrompt.ts",
  "anchor": "getModeInstruction.codex_milestone_prompt",
  "parentId": null,
  "order": 100,
  "category": "ai_prompt",
  "tier": "tier_2_operational",
  "status": "active",
  "criticality": "high",
  "description": "Prompt mode that asks AI chat to produce a scoped Codex implementation prompt with local-first boundaries and validation expectations.",
  "architectureRole": "prompt_contract",
  "origin": "human_authored",
  "owner": {
    "type": "shared",
    "id": "frontend-and-architecture"
  },
  "dependsOn": ["doc.agents", "doc.architecture-decisions", "doc.state-ownership"],
  "promptAssociations": [],
  "generatedBy": null,
  "updateStrategy": {
    "mode": "ai_edit_requires_review",
    "allowedAIActions": ["read", "summarize", "detect_staleness", "propose_patch", "edit"],
    "forbiddenAIActions": [
      "remove_do_not_commit_boundary",
      "add_backend_or_cloud_scope_by_default",
      "bypass_repo_inspection_requirement"
    ],
    "changeTriggers": ["prompt_changed", "architecture_decision_changed", "ai_boundary_changed"],
    "reviewSlaDays": 7
  },
  "requiresHumanReview": true,
  "mutableByAI": true,
  "review": {
    "status": "needs_review",
    "reviewerId": "local-owner",
    "reviewedAt": null,
    "nextReviewDue": null
  },
  "staleDetection": {
    "strategy": "dependency_timestamp",
    "staleAfterDays": 90,
    "invalidatedByNodeIds": ["doc.agents", "doc.architecture-decisions"]
  },
  "lastReviewed": null,
  "lastUpdated": null,
  "tags": ["prompt", "codex", "handoff"]
}
```

### Derived Export Artifact

```json
{
  "id": "artifact.eflow-context-export",
  "title": "AI-Native EFlow Context Export",
  "path": null,
  "anchor": "eflow-context/v0.1",
  "parentId": null,
  "order": 200,
  "category": "export_artifact",
  "tier": "tier_4_generated",
  "status": "active",
  "criticality": "critical",
  "description": "Derived AI-readable export built from current EngineeringFlowInput and EngineeringFlowGraph.",
  "architectureRole": "export_contract",
  "origin": "derived_export",
  "owner": {
    "type": "system",
    "id": "buildEFlowContextExport"
  },
  "dependsOn": ["schema.eflow-context", "schema.eflow-command", "doc.state-ownership", "doc.architecture-decisions"],
  "promptAssociations": [
    {
      "promptId": "prompt.codex-milestone",
      "role": "included_context",
      "required": false,
      "notes": "May be attached to AI chat as full context."
    }
  ],
  "generatedBy": {
    "type": "export_builder",
    "name": "buildEFlowContextExport",
    "sourcePaths": ["src/lib/buildEflowContextExport.ts", "src/types/eflowContext.ts"],
    "deterministic": true
  },
  "updateStrategy": {
    "mode": "derived_do_not_edit",
    "allowedAIActions": ["read", "summarize", "detect_staleness", "regenerate"],
    "forbiddenAIActions": [
      "edit_export_json_directly_as_source",
      "persist_derived_summaries_as_graph_truth"
    ],
    "changeTriggers": ["export_format_changed", "schema_changed", "command_interface_changed"],
    "reviewSlaDays": 7
  },
  "requiresHumanReview": false,
  "mutableByAI": false,
  "review": {
    "status": "reviewed",
    "reviewerId": "system",
    "reviewedAt": null,
    "nextReviewDue": null,
    "notes": "Review source builder and schema, not generated export instances."
  },
  "staleDetection": {
    "strategy": "generated_source_hash",
    "invalidatedByPaths": ["src/lib/buildEflowContextExport.ts", "src/types/eflowContext.ts", "src/types/engineeringFlow.ts"]
  },
  "lastReviewed": null,
  "lastUpdated": null,
  "tags": ["export", "ai-context", "derived"]
}
```

## Field Semantics

### `id`

Stable logical id for a context node. The id is the reference target for
hierarchy, dependencies, prompt associations, stale detection, and console UI.

Use dotted ids:

```text
doc.state-ownership
prompt.codex-milestone
schema.eflow-command
artifact.eflow-context-export
```

Do not use file paths as ids. Paths can move; architectural identity should
remain stable.

### `path` and `anchor`

`path` points to a repo file when one exists. `anchor` identifies a section,
symbol, export name, route, prompt mode, or schema version inside that file.

Generated artifacts and virtual prompt concepts may have `path: null`, but they
should still explain their source through `generatedBy`.

### `parentId`

Document hierarchy is represented by `parentId`. Console trees should derive
children from parent links rather than storing duplicate child arrays.

### `tier`

Recommended tier model:

- `tier_0_constitution`: repository rules that define what must not drift
- `tier_1_architecture`: architecture decisions, state ownership, schemas
- `tier_2_operational`: handoff docs, prompts, workflows, validation guidance
- `tier_3_reference`: inventories, memory, release notes, supporting docs
- `tier_4_generated`: derived exports, generated snapshots, computed reports

### `criticality`

`criticality` controls review urgency and AI edit restrictions.

- `constitution`: changes can alter the repository's identity or trust model
- `critical`: changes can alter architecture, persistence, AI safety, or schema
  compatibility
- `high`: changes can affect major workflows or prompts
- `medium`: useful context, but not usually a trust boundary
- `low`: informational or historical context

### `status`

This is the manifest node's architecture lifecycle, not EFlow graph
`lifecycleStatus`.

Use:

- `proposed`: designed but not adopted
- `active`: current source of context
- `evolving`: intentionally in transition
- `legacy`: retained for compatibility
- `deprecated`: should not guide new work
- `archived`: historical only

### `origin` and `generatedBy`

`origin` distinguishes how the context was created. `generatedBy` explains the
specific producer when content is AI-assisted, system-generated, imported, or a
derived export.

Human-authored docs should usually set `generatedBy: null`.

AI-assisted architecture docs should usually require human review even when the
content is high quality.

### `updateStrategy`, `requiresHumanReview`, and `mutableByAI`

These fields are intentionally explicit and slightly redundant.

`updateStrategy.mode` is the governing policy. `mutableByAI` is a fast safety
flag for AI agents. `requiresHumanReview` tells the console whether a change can
be considered trusted without owner approval.

Recommended interpretation:

| Mode | AI may edit file? | Human review required? | Typical use |
| --- | --- | --- | --- |
| `immutable_human_only` | No | Yes | constitution-level instructions |
| `human_only` | No | Yes | sensitive architecture docs |
| `ai_propose_human_review` | No direct edit | Yes | ADRs, state ownership docs |
| `ai_edit_requires_review` | Yes | Yes | prompts, operational docs |
| `ai_edit_allowed` | Yes | Usually no | low-risk reference docs |
| `generated_only` | Regenerate only | Review source or output rules | generated reports |
| `derived_do_not_edit` | No | Review source builder | exports/snapshots |
| `deprecated_no_update` | No | No active update | historical context |

### `dependsOn`

`dependsOn` is the canonical dependency graph. A node is potentially stale when
any dependency has changed more recently than the node's `lastReviewed` date.

Examples:

- `doc.architecture-decisions` depends on `doc.state-ownership`
- `artifact.eflow-context-export` depends on `schema.eflow-context`
- `prompt.codex-milestone` depends on `doc.agents`

### `promptAssociations`

Prompt associations describe how a document or artifact participates in AI
prompt workflows.

Examples:

- architecture docs are `included_context` for architecture-review prompts
- state docs are `maintenance_prompt` context for future AI updates
- generated exports may be optional `included_context` for milestone prompts
- sensitive docs may be marked as `forbidden_context` for broad external
  sharing if needed later

### `review`

`review.status` is the human/context review state of this manifest node.

It is separate from:

- EFlow graph node `status`
- EFlow formal `reviewStatus`
- EFlow graph `lifecycleStatus`
- manifest node `status`

Recommended console behavior:

- AI-created or AI-edited constitution/architecture nodes start as
  `needs_review`.
- `approved` means a human reviewer accepted the node as trusted context.
- `stale` means a previously reviewed node needs renewed review.
- `rejected` means the node should not guide future AI context.

### `staleDetection`

Stale detection should be conservative. A context node should be flagged stale
when:

- any dependency was updated after the node was last reviewed
- the node is older than `staleAfterDays`
- a listed path changed
- a listed schema version changed
- a generated artifact's source builder changed
- a constitution-level dependency changed

The manifest should record stale detection policy, but computed stale results
should live in a derived console report, not be silently written back as truth
unless the console intentionally updates `review.status`.

## AI-Safe Update Rules

AI agents should follow these rules when using the manifest:

1. Read `tier`, `criticality`, `mutableByAI`, and `updateStrategy` before
   editing any context node.
2. Never directly edit `tier_0_constitution` nodes unless the user explicitly
   requests that exact edit.
3. For `ai_propose_human_review`, produce a patch proposal and mark review as
   needed rather than treating the change as approved.
4. For `derived_do_not_edit`, edit the source builder or source schema instead
   of editing generated output.
5. For generated artifacts, regenerate from canonical inputs instead of manual
   patching.
6. If dependency context is stale, say so before relying on it.
7. Do not downgrade criticality or loosen review requirements without explicit
   human approval.
8. Do not add backend, cloud, auth, database, or autonomous AI assumptions just
   because a manifest node mentions future extensibility.

## Rationale

### Flat Nodes With Parent References

A flat `nodes` array with `parentId` is easier for AI agents and schema
validators to patch safely than deeply nested documents. It avoids duplicating
child lists and makes dependency references stable.

### Stable Logical IDs

Paths can move during documentation cleanup. Stable ids let prompts,
dependencies, and review state survive file moves.

### Explicit AI Mutability

Architecture drift often starts when an AI agent treats all Markdown files as
equally editable. `mutableByAI`, `requiresHumanReview`, and `updateStrategy`
make safe behavior visible before editing begins.

### Review Is Separate From Status

The manifest node's `status` says whether the node is active, proposed, legacy,
or deprecated. The `review.status` says whether humans trust the current
contents. This mirrors EFlow's broader separation of trust state from lifecycle
state.

### Generated Artifacts Are First-Class But Not Canonical

Export artifacts are important context, but they are generated projections.
Keeping them in the manifest makes them discoverable without letting them
become hidden sources of truth.

### Stale Detection Is Governance, Not Autopilot

The schema can identify likely stale context, but human review remains the trust
boundary for critical architecture docs.

## Suggested Future Extensibility

Future versions can add:

- `contentHash` computation tooling for all path-backed nodes.
- A `context-manifest validate` script.
- A generated stale report such as `context-manifest.generated.json`.
- Console UI views for hierarchy, dependency graph, stale nodes, and AI-safe
  edit permissions.
- Human approval records with signatures or commit refs.
- Pull request links for review provenance.
- Per-node token budget and summarization policy.
- Per-node audience tags, such as `local_owner`, `codex`, `downstream_agent`,
  or `public_handoff`.
- Context bundle definitions for prompt modes.
- Exported MCP/tool descriptors if the project later adds an approved tool
  interface.
- Schema migrations from `eflow-context-manifest/v0.1` to later versions.

Future versions should not add:

- hidden backend ownership of manifest truth without an explicit architecture
  decision
- automatic AI edits to constitution-level docs
- workspace graph state inside the manifest
- AI chat transcript persistence as architecture context
- generated export summaries written back as source truth

## Initial Node Candidates

A first reviewed manifest could include nodes for:

- `doc.readme` -> `README.md`
- `doc.agents` -> `AGENTS.md`
- `doc.system-overview` -> `SYSTEM_OVERVIEW.md`
- `doc.state-ownership` -> `STATE_OWNERSHIP.md`
- `doc.architecture-decisions` -> `ARCHITECTURE_DECISIONS.md`
- `doc.owner-workflow` -> `docs/owner-workflow.md`
- `doc.project-memory` -> `docs/project-memory.md`
- `schema.engineering-flow` -> `src/types/engineeringFlow.ts`
- `schema.eflow-command` -> `src/types/eflowCommand.ts`
- `schema.eflow-context` -> `src/types/eflowContext.ts`
- `schema.eflow-audit` -> `src/types/eflowAudit.ts`
- `source.graph-integrity` -> `src/lib/graphIntegrity.ts`
- `prompt.ai-chat-system` -> `src/lib/buildAIChatPrompt.ts`
- `prompt.codex-milestone` -> `src/lib/buildAIChatPrompt.ts`
- `artifact.workspace-json` -> `eflow-workspace/v0.3`
- `artifact.full-ai-context` -> `engineering-flow-full-context/v0`
- `artifact.eflow-context-export` -> `eflow-context/v0.1`

This list should be reviewed by the owner before becoming a canonical
`context-manifest.json` instance.
