const counters = new Map<string, number>();

export function makeId(prefix: string): string {
  const safePrefix = prefix
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const key = safePrefix || "item";
  const next = (counters.get(key) ?? 0) + 1;
  counters.set(key, next);
  return `${key}-${next}`;
}

export function makeGraphId(inputId: string): string {
  return `graph-${inputId}`;
}

export function makeNodeId(section: string, id: string): string {
  return `node-${section}-${id}`;
}

export function makeEdgeId(source: string, target: string, relationship: string): string {
  return `edge-${source}-${relationship}-${target}`;
}
