import type { Edge, Node } from "@xyflow/react";
import type { EngineeringEdge, EngineeringFlowGraph, EngineeringNode } from "../types/engineeringFlow";

export type EngineeringNodeCardData = {
  node: EngineeringNode;
};

export type EngineeringEdgeData = {
  edge: EngineeringEdge;
};

export type EngineeringReactNode = Node<EngineeringNodeCardData, "engineeringNode">;
export type EngineeringReactEdge = Edge<EngineeringEdgeData>;

export function toReactFlowNodes(graph: EngineeringFlowGraph): EngineeringReactNode[] {
  return graph.nodes.map((node) => ({
    id: node.id,
    type: "engineeringNode",
    position: node.position,
    data: { node },
  }));
}

export function toReactFlowEdges(graph: EngineeringFlowGraph): EngineeringReactEdge[] {
  return graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.relationshipType,
    animated: edge.status === "suggested",
    data: { edge },
    className: `flow-edge flow-edge-${edge.status}`,
  }));
}
