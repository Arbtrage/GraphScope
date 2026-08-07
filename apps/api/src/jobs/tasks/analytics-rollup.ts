import type { Repositories } from "@graphscope/db";

export async function runAnalyticsRollupTask(
  repos: Repositories,
  payload: { workspaceId?: string; day?: string },
): Promise<void> {
  if (payload.workspaceId) {
    await repos.analytics.rollupWorkspaceDaily(payload.workspaceId, payload.day);
    console.log(`analytics.rollup completed for workspace ${payload.workspaceId}`);
    return;
  }

  const count = await repos.analytics.rollupAllWorkspaces(payload.day);
  console.log(`analytics.rollup completed for ${count} workspaces`);
}
