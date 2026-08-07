"use client";

import { gql, useQuery } from "@apollo/client";
import {
  AiSidePanel,
  Breadcrumbs,
  Button,
  ErrorState,
  FindingsList,
  PageHeader,
  PageSkeleton,
  SectionCard,
  SourceMapPanel,
} from "@graphscope/ui";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useAppRouter } from "@/components/navigation-provider";
import { useGraphMutation } from "@/hooks/use-graph-mutation";

const OPERATION = gql`
  query OperationDetail($id: ID!) {
    operation(id: $id) {
      id
      name
      operationType
      content
      confidence
      projectId
      projectName
      locations {
        path
        startLine
        endLine
        githubUrl
      }
    }
    projects {
      id
      name
    }
    aiSettings {
      redactionMode
      enabled
      hasOpenAiKey
    }
  }
`;

const PROJECT_SCHEMAS = gql`
  query ProjectSchemasForOp($projectId: ID!) {
    schemas(projectId: $projectId) {
      id
    }
  }
`;

const SCHEMA_VERSIONS = gql`
  query SchemaVersionsForOp($schemaId: ID!) {
    schemaVersions(schemaId: $schemaId) {
      id
    }
  }
`;

const OPERATION_FINDINGS = gql`
  query OperationFindings($operationId: ID!) {
    operationFindings(operationId: $operationId) {
      id
      ruleId
      severity
      message
      path
    }
  }
`;

const EXPLAIN_OPERATION = gql`
  mutation ExplainOperationDetail($input: ExplainOperationInput!) {
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
  mutation GenerateOperationDetail($input: GenerateOperationInput!) {
    generateOperation(input: $input) {
      document
      warnings
    }
  }
`;

type ExplainData = {
  explainOperation: { markdown: string; citations: Array<{ typeName: string; fieldName?: string | null }> };
};
type GenerateData = {
  generateOperation: { document: string; warnings: string[] };
};

function OperationDetailContent() {
  const params = useParams();
  const router = useAppRouter();
  const id = params.id as string;
  const { data, loading, error, refetch } = useQuery(OPERATION, { variables: { id } });
  const [aiOpen, setAiOpen] = useState(false);
  const [explanation, setExplanation] = useState<{ markdown: string; citations: Array<{ typeName: string; fieldName?: string | null }> }>();
  const [generated, setGenerated] = useState<{ document: string; warnings: string[] }>();
  const [explainOp, { loading: explaining }] = useGraphMutation<ExplainData>(EXPLAIN_OPERATION);
  const [generateOp, { loading: generating }] = useGraphMutation<GenerateData>(GENERATE_OPERATION);

  const projectId = data?.operation?.projectId;
  const { data: schemasData } = useQuery(PROJECT_SCHEMAS, {
    variables: { projectId: projectId ?? "" },
    skip: !projectId,
  });
  const schemaId = schemasData?.schemas?.[0]?.id;
  const { data: versionsData } = useQuery(SCHEMA_VERSIONS, {
    variables: { schemaId: schemaId ?? "" },
    skip: !schemaId,
  });
  const { data: findingsData } = useQuery(OPERATION_FINDINGS, { variables: { operationId: id } });
  const schemaVersionId = versionsData?.schemaVersions?.[0]?.id;

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (!data?.operation) return <ErrorState title="Operation not found" />;

  const op = data.operation;
  const project = data.projects.find((p: { id: string }) => p.id === op.projectId);

  return (
    <div>
      <PageHeader
        title={op.name ?? "Anonymous operation"}
        description={`${op.operationType} · ${Math.round(op.confidence * 100)}% confidence`}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: "Operations", href: "/app/operations" },
              { label: project?.name ?? "Project", href: `/app/projects/${op.projectId}` },
              { label: op.name ?? "Operation" },
            ]}
            renderLink={({ href, children }) => <Link href={href}>{children}</Link>}
          />
        }
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setAiOpen(true)}>
              AI Copilot
            </Button>
            <Button className="bg-execute text-execute-foreground hover:bg-execute/90" onClick={() => router.push(`/app/execute?operationId=${op.id}`)}>
              Run
            </Button>
          </div>
        }
      />

      <AiSidePanel
        open={aiOpen}
        onOpenChange={setAiOpen}
        operationId={op.id}
        operationContent={op.content}
        projectId={op.projectId}
        schemaVersionId={schemaVersionId}
        settings={data.aiSettings}
        loading={explaining || generating}
        explanation={explanation}
        generated={generated}
        onExplain={async () => {
          const { data: explainData } = await explainOp({
            variables: {
              input: {
                operationId: op.id,
                projectId: op.projectId,
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
        onApplyGenerated={(doc) => router.push(`/app/execute?operationId=${op.id}`)}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Query">
          <pre className="max-h-96 overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">{op.content}</pre>
        </SectionCard>
        <SectionCard title="Source locations">
          <SourceMapPanel locations={op.locations} />
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard title="Analytics findings">
          <FindingsList findings={findingsData?.operationFindings ?? []} />
        </SectionCard>
      </div>
    </div>
  );
}

export default function OperationDetailPage() {
  return <OperationDetailContent />;
}
