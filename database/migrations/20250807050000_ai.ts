import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("core_ai_settings", (t) => {
    t.bigIncrements("ai_settings_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.text("redaction_mode").notNullable().defaultTo("STANDARD");
    t.boolean("enabled").notNullable().defaultTo(true);
    t.integer("monthly_token_budget").notNullable().defaultTo(100_000);
    t.integer("tokens_used").notNullable().defaultTo(0);
    t.timestamp("tokens_reset_at", { useTz: true }).nullable();
    t.timestamps(true, true);
    t.unique(["workspace_id"]);
  });

  await knex.schema.createTable("core_ai_invocation", (t) => {
    t.bigIncrements("ai_invocation_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.bigInteger("user_id").notNullable().references("user_id").inTable("core_user").onDelete("CASCADE");
    t.text("kind").notNullable();
    t.text("redaction_mode").notNullable();
    t.bigInteger("schema_version_id").nullable().references("schema_version_id").inTable("core_schema_version").onDelete("SET NULL");
    t.bigInteger("operation_id").nullable();
    t.integer("prompt_tokens").notNullable().defaultTo(0);
    t.integer("completion_tokens").notNullable().defaultTo(0);
    t.integer("total_tokens").notNullable().defaultTo(0);
    t.text("status").notNullable().defaultTo("SUCCESS");
    t.text("error_message").nullable();
    t.jsonb("metadata").notNullable().defaultTo("{}");
    t.timestamps(true, true);
    t.index(["workspace_id", "created_at"]);
    t.index(["user_id", "created_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("core_ai_invocation");
  await knex.schema.dropTableIfExists("core_ai_settings");
}
