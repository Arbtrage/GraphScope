"use client";

import { gql, useQuery } from "@apollo/client";
import {
  Badge,
  Button,
  EmptyState,
  EnvironmentForm,
  ErrorState,
  HeadersEditor,
  PageHeader,
  PageSkeleton,
  SecretForm,
  SectionCard,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@graphscope/ui";
import { useState } from "react";
import { useGraphMutation } from "@/hooks/use-graph-mutation";

const ENVS = gql`
  query Environments {
    environments {
      id
      name
      endpointUrl
      isProduction
      headers
    }
  }
`;

const SECRETS = gql`
  query Secrets($environmentId: ID!) {
    secrets(environmentId: $environmentId) {
      id
      name
      lastFour
      updatedAt
    }
  }
`;

const CREATE_ENV = gql`
  mutation CreateEnv($input: CreateEnvironmentInput!) {
    createEnvironment(input: $input) {
      id
    }
  }
`;

const UPDATE_ENV = gql`
  mutation UpdateEnv($id: ID!, $input: UpdateEnvironmentInput!) {
    updateEnvironment(id: $id, input: $input) {
      id
    }
  }
`;

const UPSERT_SECRET = gql`
  mutation UpsertSecret($input: UpsertSecretInput!) {
    upsertSecret(input: $input) {
      id
    }
  }
`;

const TEST_CONNECTION = gql`
  mutation TestConnection($input: ExecuteOperationInput!) {
    executeOperation(input: $input) {
      execution {
        status
      }
    }
  }
`;

function EnvironmentsContent() {
  const { data, loading, error, refetch } = useQuery(ENVS);
  const [createEnv] = useGraphMutation(CREATE_ENV, { onCompleted: () => refetch(), successMessage: "Environment created" });
  const [updateEnv] = useGraphMutation(UPDATE_ENV, { onCompleted: () => refetch(), successMessage: "Environment updated" });
  const [upsertSecret] = useGraphMutation(UPSERT_SECRET, { successMessage: "Secret saved" });
  const [testConnection] = useGraphMutation(TEST_CONNECTION);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const editing = data?.environments?.find((e: { id: string }) => e.id === editingId);
  const { data: secretsData, refetch: refetchSecrets } = useQuery(SECRETS, {
    variables: { environmentId: editingId ?? "" },
    skip: !editingId,
  });

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const headerRows = editing?.headers
    ? Object.entries(editing.headers as Record<string, string>).map(([key, value]) => ({ key, value }))
    : [{ key: "", value: "" }];

  return (
    <div>
      <PageHeader
        title="Environments"
        description="Configure GraphQL endpoints, headers, and secrets."
        action={
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button onClick={() => { setEditingId(null); }}>New environment</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{editing ? "Edit environment" : "New environment"}</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <EnvironmentForm
                  initial={editing ? { name: editing.name, endpointUrl: editing.endpointUrl, isProduction: editing.isProduction } : undefined}
                  onSubmit={(input) => {
                    if (editing) {
                      updateEnv({ variables: { id: editing.id, input } });
                    } else {
                      createEnv({ variables: { input } });
                    }
                    setSheetOpen(false);
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        }
      />

      {(data?.environments ?? []).length === 0 ? (
        <EmptyState title="No environments" description="Create an environment to run GraphQL queries against an endpoint." actionLabel="New environment" onAction={() => setSheetOpen(true)} />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.environments.map((env: { id: string; name: string; endpointUrl: string; isProduction: boolean }) => (
                <TableRow key={env.id}>
                  <TableCell className="font-medium">{env.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{env.endpointUrl}</TableCell>
                  <TableCell>{env.isProduction ? <Badge variant="warning">Production</Badge> : <Badge variant="secondary">Dev</Badge>}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        testConnection({
                          variables: { input: { environmentId: env.id, adhocQuery: "query { __typename }", variables: {} } },
                        })
                      }
                    >
                      Test
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingId(env.id);
                        setSheetOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {editing && (
        <div className="mt-6 space-y-6">
          <SectionCard title="Headers">
            <HeadersEditor
              headers={headerRows}
              onChange={(rows) => {
                const headers = Object.fromEntries(rows.filter((r) => r.key).map((r) => [r.key, r.value]));
                updateEnv({ variables: { id: editing.id, input: { headers } } });
              }}
            />
          </SectionCard>
          <SectionCard title="Secrets">
            <SecretForm onSubmit={(input) => upsertSecret({ variables: { input: { ...input, environmentId: editing.id } } }).then(() => refetchSecrets())} />
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
              {(secretsData?.secrets ?? []).map((s: { id: string; name: string; lastFour: string }) => (
                <li key={s.id}>{s.name} ••••{s.lastFour}</li>
              ))}
            </ul>
          </SectionCard>
        </div>
      )}
    </div>
  );
}

export default function EnvironmentsPage() {
  return <EnvironmentsContent />;
}
