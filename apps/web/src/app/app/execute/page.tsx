"use client";

import dynamic from "next/dynamic";
import { gql, useQuery } from "@apollo/client";
import { AiSidePanel, ErrorState, OperationRunner, PageHeader, PageSkeleton, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@graphscope/ui";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { getActiveEnvironmentId } from "@/components/app-layout";
import { useGraphMutation } from "@/hooks/use-graph-mutation";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false, loading: () => <div className="h-[280px] animate-pulse rounded-md bg-muted" /> });

const ENVIRONMENTS = gql`
  query EnvironmentsForExecute {
    environments {
      id
      name
    }
  }
`;

const OPERATION = gql`
  query OperationForRun($id: ID!) {
    operation(id: $id) {
      id
      name
      content
      projectId
    }
    environments {
      id
      name
    }
  }
`;

const EXECUTE = gql`
  mutation Execute($input: ExecuteOperationInput!) {
    executeOperation(input: $input) {
      responseBody
      execution {
        id
        status
        durationMs
        httpStatus
      }
    }
  }
`;

const COLLECTIONS = gql`
  query CollectionsForSave {
    collections {
      id
      name
    }
  }
`;

const SAVE_TO_COLLECTION = gql`
  mutation SaveToCollection($input: SaveToCollectionInput!) {
    saveToCollection(input: $input) {
      id
      name
    }
  }
`;

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

function ExecuteContent() {
  const searchParams = useSearchParams();
  const operationId = searchParams.get("operationId");
  const { data, loading, error, refetch } = useQuery(operationId ? OPERATION : ENVIRONMENTS, {
    variables: operationId ? { id: operationId } : undefined,
  });
  const [execute, { loading: executing }] = useGraphMutation<ExecuteData>(EXECUTE);
  const [saveToCollection] = useGraphMutation(SAVE_TO_COLLECTION, { successMessage: "Saved to collection" });
  const { data: collectionsData } = useQuery(COLLECTIONS);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveCollectionId, setSaveCollectionId] = useState("");
  const [result, setResult] = useState<string | undefined>();
  const [meta, setMeta] = useState<{ status?: string; durationMs?: number; httpStatus?: number | null }>();
  const [query, setQuery] = useState<string | undefined>();
  const [aiOpen, setAiOpen] = useState(false);
  const [explanation, setExplanation] = useState<{ markdown: string; citations: Array<{ typeName: string; fieldName?: string | null }> }>();
  const [generated, setGenerated] = useState<{ document: string; warnings: string[] }>();

  const projectId = data?.operation?.projectId;
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

  const initialQuery = useMemo(() => data?.operation?.content ?? "query { __typename }", [data]);
  const activeQuery = query ?? initialQuery;

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const defaultEnvId = getActiveEnvironmentId() ?? data?.environments?.[0]?.id;

  return (
    <div>
      <PageHeader
        title={data?.operation?.name ?? "Execute"}
        description={operationId ? "Running a saved operation." : "Ad-hoc GraphQL runner."}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setAiOpen(true)}>
              AI Copilot
            </Button>
            <AiSidePanel
              open={aiOpen}
              onOpenChange={setAiOpen}
              operationId={operationId ?? undefined}
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
                      operationId: operationId ?? undefined,
                      operationContent: operationId ? undefined : activeQuery,
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
              <Button variant="outline" size="sm">Save to collection</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save to collection</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Item name" value={saveName} onChange={(e) => setSaveName(e.target.value)} />
                <Select value={saveCollectionId} onValueChange={setSaveCollectionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {(collectionsData?.collections ?? []).map((c: { id: string; name: string }) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  disabled={!saveName || !saveCollectionId}
                  onClick={async () => {
                    await saveToCollection({
                      variables: {
                        input: {
                          collectionId: saveCollectionId,
                          name: saveName,
                          queryContent: activeQuery,
                          variablesJson: "{}",
                          operationId: operationId ?? undefined,
                        },
                      },
                    });
                    setSaveOpen(false);
                  }}
                >
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        }
      />
      <OperationRunner
        key={`${operationId ?? "adhoc"}-${initialQuery}`}
        initialQuery={initialQuery}
        environments={data?.environments ?? []}
        loading={executing}
        result={result}
        executionMeta={meta}
        emptyEnvironmentHref="/app/environments"
        resizable
        query={activeQuery}
        onQueryChange={setQuery}
        queryEditor={
          <MonacoEditor
            height="280px"
            language="graphql"
            theme="vs-dark"
            value={activeQuery}
            onChange={(v) => setQuery(v ?? "")}
            options={{ minimap: { enabled: false }, fontSize: 13, fontFamily: "var(--font-mono)" }}
          />
        }
        onExecute={async ({ environmentId, query: q, variables }) => {
          const envId = environmentId || defaultEnvId;
          if (!envId) return;
          const { data: execData } = await execute({
            variables: {
              input: {
                environmentId: envId,
                adhocQuery: q,
                variables: JSON.parse(variables || "{}"),
                operationId: operationId ?? undefined,
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

export default function ExecutePage() {
  return <ExecuteContent />;
}
