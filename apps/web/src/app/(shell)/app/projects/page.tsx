"use client";

import { gql, useQuery } from "@apollo/client";
import { Button, ErrorState, PageHeader, PageSkeleton, ProjectList } from "@graphscope/ui";
import Link from "next/link";
import { useAppRouter } from "@/components/navigation-provider";
import { useGraphMutation } from "@/hooks/use-graph-mutation";

const PROJECTS = gql`
  query Projects {
    projects {
      id
      name
      slug
    }
  }
`;

const CREATE_PROJECT = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
    }
  }
`;

type CreateProjectData = { createProject: { id: string } };

function ProjectsContent() {
  const router = useAppRouter();
  const { data, loading, error, refetch } = useQuery(PROJECTS);
  const [createProject] = useGraphMutation<CreateProjectData>(CREATE_PROJECT, {
    successMessage: "Project created",
  });

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Schemas, repositories, and discovered operations."
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/operations">Browse operations</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/app/execute">Run query</Link>
            </Button>
          </div>
        }
      />
      <ProjectList
        projects={data?.projects ?? []}
        onCreate={async (input) => {
          const result = await createProject({ variables: { input } });
          const id = result.data?.createProject?.id;
          await refetch();
          if (id) router.push(`/app/projects/${id}`);
        }}
        onRowClick={(id) => router.push(`/app/projects/${id}`)}
      />
    </div>
  );
}

export default function ProjectsPage() {
  return <ProjectsContent />;
}
