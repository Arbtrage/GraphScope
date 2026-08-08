"use client";

import dynamic from "next/dynamic";
import { gql, useQuery } from "@apollo/client";
import {
  AiSidePanel,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ErrorState,
  Input,
  OperationRunner,
  PageSkeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@graphscope/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getActiveEnvironmentId,
  setActiveEnvironmentId,
  subscribeActiveEnvironment,
} from "@/lib/active-environment";
import { useGraphMutation } from "@/hooks/use-graph-mutation";
import { toastMutationSuccess } from "@/lib/apollo-error";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="h-[320px] animate-pulse rounded-md bg-muted" />,
});

import {
  ENVIRONMENTS_FOR_EXECUTE as ENVIRONMENTS,
  OPERATION_FOR_RUN as OPERATION,
  COLLECTION_ITEM_FOR_EXECUTE as COLLECTION_ITEM,
  EXECUTE_OPERATION as EXECUTE,
  COLLECTIONS_FOR_SAVE as COLLECTIONS,
  CREATE_COLLECTION_FOR_SAVE as CREATE_COLLECTION,
  SAVE_TO_COLLECTION,
} from "@/graphql/execution";

const AI_SETTINGS = gql`
  query AiSettingsForExecute {
    aiSettings {
      redactionMode
      enabled
      hasOpenAiKey
    }
  }
`;

const EXPLAIN_OPERATION = gql`
  mutation ExplainOperation($input: ExplainOperationInput!) {
    explainOperation(input: $input) {
      markdown
      citations {
        typeName
        fieldName
      }
    }
  }
`;

const GENERATE_OPERATION = gql`
  mutation GenerateOperation($input: GenerateOperationInput!) {
    generateOperation(input: $input) {
      document
      warnings
    }
  }
`;

const PROJECT_SCHEMAS = gql`
  query ProjectSchemas($projectId: ID!) {
    schemas(projectId: $projectId) {
      id
    }
  }
`;

const SCHEMA_VERSIONS_BY_SCHEMA = gql`
  query SchemaVersionsBySchema($schemaId: ID!) {
    schemaVersions(schemaId: $schemaId) {
      id
    }
  }
`;

type ExecuteData = {
  executeOperation: {
    responseBody: string;
    execution: { id: string; status: string; durationMs: number; httpStatus?: number | null };
  };
};

type ExplainData = {
  explainOperation: { markdown: string; citations: Array<{ typeName: string; fieldName?: string | null }> };
};
type GenerateData = {
  generateOperation: { document: string; warnings: string[] };
};

export function ExecuteWorkbench() {
  const searchParams = useSearchParams();
  const operationId = searchParams.get("operationId");
  const itemId = searchParams.get("itemId");

  const envQuery = useQuery(ENVIRONMENTS, { skip: !!(operationId || itemId) });
  const opQuery = useQuery(OPERATION, {
    variables: { id: operationId ?? "" },
    skip: !operationId,
  });
  const itemQuery = useQuery(COLLECTION_ITEM, {
    variables: { id: itemId ?? "" },
    skip: !itemId,
  });

  const loading = operationId ? opQuery.loading : itemId ? itemQuery.loading : envQuery.loading;
  const error = operationId ? opQuery.error : itemId ? itemQuery.error : envQuery.error;
  const refetch = operationId ? opQuery.refetch : itemId ? itemQuery.refetch : envQuery.refetch;

  const environments =
    (operationId
      ? opQuery.data?.environments
      : itemId
        ? itemQuery.data?.environments
        : envQuery.data?.environments) ?? [];

  const [execute, { loading: executing }] = useGraphMutation<ExecuteData>(EXECUTE);
  const [saveToCollection] = useGraphMutation(SAVE_TO_COLLECTION, { successMessage: "Saved to collection" });
  const [createCollection] = useGraphMutation<{ createCollection: { id: string; name: string } }>(CREATE_COLLECTION);
  const { data: collectionsData, refetch: refetchCollections } = useQuery(COLLECTIONS);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveCollectionId, setSaveCollectionId] = useState("");
  const [result, setResult] = useState<string | undefined>();
  const [meta, setMeta] = useState<{ status?: string; durationMs?: number; httpStatus?: number | null }>();
  const [query, setQuery] = useState<string | undefined>();
  const [variables, setVariables] = useState("{}");
  const [aiOpen, setAiOpen] = useState(false);
  const [explanation, setExplanation] = useState<{
    markdown: string;
    citations: Array<{ typeName: string; fieldName?: string | null }>;
  }>();
  const [generated, setGenerated] = useState<{ document: string; warnings: string[] }>();
  const [envId, setEnvId] = useState<string | null>(null);

  const projectId = opQuery.data?.operation?.projectId;
  const { data: schemasData } = useQuery(PROJECT_SCHEMAS, {
    variables: { projectId: projectId ?? "" },
    skip: !projectId,
  });
  const firstSchemaId = schemasData?.schemas?.[0]?.id;
  const { data: versionsData } = useQuery(SCHEMA_VERSIONS_BY_SCHEMA, {
    variables: { schemaId: firstSchemaId ?? "" },
    skip: !firstSchemaId,
  });
  const schemaVersionId = versionsData?.schemaVersions?.[0]?.id;
  const { data: aiSettingsData } = useQuery(AI_SETTINGS);
  const [explainOp, { loading: explaining }] = useGraphMutation<ExplainData>(EXPLAIN_OPERATION);
  const [generateOp, { loading: generating }] = useGraphMutation<GenerateData>(GENERATE_OPERATION);

  const collectionItem = itemQuery.data?.collectionItem;
  const initialQuery = useMemo(() => {
    if (collectionItem?.queryContent) return collectionItem.queryContent;
    return opQuery.data?.operation?.content ?? "query { __typename }";
  }, [collectionItem?.queryContent, opQuery.data?.operation?.content]);

  useEffect(() => {
    const stored = getActiveEnvironmentId();
    if (stored) setEnvId(stored);
    return subscribeActiveEnvironment((id) => setEnvId(id));
  }, []);

  useEffect(() => {
    if (environments.length && !envId) {
      const next = getActiveEnvironmentId() ?? environments[0].id;
      setEnvId(next);
      setActiveEnvironmentId(next);
    }
  }, [environments, envId]);

  useEffect(() => {
    if (collectionItem?.variablesJson) {
      setVariables(collectionItem.variablesJson);
    }
  }, [collectionItem?.id, collectionItem?.variablesJson]);

  useEffect(() => {
    const list = collectionsData?.collections ?? [];
    if (list.length && !saveCollectionId) setSaveCollectionId(list[0].id);
  }, [collectionsData?.collections, saveCollectionId]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col gap-4 p-4 md:p-6">
        <div className="h-10 w-64 animate-pulse rounded-md bg-muted" />
        <div className="h-12 animate-pulse rounded-full bg-muted/80" />
        <div className="grid min-h-[480px] flex-1 gap-4 lg:grid-cols-2">
          <div className="animate-pulse rounded-[1.75rem] bg-muted/50" />
          <div className="animate-pulse rounded-[1.75rem] bg-muted/50" />
        </div>
      </div>
    );
  }
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const activeQuery = query ?? initialQuery;
  const title =
    collectionItem?.name ?? opQuery.data?.operation?.name ?? (itemId || operationId ? "Saved request" : "Ad-hoc query");
  const draftSource = Boolean(operationId || itemId);
  const provenanceOperationId = operationId ?? collectionItem?.operationId ?? undefined;

  const handleEnvChange = (id: string) => {
    setEnvId(id);
    setActiveEnvironmentId(id);
  };

  return (
    <div className="flex h-full min-h-0 flex-col p-4 md:p-6 lg:px-8">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Execute</p>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {draftSource && (
              <Badge variant="secondary">Editing draft — Run uses your editor text</Badge>
            )}
            {meta?.status && <Badge variant="outline">{meta.status}</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAiOpen(true)}>
            AI Copilot
          </Button>
          <AiSidePanel
            open={aiOpen}
            onOpenChange={setAiOpen}
            operationId={provenanceOperationId}
            operationContent={activeQuery}
            projectId={projectId}
            schemaVersionId={schemaVersionId}
            settings={aiSettingsData?.aiSettings}
            loading={explaining || generating}
            explanation={explanation}
            generated={generated}
            onExplain={async () => {
              const { data: explainData } = await explainOp({
                variables: {
                  input: {
                    operationId: provenanceOperationId ?? undefined,
                    operationContent: provenanceOperationId ? undefined : activeQuery,
                    projectId: projectId ?? undefined,
                    schemaVersionId: schemaVersionId ?? undefined,
                  },
                },
              });
              if (explainData?.explainOperation) setExplanation(explainData.explainOperation);
            }}
            onGenerate={async (prompt) => {
              if (!schemaVersionId) return;
              const { data: genData } = await generateOp({
                variables: { input: { prompt, schemaVersionId } },
              });
              if (genData?.generateOperation) setGenerated(genData.generateOperation);
            }}
            onApplyGenerated={(doc) => {
              setQuery(doc);
              setAiOpen(false);
            }}
          />
          <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Save request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save to collection</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Store this query and variables as a reusable request. Open it later from Collections.
              </p>
              <div className="space-y-3">
                <Input
                  placeholder="Request name"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  aria-label="Request name"
                />
                <Select value={saveCollectionId} onValueChange={setSaveCollectionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {(collectionsData?.collections ?? []).map((c: { id: string; name: string }) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!(collectionsData?.collections ?? []).length && (
                  <p role="alert" className="text-xs text-muted-foreground">
                    No collections yet — we will create “Saved requests” when you save.
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  disabled={!saveName.trim()}
                  onClick={async () => {
                    let collectionId = saveCollectionId || "";
                    if (!collectionId) {
                      const created = await createCollection({ variables: { name: "Saved requests" } });
                      const id = created.data?.createCollection?.id;
                      if (!id) return;
                      collectionId = id;
                      await refetchCollections();
                    }
                    await saveToCollection({
                      variables: {
                        input: {
                          collectionId,
                          name: saveName.trim(),
                          queryContent: activeQuery,
                          variablesJson: variables || "{}",
                          operationId: provenanceOperationId ?? undefined,
                        },
                      },
                    });
                    setSaveOpen(false);
                    setSaveName("");
                    toastMutationSuccess("Saved — view in Collections");
                  }}
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/environments">Environments</Link>
          </Button>
        </div>
      </header>

      <OperationRunner
        key={`${operationId ?? itemId ?? "adhoc"}-${initialQuery}`}
        initialQuery={initialQuery}
        initialVariables={collectionItem?.variablesJson ?? "{}"}
        environments={environments}
        environmentId={envId}
        onEnvironmentChange={handleEnvChange}
        loading={executing}
        result={result}
        executionMeta={meta}
        emptyEnvironmentHref="/app/environments"
        resizable
        query={activeQuery}
        onQueryChange={setQuery}
        variables={variables}
        onVariablesChange={setVariables}
        queryEditor={
          <MonacoEditor
            height="320px"
            language="graphql"
            theme={
              typeof document !== "undefined" && document.documentElement.classList.contains("dark")
                ? "vs-dark"
                : "light"
            }
            value={activeQuery}
            onChange={(v) => setQuery(v ?? "")}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "var(--font-mono)",
              padding: { top: 12 },
            }}
          />
        }
        onExecute={async ({ environmentId, query: q, variables: vars, headers }) => {
          const { data: execData } = await execute({
            variables: {
              input: {
                environmentId,
                adhocQuery: q,
                variables: JSON.parse(vars || "{}"),
                headers,
                operationId: provenanceOperationId ?? undefined,
              },
            },
          });
          setResult(execData?.executeOperation?.responseBody ?? "");
          setMeta({
            status: execData?.executeOperation?.execution?.status,
            durationMs: execData?.executeOperation?.execution?.durationMs,
            httpStatus: execData?.executeOperation?.execution?.httpStatus,
          });
        }}
      />
    </div>
  );
}

