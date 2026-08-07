import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("core_search_document", (t) => {
    t.bigIncrements("search_document_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.text("kind").notNullable();
    t.text("entity_id").notNullable();
    t.text("title").notNullable();
    t.text("subtitle").nullable();
    t.text("href").notNullable();
    t.text("search_text").notNullable();
    t.timestamps(true, true);
    t.unique(["workspace_id", "kind", "entity_id"]);
    t.index(["workspace_id", "kind"]);
  });

  await knex.raw(`
    ALTER TABLE core_search_document
    ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (to_tsvector('english', search_text)) STORED
  `);

  await knex.raw(`
    CREATE INDEX idx_core_search_document_fts ON core_search_document USING GIN (search_vector)
  `);

  await knex.schema.createTable("core_search_checkpoint", (t) => {
    t.bigIncrements("search_checkpoint_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.text("status").notNullable().defaultTo("idle");
    t.integer("document_count").notNullable().defaultTo(0);
    t.timestamp("completed_at", { useTz: true }).nullable();
    t.timestamps(true, true);
    t.unique(["workspace_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("core_search_checkpoint");
  await knex.schema.dropTableIfExists("core_search_document");
}
