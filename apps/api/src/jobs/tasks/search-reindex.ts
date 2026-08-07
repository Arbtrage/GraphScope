import type { Repositories, SearchDocumentInput } from "@graphscope/db";
import { readSdlFile } from "../../services/schema-publish.js";

function extractTypesAndFields(sdl: string): Array<{ kind: "TYPE" | "FIELD"; name: string; typeName?: string }> {
  const results: Array<{ kind: "TYPE" | "FIELD"; name: string; typeName?: string }> = [];
  const typeRegex = /(?:type|interface|input|enum)\s+(\w+)/g;
  let match: RegExpExecArray | null;
  while ((match = typeRegex.exec(sdl)) !== null) {
    const name = match[1];
    if (!name) continue;
    results.push({ kind: "TYPE", name });
  }
  let currentType = "Query";
  for (const line of sdl.split("\n")) {
    const typeMatch = line.match(/^(?:type|interface|input)\s+(\w+)/);
    if (typeMatch?.[1]) {
      currentType = typeMatch[1];
      continue;
    }
    const fieldMatch = line.match(/^\s+(\w+)\s*[:(!]/);
    const fieldName = fieldMatch?.[1];
    if (fieldName && !["Query", "Mutation", "Subscription"].includes(fieldName)) {
      results.push({ kind: "FIELD", name: fieldName, typeName: currentType });
    }
  }
  return results;
}

export async function buildSearchDocuments(repos: Repositories, workspaceId: string): Promise<SearchDocumentInput[]> {
  const docs: SearchDocumentInput[] = [];

  const projects = await repos.projects.listForWorkspace(workspaceId);
  for (const p of projects) {
    docs.push({
      kind: "PROJECT",
      entityId: p.id,
      title: p.name,
      subtitle: p.slug,
      href: `/app/projects/${p.id}`,
      searchText: `${p.name} ${p.slug} project`,
    });

    const ops = await repos.operations.listForProject(p.id, workspaceId, 500);
    for (const op of ops) {
      const paths = op.locations.map((l) => l.path).join(" ");
      docs.push({
        kind: "OPERATION",
        entityId: op.id,
        title: op.name ?? "Anonymous operation",
        subtitle: `${op.operationType} · ${p.name}`,
        href: `/app/operations/${op.id}`,
        searchText: `${op.name ?? ""} ${op.operationType} ${op.content} ${paths} ${p.name}`,
      });
    }

    const links = await repos.repositoryLinks.listForProject(p.id, workspaceId);
    for (const link of links) {
      const label = link.githubRepo ?? link.localPath ?? link.sourceType;
      docs.push({
        kind: "REPOSITORY",
        entityId: link.id,
        title: label,
        subtitle: p.name,
        href: `/app/projects/${p.id}`,
        searchText: `${label} repository ${p.name} ${link.status}`,
      });
    }

    const schemas = await repos.schemas.listForProject(p.id, workspaceId);
    for (const schema of schemas) {
      const versions = await repos.schemas.listVersions(schema.id, workspaceId);
      const latest = versions[0];
      if (!latest) continue;
      const versionRow = await repos.schemas.findVersionById(latest.id, workspaceId);
      if (!versionRow) continue;
      let sdl = "";
      try {
        sdl = await readSdlFile(versionRow.sdlPath);
      } catch {
        continue;
      }
      for (const entity of extractTypesAndFields(sdl)) {
        if (entity.kind === "TYPE") {
          docs.push({
            kind: "TYPE",
            entityId: `${schema.id}:${entity.name}`,
            title: entity.name,
            subtitle: `${schema.name} · ${p.name}`,
            href: `/app/projects/${p.id}/schemas/${schema.id}`,
            searchText: `${entity.name} type schema ${schema.name} ${p.name}`,
          });
        } else if (entity.typeName) {
          docs.push({
            kind: "FIELD",
            entityId: `${schema.id}:${entity.typeName}.${entity.name}`,
            title: `${entity.typeName}.${entity.name}`,
            subtitle: schema.name,
            href: `/app/projects/${p.id}/schemas/${schema.id}`,
            searchText: `${entity.name} ${entity.typeName} field schema ${schema.name}`,
          });
        }
      }
    }
  }

  const collections = await repos.collections.listForWorkspace(workspaceId);
  for (const c of collections) {
    docs.push({
      kind: "COLLECTION",
      entityId: c.id,
      title: c.name,
      subtitle: "Collection",
      href: "/app/collections",
      searchText: `${c.name} collection`,
    });
    const items = await repos.collections.listItems(c.id, workspaceId);
    for (const item of items) {
      docs.push({
        kind: "OPERATION",
        entityId: item.operationId ?? item.id,
        title: item.name,
        subtitle: `Collection: ${c.name}`,
        href: item.operationId ? `/app/execute?operationId=${item.operationId}` : "/app/collections",
        searchText: `${item.name} ${item.queryContent} collection ${c.name}`,
      });
    }
  }

  return docs;
}

export async function runSearchReindexTask(
  repos: Repositories,
  payload: { workspaceId: string },
): Promise<number> {
  const { workspaceId } = payload;
  await repos.search.setCheckpoint(workspaceId, "running", 0);
  await repos.search.clearWorkspace(workspaceId);
  const documents = await buildSearchDocuments(repos, workspaceId);
  for (const doc of documents) {
    await repos.search.upsertDocument(workspaceId, doc);
  }
  await repos.search.setCheckpoint(workspaceId, "completed", documents.length);
  return documents.length;
}
