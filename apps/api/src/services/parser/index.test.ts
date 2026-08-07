import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseRepository } from "./index.js";

describe("parser", () => {
  it("discovers operations from graphql files and tagged templates", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "gs-fixture-"));
    await fs.writeFile(
      path.join(root, "queries.graphql"),
      "query GetUser { user { id name } }\nmutation UpdateUser($id: ID!) { updateUser(id: $id) { id } }",
    );
    await fs.writeFile(
      path.join(root, "api.ts"),
      'export const q = gql`query FromTag { items { id } }`;\n',
    );
    const ops = await parseRepository(root);
    expect(ops.length).toBeGreaterThanOrEqual(2);
    const names = ops.map((o) => o.operationName).filter(Boolean);
    expect(names).toContain("GetUser");
  });
});
