import type { ReactNode } from "react";

type WorkspaceProps = {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
};

export function Workspace({ left, center, right }: WorkspaceProps) {
  return (
    <main className="workspace">
      <aside className="workspace-panel left-column">{left}</aside>
      <section className="workspace-panel canvas-column">{center}</section>
      <aside className="workspace-panel right-column">{right}</aside>
    </main>
  );
}
