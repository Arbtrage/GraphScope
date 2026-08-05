import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("core_user", (t) => {
    t.bigIncrements("user_id").primary();
    t.text("github_login").nullable().unique();
    t.text("name").nullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable("core_membership", (t) => {
    t.bigIncrements("membership_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.bigInteger("user_id").notNullable().references("user_id").inTable("core_user").onDelete("CASCADE");
    t.text("role").notNullable().defaultTo("OWNER");
    t.timestamps(true, true);
    t.unique(["workspace_id", "user_id"]);
    t.index(["workspace_id"]);
    t.index(["user_id"]);
  });

  await knex.schema.createTable("core_session", (t) => {
    t.bigIncrements("session_id").primary();
    t.text("token_hash").notNullable().unique();
    t.bigInteger("user_id").notNullable().references("user_id").inTable("core_user").onDelete("CASCADE");
    t.bigInteger("active_workspace_id").nullable().references("workspace_id").inTable("core_workspace").onDelete("SET NULL");
    t.timestamp("expires_at", { useTz: true }).notNullable();
    t.timestamps(true, true);
    t.index(["user_id"]);
    t.index(["token_hash"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("core_session");
  await knex.schema.dropTableIfExists("core_membership");
  await knex.schema.dropTableIfExists("core_user");
}
