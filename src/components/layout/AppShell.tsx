import type { ReactNode } from "react";

type AppShellProps = {
  topBar: ReactNode;
  tutorialMode?: boolean;
  children: ReactNode;
};

export function AppShell({ topBar, tutorialMode = false, children }: AppShellProps) {
  return (
    <div className={`app-shell ${tutorialMode ? "tutorial-mode" : ""}`}>
      {topBar}
      {children}
    </div>
  );
}
