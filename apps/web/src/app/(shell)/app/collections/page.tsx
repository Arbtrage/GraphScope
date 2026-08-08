"use client";

import { gql, useQuery } from "@apollo/client";
import {
  Button,
  CollectionTree,
  ErrorState,
  PageHeader,
  PageSkeleton,
} from "@graphscope/ui";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAppRouter } from "@/components/navigation-provider";
import { useGraphMutation } from "@/hooks/use-graph-mutation";

const COLLECTIONS = gql`
  query Collections {
    collections {
      id
      name
      items {
        id
        name
        operationId
        queryContent
      }
    }
  }
`;

const CREATE = gql`
  mutation CreateCollection($name: String!) {
    createCollection(name: $name) {
      id
    }
  }
`;

const RENAME = gql`
  mutation RenameCollection($id: ID!, $name: String!) {
    renameCollection(id: $id, name: $name) {
      id
    }
  }
`;

const DELETE = gql`
  mutation DeleteCollection($id: ID!) {
    deleteCollection(id: $id)
  }
`;

const DELETE_ITEM = gql`
  mutation DeleteCollectionItem($id: ID!) {
    deleteCollectionItem(id: $id)
  }
`;

function CollectionsContent() {
  const router = useAppRouter();
  const { data, loading, error, refetch } = useQuery(COLLECTIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createCollection] = useGraphMutation(CREATE, {
    onCompleted: () => refetch(),
    successMessage: "Collection created",
  });
  const [renameCollection] = useGraphMutation(RENAME, {
    onCompleted: () => refetch(),
    successMessage: "Collection renamed",
  });
  const [deleteCollection] = useGraphMutation(DELETE, {
    onCompleted: () => refetch(),
    successMessage: "Collection deleted",
  });
  const [deleteCollectionItem] = useGraphMutation(DELETE_ITEM, {
    onCompleted: () => refetch(),
    successMessage: "Request removed",
  });

  useEffect(() => {
    const first = data?.collections?.[0]?.id;
    if (first && !selectedId) setSelectedId(first);
  }, [data?.collections, selectedId]);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const collections = data?.collections ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collections"
        description="Saved GraphQL requests (query + variables) for Execute — not your Operations catalog, and not run History."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/app/execute">Open Execute</Link>
          </Button>
        }
      />
      <p className="max-w-2xl text-sm text-muted-foreground">
        Think of each collection as a folder of reusable requests. Save from Execute, then reopen here anytime.
      </p>
      <CollectionTree
        collections={collections}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={async (name) => {
          await createCollection({ variables: { name } });
        }}
        onRename={async (id, name) => {
          await renameCollection({ variables: { id, name } });
        }}
        onDelete={async (id) => {
          await deleteCollection({ variables: { id } });
          if (selectedId === id) setSelectedId(null);
        }}
        onDeleteItem={async (id) => {
          await deleteCollectionItem({ variables: { id } });
        }}
        onOpenItem={(item) => router.push(`/app/execute?itemId=${item.id}`)}
      />
    </div>
  );
}

export default function CollectionsPage() {
  return <CollectionsContent />;
}
