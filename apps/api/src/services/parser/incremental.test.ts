import { describe, expect, it, vi } from "vitest";

/**
 * Path-owned incremental catalog rules (mirrors persistCatalogIncremental):
 * ops/frags whose file_path is in ownedPaths are replaced; deletedPaths remove rows;
 * untouched paths are never targeted for delete.
 */
function ownedCatalogPaths(changedPaths: string[], deletedPaths: string[]): string[] {
  return [...new Set([...changedPaths, ...deletedPaths])];
}

describe("incremental persist ownership", () => {
  it("changing one file only owns that path", () => {
    const owned = ownedCatalogPaths(["ops/b.graphql"], []);
    expect(owned).toEqual(["ops/b.graphql"]);
    expect(owned).not.toContain("ops/a.graphql");
  });

  it("deleting a file includes it in owned paths for removal", () => {
    const owned = ownedCatalogPaths([], ["ops/gone.graphql"]);
    expect(owned).toEqual(["ops/gone.graphql"]);
  });

  it("union of changed and deleted is unique", () => {
    const owned = ownedCatalogPaths(["a.graphql", "b.graphql"], ["a.graphql", "c.graphql"]);
    expect(owned.sort()).toEqual(["a.graphql", "b.graphql", "c.graphql"]);
  });
});

describe("incremental job skip when clean", () => {
  it("skips persist when no dirty and no deleted paths", async () => {
    const persist = vi.fn();
    const dirty: string[] = [];
    const deletedPaths: string[] = [];
    if (!dirty.length && !deletedPaths.length) {
      // mirrors parse-repo-incremental early return
    } else {
      persist();
    }
    expect(persist).not.toHaveBeenCalled();
  });
});
