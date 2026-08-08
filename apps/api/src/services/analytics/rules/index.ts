import { parse, visit, type DocumentNode, type FieldNode } from "graphql";
import type { FindingSeverity } from "@graphscope/shared-types";

export type { FindingSeverity };

export interface RuleFinding {
  ruleId: string;
  severity: FindingSeverity;
  message: string;
  path?: string | null;
}

export interface AnalysisMetrics {
  depth: number;
  complexity: number;
}

export interface AnalysisResult extends AnalysisMetrics {
  findings: RuleFinding[];
}

const DEPTH_LIMIT = 12;
const COMPLEXITY_LIMIT = 1000;
const FRAGMENT_LIMIT = 10;
const ALIAS_LIMIT = 5;
const PAGINATION_ARGS = new Set(["first", "last", "limit", "take", "skip", "offset", "page", "pageSize"]);

export function analyzeOperation(content: string): AnalysisResult {
  let doc: DocumentNode;
  try {
    doc = parse(content);
  } catch {
    return { depth: 0, complexity: 0, findings: [] };
  }

  const metrics = computeMetrics(doc);
  const findings = runRules(doc, metrics);
  return { ...metrics, findings };
}

function computeMetrics(doc: DocumentNode): AnalysisMetrics {
  let maxDepth = 0;
  let currentDepth = 0;
  let complexity = 0;

  visit(doc, {
    Field(node) {
      complexity += 1;
      if (node.selectionSet) {
        currentDepth += 1;
        if (currentDepth > maxDepth) maxDepth = currentDepth;
        complexity += childFieldCount(node.selectionSet);
      }
    },
    leave(node) {
      if (node.kind === "Field" && (node as FieldNode).selectionSet) {
        currentDepth -= 1;
      }
    },
  });

  return { depth: maxDepth, complexity };
}

function childFieldCount(selectionSet: NonNullable<FieldNode["selectionSet"]>): number {
  return selectionSet.selections.filter((s) => s.kind === "Field").length;
}

function hasPaginationArgs(field: FieldNode): boolean {
  return (field.arguments ?? []).some((arg) => PAGINATION_ARGS.has(arg.name.value));
}

function fieldPath(node: FieldNode, ancestors: readonly unknown[]): string {
  const parts: string[] = [];
  for (const ancestor of ancestors) {
    if (typeof ancestor === "object" && ancestor !== null && "kind" in ancestor) {
      const a = ancestor as FieldNode;
      if (a.kind === "Field") {
        parts.push(a.alias?.value ?? a.name.value);
      }
    }
  }
  parts.push(node.alias?.value ?? node.name.value);
  return parts.join(".");
}

export function runRules(doc: DocumentNode, metrics: AnalysisMetrics): RuleFinding[] {
  const findings: RuleFinding[] = [];

  // GS007 — multiple operations in one document
  const opCount = doc.definitions.filter((d) => d.kind === "OperationDefinition").length;
  if (opCount > 1) {
    findings.push({
      ruleId: "GS007_MULTIPLE_OPERATIONS",
      severity: "MEDIUM",
      message: `Document contains ${opCount} operations; prefer one operation per request.`,
    });
  }

  // GS003 — introspection (excluding __typename meta field)
  visit(doc, {
    Field(node) {
      const name = node.name.value;
      if (name.startsWith("__") && name !== "__typename") {
        findings.push({
          ruleId: "GS003_INTROSPECTION_QUERY",
          severity: "HIGH",
          message: "Introspection field detected; avoid introspection in production operations.",
          path: name,
        });
      }
    },
  });

  // GS001 — unbounded list selections
  visit(doc, {
    Field(node, _key, _parent, _path, ancestors) {
      if (!node.selectionSet) return;
      if (hasPaginationArgs(node)) return;
      findings.push({
        ruleId: "GS001_UNBOUNDED_LIST",
        severity: "HIGH",
        message: `Field "${node.name.value}" has nested selections without pagination arguments.`,
        path: fieldPath(node, ancestors),
      });
    },
  });

  // GS002 — depth limit
  if (metrics.depth > DEPTH_LIMIT) {
    findings.push({
      ruleId: "GS002_DEPTH_LIMIT",
      severity: metrics.depth > DEPTH_LIMIT + 4 ? "CRITICAL" : "HIGH",
      message: `Query depth ${metrics.depth} exceeds recommended limit of ${DEPTH_LIMIT}.`,
    });
  }

  // GS004 — complexity
  if (metrics.complexity > COMPLEXITY_LIMIT) {
    findings.push({
      ruleId: "GS004_HIGH_COMPLEXITY",
      severity: metrics.complexity > COMPLEXITY_LIMIT * 2 ? "CRITICAL" : "HIGH",
      message: `Estimated complexity ${metrics.complexity} exceeds recommended limit of ${COMPLEXITY_LIMIT}.`,
    });
  }

  // GS005 — fragment overload
  let fragmentCount = 0;
  visit(doc, {
    FragmentSpread() {
      fragmentCount++;
    },
  });
  if (fragmentCount > FRAGMENT_LIMIT) {
    findings.push({
      ruleId: "GS005_FRAGMENT_OVERLOAD",
      severity: "MEDIUM",
      message: `Document uses ${fragmentCount} fragment spreads (limit ${FRAGMENT_LIMIT}).`,
    });
  }

  // GS006 — alias overload
  let aliasCount = 0;
  visit(doc, {
    Field(node) {
      if (node.alias) aliasCount++;
    },
  });
  if (aliasCount > ALIAS_LIMIT) {
    findings.push({
      ruleId: "GS006_ALIAS_OVERLOAD",
      severity: "LOW",
      message: `Document uses ${aliasCount} field aliases (limit ${ALIAS_LIMIT}).`,
    });
  }

  return dedupeFindings(findings);
}

function dedupeFindings(findings: RuleFinding[]): RuleFinding[] {
  const seen = new Set<string>();
  return findings.filter((f) => {
    const key = `${f.ruleId}:${f.path ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
