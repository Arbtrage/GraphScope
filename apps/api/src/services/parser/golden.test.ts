import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseRepository } from "./index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GOLDEN_REPO = path.resolve(__dirname, "../../../../../fixtures/repos/minimal");

describe("parser golden recall", () => {
  it("discovers the expected operations from the minimal fixture repo", async () => {
    const result = await parseRepository(GOLDEN_REPO);
    const names = result.operations.map((o) => o.name).filter(Boolean).sort();

    expect(names).toEqual(["CreateItem", "GetUser", "ListItems", "UpdateUser"]);

    const byName = Object.fromEntries(result.operations.filter((o) => o.name).map((o) => [o.name, o]));
    expect(byName.GetUser?.operationType).toBe("QUERY");
    expect(byName.UpdateUser?.operationType).toBe("MUTATION");
    expect(byName.ListItems?.operationType).toBe("QUERY");
    expect(byName.CreateItem?.operationType).toBe("MUTATION");
    expect(byName.ListItems?.confidence).toBeLessThan(1);
  });
});
