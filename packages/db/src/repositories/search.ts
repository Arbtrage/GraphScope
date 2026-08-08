import type { Knex } from "knex";
import type { SearchResult, SearchResultKind } from "@graphscope/shared-types";

export type { SearchResult, SearchResultKind };

export interface SearchDocumentInput {
  kind: SearchResultKind;
  entityId: string;
  title: string;
  subtitle?: string | null;
  href: string;
  searchText: string;
}

export class SearchRepository {
  constructor(private readonly db: Knex) {}

  async clearWorkspace(workspaceId: string): Promise<void> {
    await this.db("core_search_document").where({ workspace_id: workspaceId }).del();
  }

  async upsertDocument(workspaceId: string, doc: SearchDocumentInput): Promise<void> {
    await this.db("core_search_document")
      .insert({
        workspace_id: workspaceId,
        kind: doc.kind,
        entity_id: doc.entityId,
        title: doc.title,
        subtitle: doc.subtitle ?? null,
        href: doc.href,
        search_text: doc.searchText,
        updated_at: this.db.fn.now(),
      })
      .onConflict(["workspace_id", "kind", "entity_id"])
      .merge({
        title: doc.title,
        subtitle: doc.subtitle ?? null,
        href: doc.href,
        search_text: doc.searchText,
        updated_at: this.db.fn.now(),
      });
  }

  async search(
    workspaceId: string,
    query: string,
    kinds?: SearchResultKind[],
    limit = 25,
  ): Promise<SearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    let qb = this.db("core_search_document")
      .where("workspace_id", workspaceId)
      .whereRaw("search_vector @@ plainto_tsquery('english', ?)", [trimmed])
      .orderByRaw("ts_rank(search_vector, plainto_tsquery('english', ?)) DESC", [trimmed])
      .limit(limit);

    if (kinds?.length) qb = qb.whereIn("kind", kinds);

    const rows = await qb.select(
      "*",
      this.db.raw("ts_rank(search_vector, plainto_tsquery('english', ?)) as rank", [trimmed]),
    );
    return rows.map((row) => ({
      kind: row.kind as SearchResultKind,
      id: String(row.entity_id),
      title: row.title as string,
      subtitle: (row.subtitle as string | null) ?? null,
      href: row.href as string,
      score: Number(row.rank ?? 1),
    }));
  }

  async setCheckpoint(workspaceId: string, status: string, documentCount: number): Promise<void> {
    await this.db("core_search_checkpoint")
      .insert({
        workspace_id: workspaceId,
        status,
        document_count: documentCount,
        completed_at: status === "completed" ? this.db.fn.now() : null,
        updated_at: this.db.fn.now(),
      })
      .onConflict(["workspace_id"])
      .merge({
        status,
        document_count: documentCount,
        completed_at: status === "completed" ? this.db.fn.now() : null,
        updated_at: this.db.fn.now(),
      });
  }

  async countDocuments(workspaceId: string): Promise<number> {
    const row = await this.db("core_search_document").where({ workspace_id: workspaceId }).count("* as count").first();
    return Number(row?.count ?? 0);
  }
}
