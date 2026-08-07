import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { getDefaultDataDir } from "@graphscope/config";
import type { Knex } from "knex";

const DEMO_WORKSPACE_SLUG = "demo";

const DEMO_SDL = `type Query {
  hello: String!
  user(id: ID!): User
  users: [User!]!
}

type User {
  id: ID!
  name: String!
}
`;

const USERS_SDL = `extend type Query {
  users: [User!]!
}

type User {
  id: ID!
  name: String!
}
`;

const POSTS_SDL = `extend type Query {
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
}
`;

const CONFLICT_SDL = `type Query {
  hello: String!
}
type User {
  name: String!
}
`;

const ANTI_PATTERN_OPS = [
  {
    name: "DeepQuery",
    content: `query Deep {
  user(id: "1") {
    name
    friends { friends { friends { friends { friends { id name } } } } }
  }
}`,
  },
  {
    name: "Introspection",
    content: `query Introspect { __schema { types { name } } }`,
  },
  {
    name: "UnboundedUsers",
    content: `query AllUsers { users { id name email posts { title } } }`,
  },
  {
    name: "HelloWorld",
    content: `query Hello { hello }`,
  },
];

function hashContent(content: string): string {
  return createHash("sha256").update(content.trim()).digest("hex");
}

async function writeSdl(dataDir: string, projectId: number | string, sdl: string): Promise<string> {
  const contentHash = hashContent(sdl);
  const schemaDir = path.join(dataDir, "schemas", String(projectId));
  await fs.mkdir(schemaDir, { recursive: true });
  const sdlPath = path.join(schemaDir, `${contentHash}.graphql`);
  await fs.writeFile(sdlPath, sdl, "utf-8");
  return sdlPath;
}

function analyzeOperationLocal(content: string): {
  depth: number;
  complexity: number;
  findings: Array<{ ruleId: string; severity: string; message: string; path?: string | null }>;
} {
  const findings: Array<{ ruleId: string; severity: string; message: string; path?: string | null }> = [];
  if (content.includes("__schema")) {
    findings.push({ ruleId: "GS003_INTROSPECTION_QUERY", severity: "HIGH", message: "Introspection in operation" });
  }
  if ((content.match(/friends/g) ?? []).length >= 4) {
    findings.push({ ruleId: "GS002_DEPTH_LIMIT", severity: "HIGH", message: "Query depth exceeds recommended limit" });
  }
  if (content.includes("users {") && !content.includes("first") && !content.includes("limit")) {
    findings.push({ ruleId: "GS001_UNBOUNDED_LIST", severity: "HIGH", message: "Unbounded list selection" });
  }
  return { depth: 4, complexity: 100, findings };
}

async function insertOperation(
  db: Knex,
  workspaceId: number,
  projectId: number,
  op: { name: string; content: string },
): Promise<number> {
  const contentHash = hashContent(op.content);
  const existing = await db("core_operation").where({ project_id: projectId, content_hash: contentHash }).first();
  if (existing) return Number(existing.operation_id);

  const analysis = analyzeOperationLocal(op.content);
  const [row] = await db("core_operation")
    .insert({
      workspace_id: workspaceId,
      project_id: projectId,
      name: op.name,
      operation_type: "query",
      content: op.content,
      content_hash: contentHash,
      confidence: 0.95,
      depth: analysis.depth,
      complexity: analysis.complexity,
    })
    .returning("*");

  const operationId = Number(row.operation_id);
  if (analysis.findings.length) {
    await db("core_operation_finding").insert(
      analysis.findings.map((f) => ({
        workspace_id: workspaceId,
        operation_id: operationId,
        rule_id: f.ruleId,
        severity: f.severity,
        message: f.message,
        path: f.path ?? null,
      })),
    );
  }
  return operationId;
}

export async function seedDev(db: Knex): Promise<void> {
  const existing = await db("core_workspace").where({ slug: DEMO_WORKSPACE_SLUG }).first();
  if (existing) {
    console.log("Demo workspace already exists — run demo:reset to recreate.");
    return;
  }

  const dataDir = process.env.GRAPHSCOPE_DATA_DIR ?? getDefaultDataDir();

  const [workspace] = await db("core_workspace")
    .insert({ name: "Demo Workspace", slug: DEMO_WORKSPACE_SLUG })
    .returning("*");
  const workspaceId = Number(workspace.workspace_id);

  const [user] = await db("core_user")
    .insert({ name: "Demo User", local_username: "demo-user", github_login: null })
    .returning("*");

  await db("core_membership").insert({
    workspace_id: workspaceId,
    user_id: user.user_id,
    role: "OWNER",
  });

  const [project] = await db("core_project")
    .insert({ workspace_id: workspaceId, name: "Demo API", slug: "demo-api" })
    .returning("*");
  const projectId = Number(project.project_id);

  const [schema] = await db("core_schema")
    .insert({ workspace_id: workspaceId, project_id: projectId, name: "main" })
    .returning("*");

  const sdlPath = await writeSdl(dataDir, projectId, DEMO_SDL);
  await db("core_schema_version").insert({
    schema_id: schema.schema_id,
    workspace_id: workspaceId,
    content_hash: hashContent(DEMO_SDL),
    sdl_path: sdlPath,
  });

  const [env] = await db("core_environment")
    .insert({
      workspace_id: workspaceId,
      name: "Local",
      endpoint_url: "http://localhost:4000/graphql",
      is_production: false,
      headers_json: {},
    })
    .returning("*");

  for (const op of ANTI_PATTERN_OPS) {
    const operationId = await insertOperation(db, workspaceId, projectId, op);
    await db("core_execution").insert({
      workspace_id: workspaceId,
      operation_id: operationId,
      environment_id: env.environment_id,
      query_content: op.content,
      variables_json: "{}",
      status: "SUCCESS",
      http_status: 200,
      duration_ms: 45 + Math.floor(Math.random() * 120),
      response_bytes: 512,
      graphql_errors_count: 0,
      response_preview: '{"data":{"hello":"world"}}',
    });
  }

  // Federated composition demo project (two compatible subgraphs)
  const [fedProject] = await db("core_project")
    .insert({ workspace_id: workspaceId, name: "Federated Shop", slug: "federated-shop" })
    .returning("*");
  const fedProjectId = Number(fedProject.project_id);

  const [usersSchema] = await db("core_schema")
    .insert({ workspace_id: workspaceId, project_id: fedProjectId, name: "users" })
    .returning("*");
  const [postsSchema] = await db("core_schema")
    .insert({ workspace_id: workspaceId, project_id: fedProjectId, name: "posts" })
    .returning("*");

  await db("core_schema_version").insert({
    schema_id: usersSchema.schema_id,
    workspace_id: workspaceId,
    content_hash: hashContent(USERS_SDL),
    sdl_path: await writeSdl(dataDir, fedProjectId, USERS_SDL),
  });
  await db("core_schema_version").insert({
    schema_id: postsSchema.schema_id,
    workspace_id: workspaceId,
    content_hash: hashContent(POSTS_SDL),
    sdl_path: await writeSdl(dataDir, fedProjectId, POSTS_SDL),
  });

  // Conflicting composition demo
  const [badProject] = await db("core_project")
    .insert({ workspace_id: workspaceId, name: "Broken Federation", slug: "broken-federation" })
    .returning("*");
  const badProjectId = Number(badProject.project_id);

  const [badA] = await db("core_schema")
    .insert({ workspace_id: workspaceId, project_id: badProjectId, name: "subgraph-a" })
    .returning("*");
  const [badB] = await db("core_schema")
    .insert({ workspace_id: workspaceId, project_id: badProjectId, name: "subgraph-b" })
    .returning("*");

  await db("core_schema_version").insert({
    schema_id: badA.schema_id,
    workspace_id: workspaceId,
    content_hash: hashContent(DEMO_SDL),
    sdl_path: await writeSdl(dataDir, badProjectId, DEMO_SDL),
  });
  await db("core_schema_version").insert({
    schema_id: badB.schema_id,
    workspace_id: workspaceId,
    content_hash: hashContent(CONFLICT_SDL),
    sdl_path: await writeSdl(dataDir, badProjectId, CONFLICT_SDL),
  });

  console.log(
    `Seeded demo workspace with ${ANTI_PATTERN_OPS.length} operations, executions, federated + broken projects.`,
  );
}

export async function resetDemo(db: Knex): Promise<void> {
  await db("core_workspace").where({ slug: DEMO_WORKSPACE_SLUG }).del();
  await seedDev(db);
}
