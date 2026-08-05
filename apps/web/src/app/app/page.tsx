"use client";

import { ApolloProvider, gql, useMutation, useQuery } from "@apollo/client";
import { AppShell, Button, Skeleton, WorkspaceSwitcher } from "@graphscope/ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apolloClient, getSessionToken, setSessionToken } from "@/lib/apollo";

const HEALTH_QUERY = gql`
  query Health {
    health {
      ok
      version
    }
  }
`;

const ME_QUERY = gql`
  query Me {
    me {
      id
      githubLogin
      name
    }
    workspaces {
      id
      name
      slug
    }
  }
`;

const SWITCH_WORKSPACE = gql`
  mutation SwitchWorkspace($id: ID!) {
    switchWorkspace(id: $id) {
      id
      name
      slug
    }
  }
`;

const CREATE_WORKSPACE = gql`
  mutation CreateWorkspace($input: CreateWorkspaceInput!) {
    createWorkspace(input: $input) {
      id
      name
      slug
    }
  }
`;

const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

function AppContent() {
  const router = useRouter();
  const { data, loading, refetch } = useQuery(ME_QUERY);
  const { data: healthData } = useQuery(HEALTH_QUERY);
  const [switchWorkspace] = useMutation(SWITCH_WORKSPACE, { onCompleted: () => refetch() });
  const [createWorkspace] = useMutation(CREATE_WORKSPACE, { onCompleted: () => refetch() });
  const [logout] = useMutation(LOGOUT);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !data?.me) {
      router.replace("/login");
    }
  }, [loading, data, router]);

  useEffect(() => {
    if (data?.workspaces?.length && !activeWorkspaceId) {
      setActiveWorkspaceId(data.workspaces[0].id);
    }
  }, [data, activeWorkspaceId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!data?.me) return null;

  return (
    <AppShell
      workspaceSwitcher={
        <WorkspaceSwitcher
          workspaces={data.workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onSwitch={async (id) => {
            await switchWorkspace({ variables: { id } });
            setActiveWorkspaceId(id);
          }}
          onCreate={async (input) => {
            const result = await createWorkspace({ variables: { input } });
            const ws = result.data?.createWorkspace;
            if (ws) setActiveWorkspaceId(ws.id);
          }}
        />
      }
      topBarActions={
        <>
          <span className="text-sm text-muted-foreground">{data.me.githubLogin ?? data.me.name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await logout();
              setSessionToken(null);
              router.replace("/login");
            }}
          >
            Log out
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Welcome, {data.me.name ?? data.me.githubLogin}</h1>
        <p className="text-muted-foreground">
          API health: {healthData?.health?.ok ? `ok (v${healthData.health.version})` : "checking…"}
        </p>
        <p className="text-muted-foreground">
          {data.workspaces.length} workspace{data.workspaces.length === 1 ? "" : "s"} available.
        </p>
      </div>
    </AppShell>
  );
}

export default function AppPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getSessionToken()) setReady(true);
    else setReady(true);
  }, []);

  if (!ready) return null;

  if (!getSessionToken()) {
    return <RedirectToLogin />;
  }

  return (
    <ApolloProvider client={apolloClient}>
      <AppContent />
    </ApolloProvider>
  );
}

function RedirectToLogin() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return null;
}
