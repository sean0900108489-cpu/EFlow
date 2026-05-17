import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { EngineeringReactNode } from "../../lib/graphAdapters";

export function EngineeringNodeCard({ data, selected }: NodeProps<EngineeringReactNode>) {
  const node = data.node;
  const shortDescription =
    node.description.length > 112 ? `${node.description.slice(0, 112)}...` : node.description;

  return (
    <div className={`engineering-node-card ${selected ? "is-selected" : ""}`}>
      <Handle className="node-handle" type="target" position={Position.Left} />
      <div className="node-card-topline">
        <span className={`type-badge type-${node.type}`}>{node.type}</span>
        <span className={`status-pill status-${node.status}`}>{node.status}</span>
      </div>
      <h3>{node.title}</h3>
      <p>{shortDescription}</p>
      <Handle className="node-handle" type="source" position={Position.Right} />
    </div>
  );
}
