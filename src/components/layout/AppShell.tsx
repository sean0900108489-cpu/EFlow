import type { ReactNode } from "react";

type AppShellProps = {
  topBar: ReactNode;
  children: ReactNode;
};

export function AppShell({ topBar, children }: AppShellProps) {
  return (
    <div className="app-shell">
      {topBar}
      {children}
    </div>
  );
}
