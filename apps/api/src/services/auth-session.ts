import type { GraphContext } from "../context.js";
import type { User, Workspace } from "@graphscope/shared-types";
import { computeOnboardingStatus, type OnboardingStatus } from "./onboarding.js";

export async function createAuthSession(
  ctx: GraphContext,
  user: User,
  metadata: Record<string, unknown>,
): Promise<{
  sessionToken: string;
  user: User;
  activeWorkspace: Workspace | null;
  onboardingStatus: OnboardingStatus | null;
}> {
  const workspaces = await ctx.repos.workspaces.listForUser(user.id);
  let activeWorkspaceId = workspaces[0]?.id ?? null;

  if (!activeWorkspaceId) {
    const name = `${user.name ?? "My"} Workspace`;
    const slug = `workspace-${user.id.slice(0, 8)}`;
    const workspace = await ctx.repos.workspaces.create({ name, slug }, user.id);
    activeWorkspaceId = workspace.id;
  }

  const { token } = await ctx.repos.sessions.create(user.id, activeWorkspaceId);
  const activeWorkspace = await ctx.repos.workspaces.findByIdForUser(activeWorkspaceId, user.id);
  const onboardingStatus = activeWorkspaceId
    ? await computeOnboardingStatus(ctx, activeWorkspaceId)
    : null;

  await ctx.repos.audit.log({
    action: "auth.login",
    actorId: user.id,
    workspaceId: activeWorkspaceId,
    metadata,
  });

  return { sessionToken: token, user, activeWorkspace, onboardingStatus };
}
