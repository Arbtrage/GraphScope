import { createHash, randomBytes } from "node:crypto";
import type { Knex } from "knex";
import type { AuditAction, CreateWorkspaceInput, User, Workspace, WorkspaceRole } from "@graphscope/shared-types";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

function mapUser(row: Record<string, unknown>): User {
  return {
    id: String(row.user_id),
    githubLogin: (row.github_login as string | null) ?? null,
    name: (row.name as string | null) ?? null,
  };
}

function mapWorkspace(row: Record<string, unknown>): Workspace {
  return {
    id: String(row.workspace_id),
    name: row.name as string,
    slug: row.slug as string,
  };
}

export class UserRepository {
  constructor(private readonly db: Knex) {}

  async findById(userId: string): Promise<User | null> {
    const row = await this.db("core_user").where({ user_id: userId }).first();
    return row ? mapUser(row) : null;
  }

  async findByGithubLogin(githubLogin: string): Promise<User | null> {
    const row = await this.db("core_user").where({ github_login: githubLogin }).first();
    return row ? mapUser(row) : null;
  }

  async upsertFromGithub(githubLogin: string, name: string | null): Promise<User> {
    const existing = await this.findByGithubLogin(githubLogin);
    if (existing) {
      await this.db("core_user").where({ user_id: existing.id }).update({ name, updated_at: this.db.fn.now() });
      return { ...existing, name };
    }
    const [row] = await this.db("core_user")
      .insert({ github_login: githubLogin, name })
      .returning("*");
    return mapUser(row);
  }

  async findByLocalUsername(localUsername: string): Promise<User | null> {
    const row = await this.db("core_user").where({ local_username: localUsername }).first();
    return row ? mapUser(row) : null;
  }

  async createLocalUser(displayName: string, localUsername: string): Promise<User> {
    const [row] = await this.db("core_user")
      .insert({
        name: displayName,
        local_username: localUsername,
        github_login: null,
      })
      .returning("*");
    return mapUser(row);
  }

  async findOrCreateLocal(displayName: string): Promise<User> {
    const localUsername = slugifyLocalUsername(displayName);
    const existing = await this.findByLocalUsername(localUsername);
    if (existing) {
      if (existing.name !== displayName) {
        await this.db("core_user")
          .where({ user_id: existing.id })
          .update({ name: displayName, updated_at: this.db.fn.now() });
        return { ...existing, name: displayName };
      }
      return existing;
    }
    return this.createLocalUser(displayName, localUsername);
  }
}

function slugifyLocalUsername(displayName: string): string {
  const base = displayName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base.length > 0 ? base : `user-${Date.now()}`;
}

export class WorkspaceRepository {
  constructor(private readonly db: Knex) {}

  async create(input: CreateWorkspaceInput, userId: string): Promise<Workspace> {
    return this.db.transaction(async (trx) => {
      const [row] = await trx("core_workspace")
        .insert({ name: input.name, slug: input.slug })
        .returning("*");
      await trx("core_membership").insert({
        workspace_id: row.workspace_id,
        user_id: userId,
        role: "OWNER" satisfies WorkspaceRole,
      });
      return mapWorkspace(row);
    });
  }

  async listForUser(userId: string): Promise<Workspace[]> {
    const rows = await this.db("core_workspace as w")
      .join("core_membership as m", "m.workspace_id", "w.workspace_id")
      .where("m.user_id", userId)
      .select("w.*")
      .orderBy("w.name");
    return rows.map(mapWorkspace);
  }

  async findByIdForUser(workspaceId: string, userId: string): Promise<Workspace | null> {
    const row = await this.db("core_workspace as w")
      .join("core_membership as m", "m.workspace_id", "w.workspace_id")
      .where({ "w.workspace_id": workspaceId, "m.user_id": userId })
      .select("w.*")
      .first();
    return row ? mapWorkspace(row) : null;
  }

  async userHasAccess(workspaceId: string, userId: string): Promise<boolean> {
    const row = await this.db("core_membership")
      .where({ workspace_id: workspaceId, user_id: userId })
      .first();
    return !!row;
  }
}

export class SessionRepository {
  constructor(private readonly db: Knex) {}

  async create(userId: string, activeWorkspaceId: string | null, ttlHours = 720): Promise<{ token: string; expiresAt: Date }> {
    const token = generateSessionToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    await this.db("core_session").insert({
      token_hash: tokenHash,
      user_id: userId,
      active_workspace_id: activeWorkspaceId,
      expires_at: expiresAt,
    });
    return { token, expiresAt };
  }

  async findByToken(token: string): Promise<{ userId: string; activeWorkspaceId: string | null } | null> {
    const tokenHash = hashToken(token);
    const row = await this.db("core_session")
      .where({ token_hash: tokenHash })
      .where("expires_at", ">", this.db.fn.now())
      .first();
    if (!row) return null;
    return {
      userId: String(row.user_id),
      activeWorkspaceId: row.active_workspace_id ? String(row.active_workspace_id) : null,
    };
  }

  async setActiveWorkspace(token: string, workspaceId: string): Promise<void> {
    const tokenHash = hashToken(token);
    await this.db("core_session").where({ token_hash: tokenHash }).update({
      active_workspace_id: workspaceId,
      updated_at: this.db.fn.now(),
    });
  }

  async deleteByToken(token: string): Promise<void> {
    const tokenHash = hashToken(token);
    await this.db("core_session").where({ token_hash: tokenHash }).del();
  }
}

export class AuditRepository {
  constructor(private readonly db: Knex) {}

  async log(event: AuditAction): Promise<void> {
    await this.db("audit_event").insert({
      action: event.action,
      actor_id: event.actorId,
      workspace_id: event.workspaceId,
      metadata: event.metadata ?? {},
    });
  }
}

export function createRepositories(db: Knex) {
  return {
    users: new UserRepository(db),
    workspaces: new WorkspaceRepository(db),
    sessions: new SessionRepository(db),
    audit: new AuditRepository(db),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
