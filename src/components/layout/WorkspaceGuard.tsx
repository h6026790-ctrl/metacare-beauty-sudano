// Hard isolation: admin and staff accounts may only browse their own
// workspace. Any other route redirects immediately without rendering.
import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export function WorkspaceGuard({ children }: { children: ReactNode }) {
  const { user, isAdmin, isStaff, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const workspace = user && isAdmin ? "/admin" : user && isStaff ? "/staff" : null;
  const offLimits = !!workspace && !pathname.startsWith(workspace);

  useEffect(() => {
    if (!loading && offLimits && workspace) {
      navigate({ to: workspace, replace: true });
    }
  }, [loading, offLimits, workspace, navigate]);

  if (offLimits) return null;
  return <>{children}</>;
}
