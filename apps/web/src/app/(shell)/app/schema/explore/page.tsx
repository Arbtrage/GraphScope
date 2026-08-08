"use client";

import { gql, useQuery } from "@apollo/client";
import {
  ErrorState,
  PageHeader,
  PageSkeleton,
  SchemaVoyager,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@graphscope/ui";
import Link from "next/link";
import { useMemo, useState } from "react";

const PROJECTS = gql`
  query ProjectsForVoyager {
    projects {
      id
      name
    }
  }
`;

const SCHEMAS = gql`
  query SchemasForVoyager($projectId: ID!) {
    schemas(projectId: $projectId) {
      id
      name
    }
  }
`;

const VERSIONS = gql`
  query SchemaVersionsForVoyager($schemaId: ID!) {
    schemaVersions(schemaId: $schemaId) {
      id
      sdl
      createdAt
    }
  }
`;

export default function SchemaExplorePage() {
  const { data: projectsData, loading: projectsLoading, error: projectsError, refetch } = useQuery(PROJECTS);
  const [projectId, setProjectId] = useState<string>("");
  const [schemaId, setSchemaId] = useState<string>("");
  const [versionId, setVersionId] = useState<string>("");

  const { data: schemasData, loading: schemasLoading } = useQuery(SCHEMAS, {
    variables: { projectId },
    skip: !projectId,
  });

  const { data: versionsData, loading: versionsLoading } = useQuery(VERSIONS, {
    variables: { schemaId },
    skip: !schemaId,
  });

  const projects = projectsData?.projects ?? [];
  const schemas = schemasData?.schemas ?? [];
  const versions = versionsData?.schemaVersions ?? [];

  const activeProjectId = projectId || projects[0]?.id || "";
  const activeSchemaId = schemaId || schemas[0]?.id || "";
  const activeVersionId = versionId || versions[0]?.id || "";

  const selectedVersion = useMemo(
    () => versions.find((v: { id: string }) => v.id === activeVersionId),
    [versions, activeVersionId],
  );

  if (projectsLoading) return <PageSkeleton />;
  if (projectsError) return <ErrorState message={projectsError.message} onRetry={() => refetch()} />;

  return (
    <div className="flex h-full min-h-0 flex-col p-6 lg:px-8">
      <PageHeader
        title="Schema explorer"
        description="Browse published schema graphs. Pick a project, schema, and version."
      />

      {!projects.length ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No projects yet. Create a project and publish a schema first.
          </p>
          <Link
            href="/app/projects"
            className="mt-4 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Open projects
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Select
              value={activeProjectId}
              onValueChange={(id) => {
                setProjectId(id);
                setSchemaId("");
                setVersionId("");
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p: { id: string; name: string }) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={activeSchemaId}
              onValueChange={(id) => {
                setSchemaId(id);
                setVersionId("");
              }}
              disabled={schemasLoading || !schemas.length}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={schemasLoading ? "Loading…" : "Schema"} />
              </SelectTrigger>
              <SelectContent>
                {schemas.map((s: { id: string; name: string }) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={activeVersionId}
              onValueChange={setVersionId}
              disabled={versionsLoading || !versions.length}
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder={versionsLoading ? "Loading…" : "Version"} />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v: { id: string; createdAt: string }) => (
                  <SelectItem key={v.id} value={v.id}>
                    {new Date(v.createdAt).toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedVersion?.sdl ? (
            <SchemaVoyager sdl={selectedVersion.sdl} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No published schema versions for this selection. Publish a schema from a{" "}
              <Link href={`/app/projects/${activeProjectId}`} className="text-primary underline-offset-4 hover:underline">
                project page
              </Link>
              .
            </p>
          )}
        </>
      )}
    </div>
  );
}
