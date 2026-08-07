import { describe, expect, it } from "vitest";
import { analyzeOperation, runRules } from "./index.js";
import { parse } from "graphql";

describe("analytics rules", () => {
  it("GS001 flags nested selections without pagination", () => {
    const result = analyzeOperation(`
      query Users {
        users {
          id
          name
        }
      }
    `);
    expect(result.findings.some((f) => f.ruleId === "GS001_UNBOUNDED_LIST")).toBe(true);
  });

  it("GS001 passes when pagination args present", () => {
    const result = analyzeOperation(`
      query Users {
        users(first: 10) {
          id
        }
      }
    `);
    expect(result.findings.some((f) => f.ruleId === "GS001_UNBOUNDED_LIST")).toBe(false);
  });

  it("GS002 flags deep nesting", () => {
    const nested = Array.from({ length: 14 }, (_, i) => `f${i}`).reduce(
      (inner, name) => `${name} { ${inner} }`,
      "leaf",
    );
    const result = analyzeOperation(`query Deep { ${nested} }`);
    expect(result.findings.some((f) => f.ruleId === "GS002_DEPTH_LIMIT")).toBe(true);
    expect(result.depth).toBeGreaterThan(12);
  });

  it("GS003 flags introspection fields", () => {
    const result = analyzeOperation(`query Intro { __schema { types { name } } }`);
    expect(result.findings.some((f) => f.ruleId === "GS003_INTROSPECTION_QUERY")).toBe(true);
  });

  it("GS004 flags high complexity", () => {
    const fields = Array.from({ length: 60 }, (_, i) => `f${i} { a { b { c { d { e { f { g { h { i { j { k } } } } } } } } } } }`).join("\n");
    const result = analyzeOperation(`query Heavy { ${fields} }`);
    expect(result.findings.some((f) => f.ruleId === "GS004_HIGH_COMPLEXITY")).toBe(true);
  });

  it("GS005 flags fragment overload", () => {
    const spreads = Array.from({ length: 12 }, (_, i) => `...F${i}`).join("\n");
    const frags = Array.from({ length: 12 }, (_, i) => `fragment F${i} on Query { __typename }`).join("\n");
    const result = analyzeOperation(`query Frags { ${spreads} } ${frags}`);
    expect(result.findings.some((f) => f.ruleId === "GS005_FRAGMENT_OVERLOAD")).toBe(true);
  });

  it("GS006 flags alias overload", () => {
    const aliases = Array.from({ length: 8 }, (_, i) => `a${i}: __typename`).join("\n");
    const result = analyzeOperation(`query Aliases { ${aliases} }`);
    expect(result.findings.some((f) => f.ruleId === "GS006_ALIAS_OVERLOAD")).toBe(true);
  });

  it("GS007 flags multiple operations", () => {
    const result = analyzeOperation(`query A { __typename } query B { __typename }`);
    expect(result.findings.some((f) => f.ruleId === "GS007_MULTIPLE_OPERATIONS")).toBe(true);
  });

  it("returns empty findings for simple valid query", () => {
    const result = analyzeOperation(`query Hello { __typename }`);
    expect(result.findings).toHaveLength(0);
    expect(result.depth).toBe(0);
    expect(result.complexity).toBeGreaterThanOrEqual(1);
  });

  it("runRules accepts precomputed metrics", () => {
    const doc = parse(`query Shallow { __typename }`);
    const findings = runRules(doc, { depth: 20, complexity: 2000 });
    expect(findings.some((f) => f.ruleId === "GS002_DEPTH_LIMIT")).toBe(true);
    expect(findings.some((f) => f.ruleId === "GS004_HIGH_COMPLEXITY")).toBe(true);
  });
});
