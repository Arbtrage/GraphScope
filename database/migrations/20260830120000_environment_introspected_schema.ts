import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("core_environment", (table) => {
    table.text("introspected_sdl").nullable();
    table.timestamp("introspected_at", { useTz: true }).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("core_environment", (table) => {
    table.dropColumn("introspected_sdl");
    table.dropColumn("introspected_at");
  });
}
