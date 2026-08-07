import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("core_job", (t) => {
    t.integer("attempts").notNullable().defaultTo(0);
    t.text("last_error").nullable();
    t.timestamp("locked_at", { useTz: true }).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("core_job", (t) => {
    t.dropColumn("attempts");
    t.dropColumn("last_error");
    t.dropColumn("locked_at");
  });
}
