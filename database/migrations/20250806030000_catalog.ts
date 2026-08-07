import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("core_schema", (t) => {
    t.bigIncrements("schema_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.bigInteger("project_id").notNullable().references("project_id").inTable("core_project").onDelete("CASCADE");
    t.text("name").notNullable();
    t.timestamps(true, true);
    t.unique(["project_id", "name"]);
    t.index(["workspace_id"]);
  });

  await knex.schema.createTable("core_schema_version", (t) => {
    t.bigIncrements("schema_version_id").primary();
    t.bigInteger("schema_id").notNullable().references("schema_id").inTable("core_schema").onDelete("CASCADE");
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.text("content_hash").notNullable();
    t.text("sdl_path").notNullable();
    t.text("git_sha").nullable();
    t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(["schema_id", "content_hash"]);
    t.index(["workspace_id", "schema_id"]);
  });

  await knex.schema.createTable("core_schema_check", (t) => {
    t.bigIncrements("schema_check_id").primary();
    t.bigInteger("schema_version_id").notNullable().references("schema_version_id").inTable("core_schema_version").onDelete("CASCADE");
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.text("status").notNullable().defaultTo("PENDING");
    t.text("result").nullable();
    t.integer("breaking_count").notNullable().defaultTo(0);
    t.integer("dangerous_count").notNullable().defaultTo(0);
    t.jsonb("result_json").notNullable().defaultTo("{}");
    t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index(["workspace_id", "schema_version_id"]);
  });

  await knex.schema.createTable("core_environment", (t) => {
    t.bigIncrements("environment_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.text("name").notNullable();
    t.text("endpoint_url").nullable();
    t.jsonb("headers_json").notNullable().defaultTo("{}");
    t.boolean("is_production").notNullable().defaultTo(false);
    t.timestamps(true, true);
    t.unique(["workspace_id", "name"]);
    t.index(["workspace_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("core_environment");
  await knex.schema.dropTableIfExists("core_schema_check");
  await knex.schema.dropTableIfExists("core_schema_version");
  await knex.schema.dropTableIfExists("core_schema");
}
