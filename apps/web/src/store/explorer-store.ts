import { newHeaderPair, pairsFromRecord, recordFromPairs } from "@/components/HeaderEditor";
import { emptyCatalog, inferEntity, indexCatalog } from "@/data/catalog";
import type { HeaderPair, IndexedCatalog, OperationKind, Repository, SelectedEntity, ViewId } from "@/data/types";
import {
  createEnvironment as createEnvironmentApi,
  deleteEnvironment as deleteEnvironmentApi,
  endpointFromEnvironment,
  ensureLocalSession,
  executeExistingOperation,
  fetchCatalogRevision,
  fetchExplorerCatalog,
  fetchExplorerRepositories,
  fetchScanStatus,
  introspectEnvironment as introspectEnvironmentApi,
  isUnreachableError,
  openRepository as openRepositoryApi,
  reindexRepository as reindexRepositoryApi,
  reportFromScanStatus,
  toHistoryEntry,
  updateEnvironment as updateEnvironmentApi,
  type ScanReport,
} from "@/lib/explorer-api";
import { formatCode } from "@/lib/format-code";
import { draftFromPairs, loadRunDraft, pairsFromDraft, saveRunDraft } from "@/lib/run-drafts";
import { create } from "zustand";

export type RunTab = "response" | "errors" | "headers" | "timing";
export type RequestTab = "query" | "variables" | "headers" | "curl";
export type PaletteMode = "search" | "operations";
export type GraphLayout = "relationship" | "dependency" | "source";
export type OperationFilter = "all" | OperationKind;
export type Toast = { id: number; message: string };

interface GraphShow {
  operations: boolean;
  fragments: boolean;
  types: boolean;
  fields: boolean;
  files: boolean;
}

export type ScanErrorKind = "api" | "scan" | null;

interface ScanUi {
  active: boolean;
  jobId: string | null;
  path: string | null;
  step: string;
  doneCount: number;
  statsLabel: string | null;
  error: string | null;
  kind: ScanErrorKind;
  report: ScanReport | null;
  awaitingContinue: boolean;
}

interface ExplorerState {
  ready: boolean;
  catalog: IndexedCatalog;
  hasRepository: boolean;
  repositories: Repository[];
  activeRepositoryId: string | null;
  scan: ScanUi;
  view: ViewId;
  selected: SelectedEntity | null;
  showOperationDetail: boolean;
  inspectorOpen: boolean;
  runOpen: boolean;
  runStatus: "idle" | "running" | "done";
  runTab: RunTab;
  runResult: import("@/data/types").ExecutionResult | null;
  variableDraft: Record<string, string>;
  variableJson: string;
  queryDraft: string;
  headerDraft: HeaderPair[];
  requestTab: RequestTab;
  environmentId: string;
  paletteOpen: boolean;
  paletteMode: PaletteMode;
  operationFilter: OperationFilter;
  operationSort: "recent" | "name";
  graphShow: GraphShow;
  graphLayout: GraphLayout;
  graphFocusId: string | null;
  graphDimUnrelated: boolean;
  searchQuery: string;
  schemaTypeId: string;
  fileId: string;
  endpointId: string;
  history: IndexedCatalog["history"];
  toast: Toast | null;
  boot: () => Promise<void>;
  pickAndOpenRepository: () => Promise<void>;
  openRepositoryPath: (localPath: string) => Promise<void>;
  switchRepository: (id: string) => Promise<void>;
  resyncRepository: () => Promise<void>;
  dismissScanError: () => void;
  completeScan: () => void;
  replayOperation: (id: string) => void;
  pullEnvironmentSchema: (id: string) => Promise<boolean>;
  setView: (view: ViewId) => void;
  select: (entity: SelectedEntity, opts?: { openDetail?: boolean }) => void;
  clearSelection: () => void;
  openOperation: (id: string) => void;
  toggleInspector: () => void;
  setInspectorOpen: (open: boolean) => void;
  openRun: () => void;
  closeRun: () => void;
  setRunTab: (tab: RunTab) => void;
  setRequestTab: (tab: RequestTab) => void;
  setVariable: (key: string, value: string) => void;
  setVariableJson: (value: string) => void;
  setQueryDraft: (value: string) => void;
  setHeaderDraft: (pairs: HeaderPair[]) => void;
  executeRun: () => void;
  setEnvironment: (id: string) => void;
  saveEnvironment: (input: {
    id?: string | null;
    name: string;
    endpointUrl: string;
    isProduction: boolean;
    headers: Record<string, string>;
  }) => Promise<string | null>;
  removeEnvironment: (id: string) => Promise<boolean>;
  openPalette: (mode?: PaletteMode) => void;
  closePalette: () => void;
  setOperationFilter: (filter: OperationFilter) => void;
  setOperationSort: (sort: "recent" | "name") => void;
  toggleGraphShow: (key: keyof GraphShow) => void;
  setGraphLayout: (layout: GraphLayout) => void;
  setGraphFocus: (id: string | null) => void;
  focusNeighborhood: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSchemaType: (id: string) => void;
  setFile: (id: string) => void;
  setEndpoint: (id: string) => void;
  showToast: (message: string) => void;
  dismissToast: () => void;
  openInSource: (path: string, line?: number) => void;
  escape: () => boolean;
}

let toastSeq = 0;
let runTimer: number | undefined;
let pollTimer: number | undefined;
let revisionTimer: number | undefined;
let lastCatalogRevision = -1;
let bootPromise: Promise<void> | null = null;

const ACTIVE_REPO_KEY = "graphscope_active_repository";

function emptyScan(patch: Partial<ScanUi> = {}): ScanUi {
  return {
    active: false,
    jobId: null,
    path: null,
    step: "",
    doneCount: 0,
    statsLabel: null,
    error: null,
    kind: null,
    report: null,
    awaitingContinue: false,
    ...patch,
  };
}

let draftTimer: number | undefined;

function persistCurrentDraft(state: ExplorerState) {
  const selected = state.selected;
  if (selected?.kind !== "operation") return;
  saveRunDraft(
    selected.id,
    draftFromPairs({
      query: state.queryDraft,
      variableJson: state.variableJson,
      headerDraft: state.headerDraft,
      environmentId: state.environmentId,
    }),
  );
}

function schedulePersistDraft(get: () => ExplorerState) {
  if (draftTimer) window.clearTimeout(draftTimer);
  draftTimer = window.setTimeout(() => persistCurrentDraft(get()), 200);
}

function isIndexed(catalog: IndexedCatalog | null | undefined): boolean {
  return catalog?.repository.status === "INDEXED";
}

function applyCatalog(catalog: IndexedCatalog, prev: ExplorerState): Partial<ExplorerState> {
  const firstOp = catalog.operations[0];
  const firstType = catalog.types[0];
  const firstFile = catalog.files[0];
  const firstEp = catalog.endpoints[0];
  const selected =
    prev.selected && entityExists(catalog, prev.selected) ? prev.selected : firstOp ? { kind: "operation" as const, id: firstOp.id } : null;
  return {
    catalog,
    hasRepository: isIndexed(catalog),
    activeRepositoryId: catalog.repository.id || prev.activeRepositoryId,
    history: catalog.history.length ? catalog.history : prev.history,
    selected,
    schemaTypeId: firstType?.id ?? "",
    fileId: firstFile?.id ?? "",
    endpointId: prev.endpointId && catalog.endpointsById[prev.endpointId] ? prev.endpointId : firstEp?.id ?? "",
    environmentId:
      prev.environmentId && catalog.endpointsById[prev.environmentId]
        ? prev.environmentId
        : firstEp?.id ?? prev.environmentId,
  };
}

function entityExists(catalog: IndexedCatalog, selected: SelectedEntity): boolean {
  if (selected.kind === "operation") return Boolean(catalog.operationsById[selected.id]);
  if (selected.kind === "fragment") return Boolean(catalog.fragmentsById[selected.id]);
  if (selected.kind === "type") return Boolean(catalog.typesById[selected.id]);
  if (selected.kind === "field") return Boolean(catalog.fieldsById[selected.id]);
  if (selected.kind === "file") return Boolean(catalog.filesById[selected.id]);
  return Boolean(catalog.endpointsById[selected.id]);
}

function record(history: IndexedCatalog["history"], catalog: IndexedCatalog, operationId: string) {
  const op = catalog.operationsById[operationId];
  if (!op) return history;
  const next = history.filter((entry) => entry.operationId !== operationId);
  next.unshift(toHistoryEntry(op));
  return next.slice(0, 24);
}

export const useExplorer = create<ExplorerState>((set, get) => ({
  ready: false,
  catalog: emptyCatalog(),
  hasRepository: false,
  repositories: [],
  activeRepositoryId: null,
  scan: emptyScan(),
  view: "operations",
  selected: null,
  showOperationDetail: false,
  inspectorOpen: true,
  runOpen: false,
  runStatus: "idle",
  runTab: "response",
  runResult: null,
  variableDraft: {},
  variableJson: "{}",
  queryDraft: "",
  headerDraft: [newHeaderPair()],
  requestTab: "query",
  environmentId: "",
  paletteOpen: false,
  paletteMode: "search",
  operationFilter: "all",
  operationSort: "recent",
  graphShow: {
    operations: true,
    fragments: true,
    types: true,
    fields: false,
    files: false,
  },
  graphLayout: "relationship",
  graphFocusId: null,
  graphDimUnrelated: false,
  searchQuery: "",
  schemaTypeId: "",
  fileId: "",
  endpointId: "",
  history: [],
  toast: null,
  boot: async () => {
    if (bootPromise) return bootPromise;
    bootPromise = (async () => {
      try {
        await ensureLocalSession();
        const stored = localStorage.getItem(ACTIVE_REPO_KEY);
        const repositories = await fetchExplorerRepositories();
        let catalog = await fetchExplorerCatalog(stored);
        if (!isIndexed(catalog)) {
          const indexed = repositories.find((repo) => repo.status === "INDEXED");
          catalog = indexed ? await fetchExplorerCatalog(indexed.id) : null;
        }
        if (isIndexed(catalog) && catalog) {
          localStorage.setItem(ACTIVE_REPO_KEY, catalog.repository.id);
          set({ ready: true, repositories, view: "operations", ...applyCatalog(catalog, get()) });
          startRevisionPolling(catalog.repository.id, set, get);
          return;
        }
        const failed = repositories.find((repo) => repo.status === "ERROR" && repo.lastError);
        set({
          ready: true,
          repositories,
          catalog: emptyCatalog(),
          hasRepository: false,
          scan: emptyScan({
            path: failed?.localPath ?? null,
            error: failed?.lastError ?? null,
            kind: failed?.lastError ? "scan" : null,
          }),
        });
      } catch (err) {
        bootPromise = null;
        const unreachable = isUnreachableError(err);
        set({
          ready: true,
          scan: emptyScan({
            error: unreachable
              ? "Nothing is listening. Start GraphScope (desktop app or API) and retry."
              : err instanceof Error
                ? err.message
                : "Failed to start",
            kind: unreachable ? "api" : "scan",
          }),
        });
      }
    })();
    return bootPromise;
  },
  pickAndOpenRepository: async () => {
    const picked = window.graphscope?.openDirectory
      ? await window.graphscope.openDirectory()
      : window.prompt("Repository path");
    if (!picked) return;
    await get().openRepositoryPath(picked);
  },
  openRepositoryPath: async (localPath) => {
    const trimmed = localPath.trim().replace(/^['"]|['"]$/g, "");
    if (!trimmed) {
      get().showToast("Enter a repository path");
      return;
    }
    await ensureLocalSession();
    set({
      scan: emptyScan({
        active: true,
        path: trimmed,
        step: "Detecting GraphQL clients",
      }),
    });
    try {
      const { jobId, repositoryLinkId } = await openRepositoryApi(trimmed);
      localStorage.setItem(ACTIVE_REPO_KEY, repositoryLinkId);
      set({
        activeRepositoryId: repositoryLinkId,
        scan: { ...get().scan, jobId, path: trimmed, active: true, error: null, kind: null },
      });
      startPolling(jobId, repositoryLinkId, set, get);
    } catch (err) {
      const unreachable = isUnreachableError(err);
      set({
        scan: emptyScan({
          path: trimmed,
          error: unreachable
            ? "Nothing is listening. Start GraphScope (desktop app or API) and retry."
            : err instanceof Error
              ? err.message
              : "Could not open that folder",
          kind: unreachable ? "api" : "scan",
        }),
      });
    }
  },
  switchRepository: async (id) => {
    localStorage.setItem(ACTIVE_REPO_KEY, id);
    const [catalog, repositories] = await Promise.all([
      fetchExplorerCatalog(id),
      fetchExplorerRepositories(),
    ]);
    if (isIndexed(catalog) && catalog) {
      set({
        repositories,
        view: "operations",
        showOperationDetail: false,
        scan: emptyScan({ path: catalog.repository.localPath ?? null }),
        ...applyCatalog(catalog, get()),
      });
      startRevisionPolling(id, set, get);
      return;
    }
    const info = repositories.find((repo) => repo.id === id);
    set({
      repositories,
      activeRepositoryId: id,
      hasRepository: get().hasRepository && get().catalog.repository.status === "INDEXED",
      scan: emptyScan({
        path: info?.localPath ?? null,
        error: info?.lastError ?? "This repository has not been indexed yet",
        kind: "scan",
      }),
    });
  },
  resyncRepository: async () => {
    const id = get().activeRepositoryId || get().catalog.repository.id;
    const path = (get().catalog.repository.localPath ?? get().scan.path)?.trim() || null;
    if (!id && !path) {
      get().showToast("Open a repository first");
      return;
    }
    set({
      runOpen: false,
      scan: emptyScan({
        active: true,
        path,
        step: "Resyncing repository…",
      }),
    });
    try {
      await ensureLocalSession();
      // Prefer openRepository(localPath): returns jobId on all API versions and re-runs full parse.
      // Fall back to reindexRepository(id) when path is unknown.
      const payload = path
        ? await openRepositoryApi(path)
        : await reindexRepositoryApi(id);
      localStorage.setItem(ACTIVE_REPO_KEY, payload.repositoryLinkId);
      set({
        activeRepositoryId: payload.repositoryLinkId,
        scan: {
          ...get().scan,
          jobId: payload.jobId,
          path,
          active: true,
          error: null,
          kind: null,
        },
      });
      startPolling(payload.jobId, payload.repositoryLinkId, set, get);
    } catch (err) {
      const unreachable = isUnreachableError(err);
      set({
        scan: emptyScan({
          path,
          error: unreachable
            ? "Nothing is listening. Start GraphScope (desktop app or API) and retry."
            : err instanceof Error
              ? err.message
              : "Could not resync repository",
          kind: unreachable ? "api" : "scan",
        }),
      });
    }
  },
  dismissScanError: () => {
    const indexed = get().hasRepository && get().catalog.repository.status === "INDEXED";
    set({
      scan: emptyScan({
        path: indexed ? get().catalog.repository.localPath ?? null : get().scan.path,
      }),
    });
  },
  completeScan: () =>
    set({
      scan: emptyScan({ path: get().scan.path }),
      view: "operations",
      showOperationDetail: false,
    }),
  replayOperation: (id) => {
    get().select({ kind: "operation", id }, { openDetail: true });
    get().openRun();
  },
  pullEnvironmentSchema: async (id) => {
    try {
      const result = await introspectEnvironmentApi(id);
      if (!result.ok) {
        get().showToast(result.title ?? result.detail ?? "Could not pull schema");
        return false;
      }
      const catalog = await fetchExplorerCatalog(get().activeRepositoryId);
      if (isIndexed(catalog) && catalog) {
        set({ ...applyCatalog(catalog, get()) });
      }
      get().showToast(result.typeCount ? `Pulled ${result.typeCount} types` : "Schema pulled");
      return true;
    } catch (err) {
      get().showToast(
        isUnreachableError(err)
          ? "GraphScope API is not reachable"
          : err instanceof Error
            ? err.message
            : "Could not pull schema",
      );
      return false;
    }
  },
  setView: (view) => set({ view, showOperationDetail: false, runOpen: false }),
  select: (entity, opts) => {
    const catalog = get().catalog;
    const patch: Partial<ExplorerState> = { selected: entity, inspectorOpen: true };
    if (entity.kind === "operation") {
      patch.history = record(get().history, catalog, entity.id);
      const op = catalog.operationsById[entity.id];
      const current = get().selected;
      const sameOp = current?.kind === "operation" && current.id === entity.id;
      if (op) {
        if (!sameOp) {
          const draft = loadRunDraft(entity.id);
          patch.variableDraft = Object.fromEntries(
            Object.entries(op.variables).map(([key, value]) => [
              key,
              typeof value === "string" ? value : JSON.stringify(value ?? ""),
            ]),
          );
          patch.variableJson = formatCode(
            draft?.variableJson ?? JSON.stringify(op.variables ?? {}),
            "json",
          );
          patch.queryDraft = formatCode(draft?.query ?? op.document, "graphql");
          patch.headerDraft = draft ? pairsFromDraft(draft) : pairsFromRecord({});
          if (draft?.environmentId && catalog.endpointsById[draft.environmentId]) {
            patch.environmentId = draft.environmentId;
          } else if (op.endpointId) {
            patch.environmentId = op.endpointId;
          }
        } else if (op.endpointId && !get().environmentId) {
          patch.environmentId = op.endpointId;
        }
      }
      if (opts?.openDetail) {
        patch.showOperationDetail = true;
        patch.view = "operations";
      }
    }
    if (entity.kind === "type") patch.schemaTypeId = entity.id;
    if (entity.kind === "file") patch.fileId = entity.id;
    if (entity.kind === "endpoint") {
      patch.endpointId = entity.id;
      patch.environmentId = entity.id;
    }
    if (entity.kind === "fragment" || entity.kind === "type" || entity.kind === "operation") {
      patch.graphFocusId = entity.id;
    }
    set(patch);
  },
  clearSelection: () => set({ selected: null, graphDimUnrelated: false }),
  openOperation: (id) => {
    get().select({ kind: "operation", id }, { openDetail: true });
  },
  toggleInspector: () => set({ inspectorOpen: !get().inspectorOpen }),
  setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
  openRun: () => {
    const selected = get().selected;
    if (selected?.kind !== "operation") return;
    const op = get().catalog.operationsById[selected.id];
    if (!op) return;
    const alreadyOpen = get().runOpen && get().queryDraft;
    set({
      runOpen: true,
      runStatus: "idle",
      runResult: alreadyOpen ? get().runResult : null,
      runTab: alreadyOpen ? get().runTab : "response",
      requestTab: alreadyOpen ? get().requestTab : "query",
      queryDraft: get().queryDraft || formatCode(op.document, "graphql"),
      variableJson: get().variableJson || formatCode(JSON.stringify(op.variables ?? {}), "json"),
    });
  },
  closeRun: () => {
    if (runTimer) window.clearTimeout(runTimer);
    set({ runOpen: false, runStatus: "idle" });
  },
  setRunTab: (runTab) => set({ runTab }),
  setRequestTab: (requestTab) => set({ requestTab }),
  setVariable: (key, value) => {
    set({ variableDraft: { ...get().variableDraft, [key]: value } });
    schedulePersistDraft(get);
  },
  setVariableJson: (variableJson) => {
    set({ variableJson });
    schedulePersistDraft(get);
  },
  setQueryDraft: (queryDraft) => {
    set({ queryDraft });
    schedulePersistDraft(get);
  },
  setHeaderDraft: (headerDraft) => {
    set({ headerDraft });
    schedulePersistDraft(get);
  },
  executeRun: () => {
    const selected = get().selected;
    if (selected?.kind !== "operation") return;
    const op = get().catalog.operationsById[selected.id];
    if (!op) return;
    const environmentId = get().environmentId || op.endpointId;
    const endpoint = get().catalog.endpointsById[environmentId];
    if (!environmentId || !endpoint) {
      get().showToast("Add an environment first");
      get().setView("endpoints");
      return;
    }
    if (!endpoint.url.trim()) {
      get().showToast("Set an endpoint URL first");
      get().setView("endpoints");
      return;
    }
    let variables: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(get().variableJson || "{}") as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        variables = parsed as Record<string, unknown>;
      } else {
        get().showToast("Variables must be a JSON object");
        set({ requestTab: "variables", runOpen: true });
        return;
      }
    } catch {
      get().showToast("Variables must be valid JSON");
      set({ requestTab: "variables", runOpen: true });
      return;
    }
    const query = get().queryDraft.trim() || op.document;
    const headers = recordFromPairs(get().headerDraft);
    persistCurrentDraft(get());
    set({ runOpen: true, runStatus: "running", runResult: null, runTab: "response" });
    void executeExistingOperation({
      environmentId,
      operationId: op.id,
      query,
      variables,
      headers,
    })
      .then((result) => {
        const failed = result.kind !== "SUCCESS" || result.errors.length > 0;
        set({
          runStatus: "done",
          runResult: result,
          runTab: failed ? "errors" : "response",
          history: record(get().history, get().catalog, op.id),
        });
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Run failed";
        const unreachable = /failed to fetch|networkerror|load failed/i.test(message);
        const title = unreachable ? "GraphScope API is not reachable" : "Could not run request";
        set({
          runStatus: "done",
          runTab: "errors",
          runResult: {
            status: 0,
            statusText: "API ERROR",
            kind: "API_ERROR",
            title,
            detail: message,
            durationMs: 0,
            body: { error: { title, detail: message } },
            headers: {},
            errors: [{ message, title }],
            timing: { dns: 0, connect: 0, ttfb: 0, total: 0 },
          },
        });
      });
  },
  setEnvironment: (environmentId) => {
    set({ environmentId });
    schedulePersistDraft(get);
  },
  saveEnvironment: async (input) => {
    try {
      const env = input.id
        ? await updateEnvironmentApi(input.id, {
            name: input.name,
            endpointUrl: input.endpointUrl,
            isProduction: input.isProduction,
            headers: input.headers,
          })
        : await createEnvironmentApi({
            name: input.name,
            endpointUrl: input.endpointUrl,
            isProduction: input.isProduction,
            headers: input.headers,
          });
      const catalog = get().catalog;
      const mapped = endpointFromEnvironment(env, catalog.stats.operations);
      const previous = catalog.endpoints.find((item) => item.id === mapped.id);
      const next = {
        ...mapped,
        schemaPulled: previous?.schemaPulled ?? mapped.schemaPulled,
        schemaPulledAt: previous?.schemaPulledAt ?? mapped.schemaPulledAt,
      };
      const endpoints = input.id
        ? catalog.endpoints.map((item) => (item.id === next.id ? next : item))
        : [...catalog.endpoints, next];
      const indexed = indexCatalog({ ...catalog, endpoints, stats: { ...catalog.stats, endpoints: endpoints.length } });
      set({
        catalog: indexed,
        endpointId: next.id,
        environmentId: next.id,
        selected: { kind: "endpoint", id: next.id },
      });
      get().showToast(input.id ? "Environment saved" : "Environment created");
      return next.id;
    } catch (err) {
      get().showToast(err instanceof Error ? err.message : "Could not save environment");
      return null;
    }
  },
  removeEnvironment: async (id) => {
    try {
      await deleteEnvironmentApi(id);
      const catalog = get().catalog;
      const endpoints = catalog.endpoints.filter((item) => item.id !== id);
      const indexed = indexCatalog({ ...catalog, endpoints, stats: { ...catalog.stats, endpoints: endpoints.length } });
      const nextId = endpoints[0]?.id ?? "";
      set({
        catalog: indexed,
        endpointId: nextId,
        environmentId: get().environmentId === id ? nextId : get().environmentId,
        selected: nextId ? { kind: "endpoint", id: nextId } : null,
      });
      get().showToast("Environment deleted");
      return true;
    } catch (err) {
      get().showToast(err instanceof Error ? err.message : "Could not delete environment");
      return false;
    }
  },
  openPalette: (mode = "search") => set({ paletteOpen: true, paletteMode: mode }),
  closePalette: () => set({ paletteOpen: false }),
  setOperationFilter: (operationFilter) => set({ operationFilter }),
  setOperationSort: (operationSort) => set({ operationSort }),
  toggleGraphShow: (key) => set({ graphShow: { ...get().graphShow, [key]: !get().graphShow[key] } }),
  setGraphLayout: (graphLayout) => set({ graphLayout }),
  setGraphFocus: (graphFocusId) => set({ graphFocusId, graphDimUnrelated: Boolean(graphFocusId) }),
  focusNeighborhood: (id) =>
    set({
      graphFocusId: id,
      graphDimUnrelated: true,
      selected: inferEntity(id),
      inspectorOpen: true,
      view: "graph",
    }),
  setSearchQuery: (searchQuery) => set({ searchQuery, view: "search" }),
  setSchemaType: (schemaTypeId) =>
    set({ schemaTypeId, selected: { kind: "type", id: schemaTypeId }, inspectorOpen: true }),
  setFile: (fileId) => set({ fileId, selected: { kind: "file", id: fileId }, inspectorOpen: true }),
  setEndpoint: (endpointId) =>
    set({ endpointId, environmentId: endpointId, selected: { kind: "endpoint", id: endpointId }, inspectorOpen: true }),
  showToast: (message) => {
    const id = ++toastSeq;
    set({ toast: { id, message } });
    window.setTimeout(() => {
      if (get().toast?.id === id) set({ toast: null });
    }, 1800);
  },
  dismissToast: () => set({ toast: null }),
  openInSource: (path, line) => {
    const root = get().catalog.repository.localPath;
    const abs =
      root && !path.startsWith("/")
        ? `${root.replace(/\/$/, "")}/${path}`
        : path;
    if (window.graphscope?.openInSource) {
      void window.graphscope.openInSource({ path: abs, line });
      return;
    }
    get().showToast(`${abs}${line ? `:${line}` : ""}`);
  },
  escape: () => {
    if (get().paletteOpen) {
      set({ paletteOpen: false });
      return true;
    }
    if (get().runOpen) {
      get().closeRun();
      return true;
    }
    if (get().showOperationDetail && get().view === "operations") {
      set({ showOperationDetail: false });
      return true;
    }
    if (get().graphDimUnrelated) {
      set({ graphDimUnrelated: false, graphFocusId: get().selected?.id ?? null });
      return true;
    }
    if (get().inspectorOpen) {
      set({ inspectorOpen: false });
      return true;
    }
    return false;
  },
}));

function startRevisionPolling(
  repositoryLinkId: string,
  set: (partial: Partial<ExplorerState>) => void,
  get: () => ExplorerState,
) {
  if (revisionTimer) window.clearInterval(revisionTimer);
  lastCatalogRevision = -1;
  const tick = async () => {
    if (get().scan.active) return;
    if (get().activeRepositoryId !== repositoryLinkId) return;
    try {
      const revision = await fetchCatalogRevision(repositoryLinkId);
      if (lastCatalogRevision < 0) {
        lastCatalogRevision = revision;
        return;
      }
      if (revision === lastCatalogRevision) return;
      lastCatalogRevision = revision;
      const catalog = await fetchExplorerCatalog(repositoryLinkId);
      if (isIndexed(catalog) && catalog) {
        set({ ...applyCatalog(catalog, get()) });
      }
    } catch {
      /* ignore transient poll errors */
    }
  };
  void tick();
  revisionTimer = window.setInterval(() => void tick(), 1000);
}

function startPolling(
  jobId: string,
  repositoryLinkId: string,
  set: (partial: Partial<ExplorerState>) => void,
  get: () => ExplorerState,
) {
  if (pollTimer) window.clearInterval(pollTimer);
  if (revisionTimer) window.clearInterval(revisionTimer);
  const tick = async () => {
    try {
      const status = await fetchScanStatus(jobId);
      const doneCount = status.done ? 6 : Math.min(5, Math.max(0, scanStepIndex(status.step)));
      const report = reportFromScanStatus(status);
      set({
        scan: {
          ...get().scan,
          active: !status.done || !status.error,
          jobId,
          path: get().scan.path,
          step: status.step ?? "Scanning repository...",
          doneCount,
          statsLabel: status.stats ? `${status.stats.operations} operations discovered` : null,
          error: status.error,
          kind: status.error ? "scan" : null,
          report,
          awaitingContinue: false,
        },
      });
      if (!status.done) return;
      if (pollTimer) window.clearInterval(pollTimer);
      const repositories = await fetchExplorerRepositories();
      if (status.error) {
        set({
          repositories,
          scan: emptyScan({
            jobId,
            path: get().scan.path,
            step: status.step ?? "Scan failed",
            doneCount,
            error: status.error,
            kind: "scan",
            report,
          }),
        });
        return;
      }
      const catalog = await fetchExplorerCatalog(repositoryLinkId);
      if (isIndexed(catalog) && catalog) {
        set({
          repositories,
          ...applyCatalog(catalog, get()),
          scan: emptyScan({
            path: get().scan.path,
            doneCount: 6,
            statsLabel: status.stats ? `${status.stats.operations} operations discovered` : null,
            report,
            awaitingContinue: true,
          }),
        });
        startRevisionPolling(repositoryLinkId, set, get);
        return;
      }
      set({
        repositories,
        scan: emptyScan({
          path: get().scan.path,
          error: "Scan finished but no repository data was saved",
          kind: "scan",
          report,
        }),
      });
    } catch (err) {
      const unreachable = isUnreachableError(err);
      set({
        scan: emptyScan({
          path: get().scan.path,
          jobId: get().scan.jobId,
          error: unreachable
            ? "Nothing is listening. Start GraphScope (desktop app or API) and retry."
            : err instanceof Error
              ? err.message
              : "Scan failed",
          kind: unreachable ? "api" : "scan",
        }),
      });
      if (pollTimer) window.clearInterval(pollTimer);
    }
  };
  void tick();
  pollTimer = window.setInterval(() => void tick(), 400);
}

function scanStepIndex(step: string | null): number {
  const steps = [
    "Detecting GraphQL clients",
    "Indexing .graphql files",
    "Finding embedded operations",
    "Resolving fragments",
    "Building schema relationships",
    "Mapping source references",
  ];
  if (!step) return 0;
  const idx = steps.findIndex((item) => step.includes(item) || item.includes(step));
  return idx === -1 ? 1 : idx + 1;
}
