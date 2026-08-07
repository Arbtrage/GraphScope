import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("core_secret_meta", (t) => {
    t.bigIncrements("secret_meta_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.bigInteger("environment_id").notNullable().references("environment_id").inTable("core_environment").onDelete("CASCADE");
    t.text("name").notNullable();
    t.text("last_four").notNullable();
    t.timestamps(true, true);
    t.unique(["environment_id", "name"]);
    t.index(["workspace_id"]);
  });

  await knex.schema.createTable("core_collection", (t) => {
    t.bigIncrements("collection_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.text("name").notNullable();
    t.timestamps(true, true);
    t.unique(["workspace_id", "name"]);
    t.index(["workspace_id"]);
  });

  await knex.schema.createTable("core_collection_item", (t) => {
    t.bigIncrements("collection_item_id").primary();
    t.bigInteger("collection_id").notNullable().references("collection_id").inTable("core_collection").onDelete("CASCADE");
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.text("name").notNullable();
    t.text("query_content").notNullable();
    t.text("variables_json").notNullable().defaultTo("{}");
    t.bigInteger("operation_id").nullable().references("operation_id").inTable("core_operation").onDelete("SET NULL");
    t.timestamps(true, true);
    t.index(["workspace_id", "collection_id"]);
  });

  await knex.schema.createTable("core_execution", (t) => {
    t.bigIncrements("execution_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.bigInteger("operation_id").nullable().references("operation_id").inTable("core_operation").onDelete("SET NULL");
    t.bigInteger("environment_id").nullable().references("environment_id").inTable("core_environment").onDelete("SET NULL");
    t.text("query_content").notNullable();
    t.text("variables_json").notNullable().defaultTo("{}");
    t.text("status").notNullable();
    t.integer("http_status").nullable();
    t.integer("duration_ms").notNullable();
    t.integer("response_bytes").nullable();
    t.integer("graphql_errors_count").notNullable().defaultTo(0);
    t.text("response_preview").nullable();
    t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index(["workspace_id", "created_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("core_execution");
  await knex.schema.dropTableIfExists("core_collection_item");
  await knex.schema.dropTableIfExists("core_collection");
  await knex.schema.dropTableIfExists("core_secret_meta");
}
