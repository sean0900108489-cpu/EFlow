import type {
  EngineeringEdge,
  EngineeringFlowGraph,
  EngineeringFlowInput,
  EngineeringNode,
} from "../../types/engineeringFlow";
import { EdgeInspector } from "./EdgeInspector";
import { EmptyInspector } from "./EmptyInspector";
import { NodeInspector } from "./NodeInspector";

type InspectorPanelProps = {
  input: EngineeringFlowInput;
  graph: EngineeringFlowGraph | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onUpdateNode: (nodeId: string, patch: Partial<EngineeringNode>) => void;
  onUpdateEdge: (edgeId: string, patch: Partial<EngineeringEdge>) => void;
};

export function InspectorPanel({
  input,
  graph,
  selectedNodeId,
  selectedEdgeId,
  onUpdateNode,
  onUpdateEdge,
}: InspectorPanelProps) {
  const selectedNode = selectedNodeId
    ? graph?.nodes.find((node) => node.id === selectedNodeId) ?? null
    : null;
  const selectedEdge = selectedEdgeId
    ? graph?.edges.find((edge) => edge.id === selectedEdgeId) ?? null
    : null;

  if (selectedNode) {
    return <NodeInspector node={selectedNode} onChange={(patch) => onUpdateNode(selectedNode.id, patch)} />;
  }

  if (selectedEdge) {
    return <EdgeInspector edge={selectedEdge} onChange={(patch) => onUpdateEdge(selectedEdge.id, patch)} />;
  }

  return <EmptyInspector input={input} graph={graph} />;
}
