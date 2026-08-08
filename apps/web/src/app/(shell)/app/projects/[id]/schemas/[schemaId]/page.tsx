"use client";

import { gql, useQuery } from "@apollo/client";
import {
  Breadcrumbs,
  Button,
  ErrorState,
  PageHeader,
  PageSkeleton,
  SchemaDiffViewer,
  SchemaVersionTable,
  SectionCard,
} from "@graphscope/ui";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGraphMutation } from "@/hooks/use-graph-mutation";

const SCHEMA = gql`
  query SchemaDetail($schemaId: ID!, $projectId: ID!) {
    project(id: $projectId) {
      id
      name
    }
    schema(id: $schemaId) {
      id
      name
    }
    schemaVersions(schemaId: $schemaId) {
      id
      contentHash
      createdAt
      sdl
      checks {
        status
        result
      }
    }
  }
`;

const RUN_CHECK = gql`
  mutation RunCheck($schemaVersionId: ID!, $previousVersionId: ID) {
    runSchemaCheck(schemaVersionId: $schemaVersionId, previousVersionId: $previousVersionId) {
      id
      status
    }
  }
`;

function SchemaDetail() {
  const params = useParams();
  const schemaId = params.schemaId as string;
  const projectId = params.id as string;
  const { data, loading, error, refetch } = useQuery(SCHEMA, { variables: { schemaId, projectId } });
  const [runCheck, { loading: checking }] = useGraphMutation(RUN_CHECK, {
    onCompleted: () => refetch(),
    successMessage: "Schema check started",
  });

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const versions = data?.schemaVersions ?? [];
  const latest = versions[0];
  const previous = versions[1];

  return (
    <div>
      <PageHeader
        title={data?.schema?.name ?? "Schema versions"}
        description="Version history and breaking-change checks."
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: "Projects", href: "/app/projects" },
              { label: data?.project?.name ?? "Project", href: `/app/projects/${projectId}` },
              { label: data?.schema?.name ?? "Schema" },
            ]}
            renderLink={({ href, children }) => <Link href={href}>{children}</Link>}
          />
        }
      />

      <SectionCard title="Versions" className="mb-6">
        <SchemaVersionTable versions={versions} />
      </SectionCard>

      {latest && previous && (
        <SectionCard
          title="Diff"
          description="Compare latest version against previous."
          action={
            <Button disabled={checking} onClick={() => runCheck({ variables: { schemaVersionId: latest.id, previousVersionId: previous.id } })}>
              {checking ? "Running check…" : "Run breaking-change check"}
            </Button>
          }
        >
          <SchemaDiffViewer oldSdl={previous.sdl} newSdl={latest.sdl} />
        </SectionCard>
      )}
    </div>
  );
}

export default function SchemaPage() {
  return <SchemaDetail />;
}
