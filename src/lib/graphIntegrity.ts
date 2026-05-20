type ExactEdgeRelationship = {
  source: string;
  target: string;
  relationshipType: string;
};

type EdgeRelationshipCandidate = ExactEdgeRelationship & {
  id?: string;
};

export function getExactEdgeRelationshipKey(
  relationship: ExactEdgeRelationship,
): string {
  return JSON.stringify([
    relationship.source,
    relationship.target,
    relationship.relationshipType,
  ]);
}

export function wouldDuplicateExactEdgeRelationship(
  edges: readonly EdgeRelationshipCandidate[],
  currentEdgeId: string | undefined,
  relationship: ExactEdgeRelationship,
): boolean {
  return edges.some(
    (edge) =>
      edge.id !== currentEdgeId &&
      edge.source === relationship.source &&
      edge.target === relationship.target &&
      edge.relationshipType === relationship.relationshipType,
  );
}
