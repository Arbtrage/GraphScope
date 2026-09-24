import { pairsFromRecord, recordFromPairs } from "@/components/HeaderEditor";
import type { HeaderPair } from "@/data/types";

const KEY = "graphscope_run_drafts";

export interface RunDraft {
  query: string;
  variableJson: string;
  headers: Record<string, string>;
  environmentId: string;
}

function readAll(): Record<string, RunDraft> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, RunDraft>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function loadRunDraft(operationId: string): RunDraft | null {
  return readAll()[operationId] ?? null;
}

export function saveRunDraft(operationId: string, draft: RunDraft): void {
  const all = readAll();
  all[operationId] = draft;
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function draftFromPairs(input: {
  query: string;
  variableJson: string;
  headerDraft: HeaderPair[];
  environmentId: string;
}): RunDraft {
  return {
    query: input.query,
    variableJson: input.variableJson,
    headers: recordFromPairs(input.headerDraft),
    environmentId: input.environmentId,
  };
}

export function pairsFromDraft(draft: RunDraft): HeaderPair[] {
  return pairsFromRecord(draft.headers);
}
