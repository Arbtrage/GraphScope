import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("core_repository_link", (t) => {
    t.bigIncrements("repository_link_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.bigInteger("project_id").notNullable().references("project_id").inTable("core_project").onDelete("CASCADE");
    t.text("source_type").notNullable();
    t.text("local_path").nullable();
    t.text("github_repo").nullable();
    t.text("default_branch").notNullable().defaultTo("main");
    t.text("status").notNullable().defaultTo("CONNECTED");
    t.text("last_indexed_sha").nullable();
    t.text("last_error").nullable();
    t.timestamps(true, true);
    t.index(["workspace_id", "project_id"]);
  });

  await knex.schema.createTable("stg_parse_result", (t) => {
    t.bigIncrements("parse_result_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.bigInteger("project_id").notNullable().references("project_id").inTable("core_project").onDelete("CASCADE");
    t.bigInteger("repository_link_id").nullable().references("repository_link_id").inTable("core_repository_link").onDelete("SET NULL");
    t.bigInteger("job_id").nullable().references("job_id").inTable("core_job").onDelete("SET NULL");
    t.text("file_path").notNullable();
    t.text("operation_name").nullable();
    t.text("operation_type").notNullable();
    t.text("content").notNullable();
    t.text("content_hash").notNullable();
    t.float("confidence").notNullable().defaultTo(1);
    t.integer("start_line").notNullable().defaultTo(1);
    t.integer("end_line").notNullable().defaultTo(1);
    t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index(["workspace_id", "project_id"]);
  });

  await knex.schema.createTable("core_operation", (t) => {
    t.bigIncrements("operation_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.bigInteger("project_id").notNullable().references("project_id").inTable("core_project").onDelete("CASCADE");
    t.bigInteger("repository_link_id").nullable().references("repository_link_id").inTable("core_repository_link").onDelete("SET NULL");
    t.text("name").nullable();
    t.text("operation_type").notNullable();
    t.text("content").notNullable();
    t.text("content_hash").notNullable();
    t.float("confidence").notNullable().defaultTo(1);
    t.boolean("is_manual").notNullable().defaultTo(false);
    t.timestamps(true, true);
    t.unique(["project_id", "content_hash"]);
    t.index(["workspace_id", "project_id"]);
  });

  await knex.schema.createTable("core_operation_source", (t) => {
    t.bigIncrements("operation_source_id").primary();
    t.bigInteger("operation_id").notNullable().references("operation_id").inTable("core_operation").onDelete("CASCADE");
    t.text("file_path").notNullable();
    t.integer("start_line").notNullable();
    t.integer("end_line").notNullable();
    t.text("github_url").nullable();
    t.index(["operation_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("core_operation_source");
  await knex.schema.dropTableIfExists("core_operation");
  await knex.schema.dropTableIfExists("stg_parse_result");
  await knex.schema.dropTableIfExists("core_repository_link");
}
