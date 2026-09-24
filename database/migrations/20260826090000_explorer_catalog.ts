import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("core_operation", (t) => {
    t.boolean("unused").notNullable().defaultTo(false);
    t.jsonb("variables_json").notNullable().defaultTo("{}");
    t.text("description").nullable();
  });

  await knex.schema.createTable("core_fragment", (t) => {
    t.bigIncrements("fragment_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.bigInteger("project_id").notNullable().references("project_id").inTable("core_project").onDelete("CASCADE");
    t.bigInteger("repository_link_id").nullable().references("repository_link_id").inTable("core_repository_link").onDelete("SET NULL");
    t.text("name").notNullable();
    t.text("content").notNullable();
    t.text("content_hash").notNullable();
    t.text("file_path").notNullable();
    t.integer("start_line").notNullable().defaultTo(1);
    t.integer("end_line").notNullable().defaultTo(1);
    t.text("type_condition").nullable();
    t.text("duplicate_of").nullable();
    t.timestamps(true, true);
    t.index(["workspace_id", "project_id"]);
    t.index(["workspace_id", "name"]);
  });

  await knex.schema.createTable("core_fragment_usage", (t) => {
    t.bigIncrements("fragment_usage_id").primary();
    t.bigInteger("fragment_id").notNullable().references("fragment_id").inTable("core_fragment").onDelete("CASCADE");
    t.bigInteger("operation_id").notNullable().references("operation_id").inTable("core_operation").onDelete("CASCADE");
    t.unique(["fragment_id", "operation_id"]);
  });

  await knex.schema.createTable("core_graphql_type", (t) => {
    t.bigIncrements("type_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.bigInteger("project_id").notNullable().references("project_id").inTable("core_project").onDelete("CASCADE");
    t.text("name").notNullable();
    t.text("kind").notNullable().defaultTo("OBJECT");
    t.text("sdl").notNullable().defaultTo("");
    t.timestamps(true, true);
    t.unique(["project_id", "name"]);
    t.index(["workspace_id"]);
  });

  await knex.schema.createTable("core_graphql_field", (t) => {
    t.bigIncrements("field_id").primary();
    t.bigInteger("type_id").notNullable().references("type_id").inTable("core_graphql_type").onDelete("CASCADE");
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.text("name").notNullable();
    t.text("return_type").notNullable().defaultTo("String");
    t.boolean("deprecated").notNullable().defaultTo(false);
    t.text("deprecation_reason").nullable();
    t.unique(["type_id", "name"]);
  });

  await knex.schema.createTable("core_source_file", (t) => {
    t.bigIncrements("file_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.bigInteger("project_id").notNullable().references("project_id").inTable("core_project").onDelete("CASCADE");
    t.text("path").notNullable();
    t.text("kind").notNullable().defaultTo("ts");
    t.integer("reference_count").notNullable().defaultTo(0);
    t.timestamps(true, true);
    t.unique(["project_id", "path"]);
  });

  await knex.schema.createTable("core_file_operation", (t) => {
    t.bigIncrements("id").primary();
    t.bigInteger("file_id").notNullable().references("file_id").inTable("core_source_file").onDelete("CASCADE");
    t.bigInteger("operation_id").notNullable().references("operation_id").inTable("core_operation").onDelete("CASCADE");
    t.unique(["file_id", "operation_id"]);
  });

  await knex.schema.createTable("core_file_fragment", (t) => {
    t.bigIncrements("id").primary();
    t.bigInteger("file_id").notNullable().references("file_id").inTable("core_source_file").onDelete("CASCADE");
    t.bigInteger("fragment_id").notNullable().references("fragment_id").inTable("core_fragment").onDelete("CASCADE");
    t.unique(["file_id", "fragment_id"]);
  });

  await knex.schema.createTable("core_usage", (t) => {
    t.bigIncrements("usage_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.bigInteger("operation_id").notNullable().references("operation_id").inTable("core_operation").onDelete("CASCADE");
    t.bigInteger("file_id").nullable().references("file_id").inTable("core_source_file").onDelete("SET NULL");
    t.text("file_path").notNullable();
    t.integer("line").notNullable().defaultTo(1);
    t.text("kind").notNullable().defaultTo("component");
    t.index(["workspace_id", "operation_id"]);
  });

  await knex.schema.createTable("core_graph_edge", (t) => {
    t.bigIncrements("edge_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.bigInteger("project_id").notNullable().references("project_id").inTable("core_project").onDelete("CASCADE");
    t.text("source_id").notNullable();
    t.text("target_id").notNullable();
    t.text("relation").notNullable();
    t.index(["workspace_id", "project_id"]);
  });

  await knex.schema.createTable("core_detected_client", (t) => {
    t.bigIncrements("client_id").primary();
    t.bigInteger("workspace_id").notNullable().references("workspace_id").inTable("core_workspace").onDelete("CASCADE");
    t.bigInteger("project_id").notNullable().references("project_id").inTable("core_project").onDelete("CASCADE");
    t.text("name").notNullable();
    t.unique(["project_id", "name"]);
  });

  await knex.schema.alterTable("core_repository_link", (t) => {
    t.text("display_name").nullable();
    t.text("branch_name").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("core_repository_link", (t) => {
    t.dropColumn("display_name");
    t.dropColumn("branch_name");
  });
  await knex.schema.dropTableIfExists("core_detected_client");
  await knex.schema.dropTableIfExists("core_graph_edge");
  await knex.schema.dropTableIfExists("core_usage");
  await knex.schema.dropTableIfExists("core_file_fragment");
  await knex.schema.dropTableIfExists("core_file_operation");
  await knex.schema.dropTableIfExists("core_source_file");
  await knex.schema.dropTableIfExists("core_graphql_field");
  await knex.schema.dropTableIfExists("core_graphql_type");
  await knex.schema.dropTableIfExists("core_fragment_usage");
  await knex.schema.dropTableIfExists("core_fragment");
  await knex.schema.alterTable("core_operation", (t) => {
    t.dropColumn("unused");
    t.dropColumn("variables_json");
    t.dropColumn("description");
  });
}
