import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("core_source_file", (t) => {
    t.bigInteger("mtime_ms").nullable();
    t.bigInteger("size_bytes").nullable();
    t.text("content_hash").nullable();
    t.timestamp("indexed_at", { useTz: true }).nullable();
  });

  await knex.schema.alterTable("core_repository_link", (t) => {
    t.bigInteger("catalog_revision").notNullable().defaultTo(0);
  });

  await knex.schema.createTable("core_symbol_ref", (t) => {
    t.bigIncrements("symbol_ref_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.bigInteger("project_id").notNullable().references("project_id").inTable("core_project").onDelete("CASCADE");
    t.text("symbol").notNullable();
    t.text("file_path").notNullable();
    t.integer("line").notNullable().defaultTo(1);
    t.text("kind").notNullable().defaultTo("component");
    t.timestamps(true, true);
    t.index(["project_id", "symbol"]);
    t.index(["project_id", "file_path"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("core_symbol_ref");
  await knex.schema.alterTable("core_repository_link", (t) => {
    t.dropColumn("catalog_revision");
  });
  await knex.schema.alterTable("core_source_file", (t) => {
    t.dropColumn("mtime_ms");
    t.dropColumn("size_bytes");
    t.dropColumn("content_hash");
    t.dropColumn("indexed_at");
  });
}
