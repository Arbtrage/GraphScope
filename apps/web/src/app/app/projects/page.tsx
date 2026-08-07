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

function ProjectsContent() {
  const router = useAppRouter();
  const { data, loading, error, refetch } = useQuery(PROJECTS);
  const [createProject] = useGraphMutation(CREATE_PROJECT, {
    onCompleted: () => refetch(),
    successMessage: "Project created",
  });

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Organize schemas, repositories, and operations."
        action={
          <Button asChild variant="outline">
            <Link href="/app/operations">Browse operations</Link>
          </Button>
        }
      />
      <ProjectList
        projects={data?.projects ?? []}
        onCreate={(input) => createProject({ variables: { input } })}
        onRowClick={(id) => router.push(`/app/projects/${id}`)}
      />
    </div>
  );
}

export default function ProjectsPage() {
  return <ProjectsContent />;
}
