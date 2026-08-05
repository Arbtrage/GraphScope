import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw("CREATE EXTENSION IF NOT EXISTS pgcrypto");

  await knex.schema.createTable("core_workspace", (t) => {
    t.bigIncrements("workspace_id").primary();
    t.text("name").notNullable();
    t.text("slug").notNullable().unique();
    t.timestamps(true, true);
  });

  await knex.schema.createTable("core_project", (t) => {
    t.bigIncrements("project_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.text("name").notNullable();
    t.text("slug").notNullable();
    t.timestamps(true, true);
    t.unique(["workspace_id", "slug"]);
    t.index(["workspace_id"]);
  });

  await knex.schema.createTable("core_job", (t) => {
    t.bigIncrements("job_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.text("job_type").notNullable();
    t.text("status").notNullable().defaultTo("pending");
    t.jsonb("payload").notNullable().defaultTo("{}");
    t.timestamps(true, true);
    t.index(["workspace_id", "status"]);
  });

  await knex.schema.createTable("audit_event", (t) => {
    t.bigIncrements("event_id").primary();
    t.bigInteger("workspace_id").nullable().references("workspace_id").inTable("core_workspace").onDelete("SET NULL");
    t.text("action").notNullable();
    t.bigInteger("actor_id").nullable();
    t.jsonb("metadata").notNullable().defaultTo("{}");
    t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index(["workspace_id", "created_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("audit_event");
  await knex.schema.dropTableIfExists("core_job");
  await knex.schema.dropTableIfExists("core_project");
  await knex.schema.dropTableIfExists("core_workspace");
}
