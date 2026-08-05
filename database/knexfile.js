"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const node_url_1 = require("node:url");
const __dirname = node_path_1.default.dirname((0, node_url_1.fileURLToPath)(import.meta.url));
function baseConnection(options = {}) {
    return {
        client: "pg",
        connection: {
            host: options.host ?? process.env.GRAPHSCOPE_DB_HOST ?? "127.0.0.1",
            port: options.port ?? Number(process.env.GRAPHSCOPE_DB_PORT ?? 5432),
            user: options.user ?? process.env.GRAPHSCOPE_DB_USER ?? "graphscope",
            password: options.password ?? process.env.GRAPHSCOPE_DB_PASSWORD ?? "graphscope",
            database: options.database ?? process.env.GRAPHSCOPE_DB_NAME ?? "graphscope",
        },
        migrations: {
            directory: node_path_1.default.join(__dirname, "migrations"),
            extension: "ts",
        },
        pool: { min: 1, max: 10 },
    };
}
const config = {
    embedded: baseConnection(),
    development: baseConnection(),
    test: baseConnection({
        database: process.env.GRAPHSCOPE_DB_NAME ?? "graphscope_test",
    }),
};
exports.default = config;
//# sourceMappingURL=knexfile.js.map