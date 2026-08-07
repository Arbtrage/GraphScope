import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("core_operation", (t) => {
    t.integer("depth").nullable();
    t.integer("complexity").nullable();
  });

  await knex.schema.createTable("core_operation_finding", (t) => {
    t.bigIncrements("operation_finding_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.bigInteger("operation_id").notNullable().references("operation_id").inTable("core_operation").onDelete("CASCADE");
    t.text("rule_id").notNullable();
    t.text("severity").notNullable();
    t.text("message").notNullable();
    t.text("path").nullable();
    t.timestamps(true, true);
    t.index(["workspace_id", "operation_id"]);
    t.index(["workspace_id", "severity"]);
    t.unique(["operation_id", "rule_id", "path"]);
  });

  await knex.schema.createTable("mart_workspace_daily", (t) => {
    t.bigIncrements("mart_workspace_daily_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.date("day").notNullable();
    t.integer("operation_count").notNullable().defaultTo(0);
    t.integer("open_high_findings").notNullable().defaultTo(0);
    t.integer("checks_failed_7d").notNullable().defaultTo(0);
    t.float("exec_p50_ms").nullable();
    t.float("exec_p95_ms").nullable();
    t.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(["workspace_id", "day"]);
    t.index(["workspace_id", "day"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("mart_workspace_daily");
  await knex.schema.dropTableIfExists("core_operation_finding");
  await knex.schema.alterTable("core_operation", (t) => {
    t.dropColumn("depth");
    t.dropColumn("complexity");
  });
}
