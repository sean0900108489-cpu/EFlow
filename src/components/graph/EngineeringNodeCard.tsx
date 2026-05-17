import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { EngineeringReactNode } from "../../lib/graphAdapters";
import type { LifecycleStatus } from "../../types/eflowCommand";

const lifecycleStatusLabels: Record<LifecycleStatus, string> = {
  draft: "Draft",
  planned: "Planned",
  ready: "Ready",
  developing: "Developing",
  completed: "Completed",
  blocked: "Blocked",
  needs_refactor: "Needs refactor",
  deprecated: "Deprecated",
};

export function EngineeringNodeCard({ data, selected }: NodeProps<EngineeringReactNode>) {
  const node = data.node;
  const displayedLifecycleStatus = node.lifecycleStatus ?? "planned";
  const shortDescription =
    node.description.length > 112 ? `${node.description.slice(0, 112)}...` : node.description;

  return (
    <div
      className={`engineering-node-card ${selected ? "is-selected" : ""}`}
      data-lifecycle-status={displayedLifecycleStatus}
      data-node-id={node.id}
    >
      <Handle className="node-handle" type="target" position={Position.Left} />
      <div className="node-card-topline">
        <span className={`type-badge type-${node.type}`}>{node.type}</span>
        <span className={`status-pill status-${node.status}`}>{node.status}</span>
      </div>
      <div className="node-card-lifecycle-row">
        <span
          className={`lifecycle-node-badge lifecycle-node-badge-${displayedLifecycleStatus}`}
          data-lifecycle-status={displayedLifecycleStatus}
        >
          <span className="lifecycle-node-dot" aria-hidden="true" />
          {lifecycleStatusLabels[displayedLifecycleStatus]}
        </span>
      </div>
      <h3>{node.title}</h3>
      <p>{shortDescription}</p>
      <Handle className="node-handle" type="source" position={Position.Right} />
    </div>
  );
}
