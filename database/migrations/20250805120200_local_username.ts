import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("core_user", (t) => {
    t.text("local_username").nullable().unique();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("core_user", (t) => {
    t.dropColumn("local_username");
  });
}
