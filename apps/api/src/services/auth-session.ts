import type { GraphContext } from "../context.js";
import type { User } from "@graphscope/shared-types";

export async function createAuthSession(
  ctx: GraphContext,
  user: User,
  metadata: Record<string, unknown>,
): Promise<{ sessionToken: string; user: User }> {
  const workspaces = await ctx.repos.workspaces.listForUser(user.id);
  let activeWorkspaceId = workspaces[0]?.id ?? null;

  if (!activeWorkspaceId) {
    const slug = `workspace-${user.id}`;
    const workspace = await ctx.repos.workspaces.create(
      { name: `${user.name ?? "My"} Workspace`, slug },
      user.id,
    );
    activeWorkspaceId = workspace.id;
  }

  const { token } = await ctx.repos.sessions.create(user.id, activeWorkspaceId);

  await ctx.repos.audit.log({
    action: "auth.login",
    actorId: user.id,
    workspaceId: activeWorkspaceId,
    metadata,
  });

  return { sessionToken: token, user };
}
