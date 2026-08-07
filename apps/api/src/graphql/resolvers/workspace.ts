import { GraphQLError } from "graphql";
import type { GraphContext } from "../../context.js";
import { requireAuth, requireWorkspace } from "../../auth/rbac.js";
import { clearDeviceFlow, getDeviceFlow, storeDeviceFlow } from "../../context.js";
import { createAuthSession } from "../../services/auth-session.js";
import { createGithubService } from "../../services/github-device-flow.js";
import { setSecret } from "../../services/secrets.js";

async function resolveActiveWorkspace(ctx: GraphContext) {
  if (!ctx.userId || !ctx.workspaceId) return null;
  return ctx.repos.workspaces.findByIdForUser(ctx.workspaceId, ctx.userId);
}

export const resolvers = {
  Query: {
    health: () => ({ ok: true, version: "0.2.0" }),

    me: async (_: unknown, __: unknown, ctx: GraphContext) => {
      if (!ctx.userId) return null;
      return ctx.repos.users.findById(ctx.userId);
    },

    activeWorkspace: async (_: unknown, __: unknown, ctx: GraphContext) => resolveActiveWorkspace(ctx),

    workspaces: async (_: unknown, __: unknown, ctx: GraphContext) => {
      const { userId } = requireAuth(ctx);
      return ctx.repos.workspaces.listForUser(userId);
    },

    workspace: async (_: unknown, args: { id: string }, ctx: GraphContext) => {
      const { userId } = requireAuth(ctx);
      const workspace = await ctx.repos.workspaces.findByIdForUser(args.id, userId);
      if (!workspace) {
        throw new GraphQLError("Workspace not found", { extensions: { code: "NOT_FOUND" } });
      }
      return workspace;
    },
  },

  Mutation: {
    createWorkspace: async (
      _: unknown,
      args: { input: { name: string; slug: string } },
      ctx: GraphContext,
    ) => {
      const { userId, sessionToken } = requireAuth(ctx);
      const workspace = await ctx.repos.workspaces.create(args.input, userId);
      await ctx.repos.sessions.setActiveWorkspace(sessionToken, workspace.id);
      await ctx.repos.audit.log({
        action: "workspace.create",
        actorId: userId,
        workspaceId: workspace.id,
        metadata: { slug: workspace.slug },
      });
      return workspace;
    },

    switchWorkspace: async (_: unknown, args: { id: string }, ctx: GraphContext) => {
      const { userId, sessionToken } = requireAuth(ctx);
      const workspace = await ctx.repos.workspaces.findByIdForUser(args.id, userId);
      if (!workspace) {
        throw new GraphQLError("Workspace not found", { extensions: { code: "NOT_FOUND" } });
      }
      await ctx.repos.sessions.setActiveWorkspace(sessionToken, workspace.id);
      return workspace;
    },

    githubDeviceFlowStart: async (_: unknown, __: unknown, ctx: GraphContext) => {
      const github = createGithubService(ctx.env);
      if (!github) {
        throw new GraphQLError("GitHub client not configured", { extensions: { code: "CONFIG_ERROR" } });
      }
      const data = await github.start();
      storeDeviceFlow(data.device_code, {
        deviceCode: data.device_code,
        interval: data.interval,
        expiresAt: Date.now() + data.expires_in * 1000,
      });
      return {
        deviceCode: data.device_code,
        userCode: data.user_code,
        verificationUri: data.verification_uri,
        expiresIn: data.expires_in,
        interval: data.interval,
      };
    },

    githubDeviceFlowPoll: async (_: unknown, args: { deviceCode: string }, ctx: GraphContext) => {
      const github = createGithubService(ctx.env);
      if (!github) {
        throw new GraphQLError("GitHub client not configured", { extensions: { code: "CONFIG_ERROR" } });
      }
      const state = getDeviceFlow(args.deviceCode);
      if (!state || Date.now() > state.expiresAt) {
        clearDeviceFlow(args.deviceCode);
        throw new GraphQLError("Device flow expired", { extensions: { code: "EXPIRED" } });
      }
      const result = await github.poll(args.deviceCode);
      if ("pending" in result) return null;
      if ("error" in result) {
        throw new GraphQLError(result.error, { extensions: { code: "GITHUB_ERROR" } });
      }
      const ghUser = await github.fetchUser(result.accessToken);
      const user = await ctx.repos.users.upsertFromGithub(ghUser.login, ghUser.name);
      clearDeviceFlow(args.deviceCode);
      return createAuthSession(ctx, user, { provider: "github", githubLogin: ghUser.login });
    },

    signInLocal: async (_: unknown, args: { input: { displayName: string } }, ctx: GraphContext) => {
      const displayName = args.input.displayName.trim();
      if (displayName.length < 2 || displayName.length > 64) {
        throw new GraphQLError("Display name must be 2–64 characters", {
          extensions: { code: "VALIDATION_ERROR" },
        });
      }
      const user = await ctx.repos.users.findOrCreateLocal(displayName);
      return createAuthSession(ctx, user, { provider: "local", displayName });
    },

    saveGithubPat: async (_: unknown, args: { token: string }, ctx: GraphContext) => {
      requireAuth(ctx);
      await setSecret("github", "pat", args.token);
      return true;
    },

    logout: async (_: unknown, __: unknown, ctx: GraphContext) => {
      if (ctx.sessionToken) await ctx.repos.sessions.deleteByToken(ctx.sessionToken);
      return true;
    },
  },
};
