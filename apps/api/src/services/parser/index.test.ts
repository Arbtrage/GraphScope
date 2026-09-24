import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Knex } from "@graphscope/db";
import { describe, expect, it } from "vitest";
import {
  enqueueWatcherPathsForTests,
  startRepoWatcher,
  stopRepoWatcher,
} from "../repo-watcher.js";
import {
  fingerprintPath,
  parseFiles,
  parseRepository,
  selectDirtyPaths,
} from "./index.js";

describe("parser", () => {
  it("discovers operations from graphql files and tagged templates", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "gs-fixture-"));
    await fs.writeFile(
      path.join(root, "queries.graphql"),
      "query GetUser { user { id name } }\nmutation UpdateUser($id: ID!) { updateUser(id: $id) { id } }",
    );
    await fs.writeFile(
      path.join(root, "api.ts"),
      "export const q = gql`query FromTag { items { id } }`;\n",
    );
    const result = await parseRepository(root);
    expect(result.operations.length).toBeGreaterThanOrEqual(2);
    const names = result.operations.map((o) => o.name).filter(Boolean);
    expect(names).toContain("GetUser");
    expect(names).toContain("UpdateUser");
    expect(names).toContain("FromTag");
    expect(result.fingerprints.length).toBeGreaterThan(0);
  });

  it("splits multi-definition files, graphql() calls, fragments, and unused ops", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "gs-catalog-"));
    await fs.mkdir(path.join(root, "hooks"), { recursive: true });
    await fs.writeFile(
      path.join(root, "package.json"),
      JSON.stringify({ dependencies: { "@apollo/client": "3.0.0", "graphql-tag": "2.0.0" } }),
    );
    await fs.writeFile(
      path.join(root, "ops.graphql"),
      `fragment UserFields on User { id name }
query GetUser { user { ...UserFields } }
query UnusedOp { ping }`,
    );
    await fs.writeFile(
      path.join(root, "hooks", "useUser.ts"),
      `export const GET_USER = graphql(\`query FromFn { user { id } }\`);
export function useUser() { return GetUser; }
`,
    );
    await fs.writeFile(
      path.join(root, "dup.graphql"),
      "fragment UserFields on User { id email }",
    );

    const result = await parseRepository(root);
    const names = result.operations.map((o) => o.name);
    expect(names).toEqual(expect.arrayContaining(["GetUser", "UnusedOp", "FromFn"]));
    expect(result.fragments.some((item) => item.name === "UserFields")).toBe(true);
    expect(result.fragments.some((item) => item.duplicateOf === "UserFields")).toBe(true);
    expect(result.clients).toEqual(expect.arrayContaining(["Apollo", "graphql-tag", ".graphql files"]));
    expect(result.operations.find((o) => o.name === "UnusedOp")?.unused).toBe(true);
    expect(result.operations.find((o) => o.name === "GetUser")?.unused).toBe(false);
    expect(result.endpoints.length).toBeGreaterThan(0);
    expect(result.edges.length).toBeGreaterThan(0);
  });

  it("parseFiles extracts ops from a single changed file", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "gs-inc-"));
    await fs.writeFile(path.join(root, "a.graphql"), "query KeepMe { ping }\n");
    await fs.writeFile(path.join(root, "b.graphql"), "query OnlyB { ping }\n");
    const sliced = await parseFiles(root, ["b.graphql"]);
    expect(sliced.operations.map((op) => op.name)).toEqual(["OnlyB"]);
    expect(sliced.changedPaths).toEqual(["b.graphql"]);
  });

  it("selectDirtyPaths skips unchanged fingerprints", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "gs-fp-"));
    const file = path.join(root, "ops.graphql");
    await fs.writeFile(file, "query Stable { ping }\n");
    const fp = await fingerprintPath(root, "ops.graphql");
    expect(fp).not.toBeNull();
    const first = await selectDirtyPaths(root, ["ops.graphql"], [fp!]);
    expect(first.dirty).toEqual([]);
    expect(first.clean).toEqual(["ops.graphql"]);

    await fs.writeFile(file, "query Changed { ping }\n");
    const second = await selectDirtyPaths(root, ["ops.graphql"], [fp!]);
    expect(second.dirty).toEqual(["ops.graphql"]);
  });

  it("ignores JSDoc/URL backticks after /graphql and expands ${CONST} field lists", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "gs-interp-"));
    await fs.writeFile(
      path.join(root, "uri.ts"),
      "/** may be `http://host:3010/graphql`. */\nexport const u = `${base}/graphql`\n",
    );
    await fs.writeFile(
      path.join(root, "savings.ts"),
      `const FIELDS = \`
  id
  name
\`;
export const Q = gql\`
  query SavingsList {
    savings {
      \${FIELDS}
    }
  }
\`;
`,
    );
    const uri = await parseFiles(root, ["uri.ts"]);
    expect(uri.operations).toEqual([]);
    expect(uri.parseErrors).toEqual([]);

    const savings = await parseFiles(root, ["savings.ts"]);
    expect(savings.parseErrors).toEqual([]);
    expect(savings.operations.map((op) => op.name)).toEqual(["SavingsList"]);
  });
});

describe("repo watcher coalesce", () => {
  it("merges pending changed and deleted paths", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "gs-watch-"));
    const fakeDb = {} as Knex;
    await startRepoWatcher(fakeDb, {
      workspaceId: "1",
      projectId: "1",
      repositoryLinkId: "link-1",
      rootDir: root,
    });
    const pending = enqueueWatcherPathsForTests("link-1", ["a.graphql", "b.ts"], ["gone.graphql"]);
    expect(pending?.changed.sort()).toEqual(["a.graphql", "b.ts"]);
    expect(pending?.deleted).toEqual(["gone.graphql"]);
    const again = enqueueWatcherPathsForTests("link-1", ["c.graphql"], ["a.graphql"]);
    expect(again?.changed.sort()).toEqual(["b.ts", "c.graphql"]);
    expect(again?.deleted.sort()).toEqual(["a.graphql", "gone.graphql"]);
    await stopRepoWatcher("link-1");
  });
});
