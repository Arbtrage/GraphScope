import type { Knex } from "knex";
export interface KnexConfigOptions {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
}
declare const config: Record<string, Knex.Config>;
export default config;
//# sourceMappingURL=knexfile.d.ts.map