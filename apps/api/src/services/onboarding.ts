import type { GraphContext } from "../context.js";
import type { OnboardingNextStep, OnboardingStatus } from "@graphscope/shared-types";

export type { OnboardingNextStep, OnboardingStatus };

export async function computeOnboardingStatus(
  ctx: GraphContext,
  workspaceId: string,
): Promise<OnboardingStatus> {
  const projects = await ctx.repos.projects.listForWorkspace(workspaceId);
  const projectCount = projects.length;
  const hasProject = projectCount > 0;

  let hasRepository = false;
  let hasPublishedSchema = false;
  if (hasProject) {
    const repoRow = await ctx.db("core_repository_link").where({ workspace_id: workspaceId }).first();
    hasRepository = !!repoRow;

    const schemaIds = await ctx.db("core_schema").where({ workspace_id: workspaceId }).select("schema_id");
    if (schemaIds.length) {
      const version = await ctx
        .db("core_schema_version")
        .whereIn(
          "schema_id",
          schemaIds.map((r: { schema_id: string }) => r.schema_id),
        )
        .first();
      hasPublishedSchema = !!version;
    }
  }

  const environments = await ctx.repos.environments.listForWorkspace(workspaceId);
  const environmentCount = environments.length;
  const hasEnvironment = environmentCount > 0;

  const operationCount = await ctx.repos.operations.countForWorkspace(workspaceId);
  const executions = await ctx.repos.executions.listForWorkspace(workspaceId, 1);
  const hasExecution = executions.length > 0;
  const lastExecutionAt = executions[0]?.createdAt ?? null;

  let nextStep: OnboardingNextStep = "DONE";
  if (!hasProject) nextStep = "CREATE_PROJECT";
  else if (!hasRepository) nextStep = "CONNECT_REPO";
  else if (!hasPublishedSchema) nextStep = "PUBLISH_SCHEMA";
  else if (!hasEnvironment) nextStep = "ADD_ENVIRONMENT";
  else if (!hasExecution) nextStep = "RUN_QUERY";

  return {
    hasProject,
    hasRepository,
    hasPublishedSchema,
    hasEnvironment,
    hasExecution,
    nextStep,
    projectCount,
    environmentCount,
    operationCount,
    lastExecutionAt,
  };
}

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || `ws-${Date.now()}`
  );
}

export async function bootstrapWorkspace(
  ctx: GraphContext,
  workspaceId: string,
  userId: string,
  input: {
    workspaceName?: string | null;
    projectName?: string | null;
    createDefaultEnvironment?: boolean | null;
  },
) {
  let workspace = await ctx.repos.workspaces.findByIdForUser(workspaceId, userId);
  if (!workspace) {
    throw new Error("Workspace not found");
  }

  if (input.workspaceName?.trim()) {
    const name = input.workspaceName.trim();
    const updated = await ctx.repos.workspaces.update(workspaceId, userId, {
      name,
      slug: slugify(name),
    });
    if (updated) workspace = updated;
  }

  const projects = await ctx.repos.projects.listForWorkspace(workspaceId);
  let project = projects[0] ?? null;
  if (!project && (input.projectName?.trim() || projects.length === 0)) {
    const name = input.projectName?.trim() || "My project";
    project = await ctx.repos.projects.create(workspaceId, {
      name,
      slug: slugify(name),
    });
  }

  if (input.createDefaultEnvironment) {
    const envs = await ctx.repos.environments.listForWorkspace(workspaceId);
    if (!envs.length) {
      await ctx.repos.environments.create(workspaceId, {
        name: "Local",
        endpointUrl: "http://127.0.0.1:4000/graphql",
        isProduction: false,
      });
    }
  }

  await ctx.repos.collections.ensureDefault(workspaceId, "Saved requests");

  const onboardingStatus = await computeOnboardingStatus(ctx, workspaceId);
  return { workspace, project, onboardingStatus };
}
