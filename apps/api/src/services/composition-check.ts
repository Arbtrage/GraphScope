import { buildASTSchema, concatAST, GraphQLError, parse } from "graphql";

export interface CompositionResult {
  ok: boolean;
  errors: string[];
  mergedSdl?: string;
}

export function mergeSdls(sdls: string[]): string {
  return sdls.map((sdl) => sdl.trim()).filter(Boolean).join("\n\n");
}

export function validateComposition(sdls: string[]): CompositionResult {
  const trimmed = sdls.map((sdl) => sdl.trim()).filter(Boolean);
  if (trimmed.length === 0) {
    return { ok: true, errors: [], mergedSdl: "" };
  }

  const rootTypeCounts = new Map<string, number>();

  for (const sdl of trimmed) {
    const rootTypeMatches = sdl.match(/^type\s+(Query|Mutation|Subscription)\s*\{/gm);
    if (rootTypeMatches) {
      for (const match of rootTypeMatches) {
        const name = match.replace(/^type\s+/, "").replace(/\s*\{.*$/, "");
        rootTypeCounts.set(name, (rootTypeCounts.get(name) ?? 0) + 1);
      }
    }
  }
  const duplicateRoots = [...rootTypeCounts.entries()].filter(([, count]) => count > 1);
  if (duplicateRoots.length) {
    return {
      ok: false,
      errors: duplicateRoots.map(([name]) => `Duplicate root type "${name}" defined in multiple subgraphs (use extend type)`),
    };
  }

  try {
    const docs = trimmed.map((sdl) => parse(sdl));
    const merged = concatAST(docs);
    buildASTSchema(merged, { assumeValid: true });
    return { ok: true, errors: [], mergedSdl: mergeSdls(trimmed) };
  } catch (err) {
    const message =
      err instanceof GraphQLError
        ? err.message
        : err instanceof Error
          ? err.message
          : String(err);
    return { ok: false, errors: [message] };
  }
}
