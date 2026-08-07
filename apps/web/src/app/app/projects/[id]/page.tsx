"use client";

import { gql, useQuery } from "@apollo/client";
import {
  Breadcrumbs,
  Button,
  CompositionBadge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EnableRepoForm,
  ErrorState,
  OperationTable,
  PageHeader,
  PageSkeleton,
  PublishDialog,
  RepoList,
  SectionCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@graphscope/ui";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAppRouter } from "@/components/navigation-provider";
import { useGraphMutation } from "@/hooks/use-graph-mutation";

const PROJECT = gql`
  query ProjectDetail($id: ID!) {
    project(id: $id) {
      id
      name
      slug
    }
    schemas(projectId: $id) {
      id
      name
    }
    repositoryLinks(projectId: $id) {
      id
      sourceType
      localPath
      githubRepo
      status
    }
    operations(projectId: $id) {
      id
      name
      operationType
      confidence
    }
  }
`;

const COMPOSITION = gql`
  query ProjectComposition($projectId: ID!) {
    workspaceComposition(projectId: $projectId) {
      ok
      errors
      schemaCount
    }
  }
`;

const PUBLISH = gql`
  mutation PublishSchema($input: PublishSchemaInput!) {
    publishSchema(input: $input) {
      id
    }
  }
`;

const ENABLE_REPO = gql`
  mutation EnableRepo($input: EnableRepositoryInput!) {
    enableRepository(input: $input) {
      id
    }
  }
`;

const REINDEX = gql`
  mutation Reindex($id: ID!) {
    reindexRepository(id: $id) {
      id
    }
  }
`;

function ProjectDetail() {
  const params = useParams();
  const router = useAppRouter();
  const id = params.id as string;
  const { data, loading, error, refetch } = useQuery(PROJECT, { variables: { id } });
  const { data: compositionData } = useQuery(COMPOSITION, { variables: { projectId: id } });
  const [publishSchema, { loading: publishing }] = useGraphMutation(PUBLISH, { onCompleted: () => refetch(), successMessage: "Schema published" });
  const [enableRepo] = useGraphMutation(ENABLE_REPO, { onCompleted: () => refetch(), successMessage: "Repository connected" });
  const [reindex] = useGraphMutation(REINDEX, { onCompleted: () => refetch(), successMessage: "Reindex started" });

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (!data?.project) return <ErrorState title="Project not found" message="This project may have been deleted." />;

  const schemas = data.schemas ?? [];

  return (
    <div>
      <PageHeader
        title={data.project.name}
        description={data.project.slug}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: "Projects", href: "/app/projects" },
              { label: data.project.name },
            ]}
            renderLink={({ href, children }) => <Link href={href}>{children}</Link>}
          />
        }
        action={
          <Button className="bg-execute text-execute-foreground hover:bg-execute/90" onClick={() => router.push("/app/execute")}>
            Run query
          </Button>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="repository">Repository</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SectionCard title="Project overview">
            <div className="mb-4">
              <CompositionBadge
                ok={compositionData?.workspaceComposition?.ok ?? true}
                errors={compositionData?.workspaceComposition?.errors ?? []}
                schemaCount={compositionData?.workspaceComposition?.schemaCount ?? schemas.length}
              />
            </div>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-muted-foreground">Schemas</dt>
                <dd className="text-2xl font-semibold">{schemas.length}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Repositories</dt>
                <dd className="text-2xl font-semibold">{data.repositoryLinks.length}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Operations</dt>
                <dd className="text-2xl font-semibold">{data.operations.length}</dd>
              </div>
            </dl>
          </SectionCard>
        </TabsContent>

        <TabsContent value="repository" className="space-y-4">
          <SectionCard title="Connected repositories">
            <RepoList repos={data.repositoryLinks} onReindex={(repoId) => reindex({ variables: { id: repoId } })} />
          </SectionCard>
          <SectionCard title="Connect repository">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Connect repository</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect repository</DialogTitle>
                </DialogHeader>
                <EnableRepoForm
                  onEnable={(input) =>
                    enableRepo({ variables: { input: { projectId: id, ...input } } })
                  }
                />
              </DialogContent>
            </Dialog>
          </SectionCard>
        </TabsContent>

        <TabsContent value="schema" className="space-y-4">
          <SectionCard title="Schema versions" action={<PublishDialog loading={publishing} onPublish={async ({ name, sdl }) => { await publishSchema({ variables: { input: { projectId: id, name, sdl } } }); }} />}>
            {schemas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No schemas yet. Publish SDL to get started.</p>
            ) : (
              <ul className="space-y-2">
                {schemas.map((schema: { id: string; name: string }) => (
                  <li key={schema.id}>
                    <Link href={`/app/projects/${id}/schemas/${schema.id}`} className="text-primary hover:underline">
                      {schema.name} → view versions
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="operations">
          <SectionCard title="Discovered operations">
            <OperationTable
              operations={data.operations}
              onRun={(opId) => router.push(`/app/execute?operationId=${opId}`)}
              onView={(opId) => router.push(`/app/operations/${opId}`)}
            />
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ProjectDetailPage() {
  return <ProjectDetail />;
}
