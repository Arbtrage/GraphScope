"use client";

import { gql, useQuery } from "@apollo/client";
import { CollectionTree, ErrorState, PageHeader, PageSkeleton, SectionCard } from "@graphscope/ui";
import { useState } from "react";
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

function CollectionsContent() {
  const { data, loading, error, refetch } = useQuery(COLLECTIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createCollection] = useGraphMutation(CREATE, { onCompleted: () => refetch(), successMessage: "Collection created" });
  const [renameCollection] = useGraphMutation(RENAME, { onCompleted: () => refetch(), successMessage: "Collection renamed" });
  const [deleteCollection] = useGraphMutation(DELETE, { onCompleted: () => refetch(), successMessage: "Collection deleted" });

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader title="Collections" description="Save and organize queries for quick access." />
      <SectionCard title="Your collections">
        <CollectionTree
          collections={data?.collections ?? []}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onCreate={(name) => createCollection({ variables: { name } })}
          onRename={(id, name) => {
            const newName = window.prompt("New name", name);
            if (newName) renameCollection({ variables: { id, name: newName } });
          }}
          onDelete={(id) => deleteCollection({ variables: { id } })}
        />
      </SectionCard>
    </div>
  );
}

export default function CollectionsPage() {
  return <CollectionsContent />;
}
