#!/usr/bin/env tsx
/**
 * Writes the API GraphQL SDL for web codegen consumption.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { typeDefs } from "../apps/api/src/graphql/schema/index.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "../apps/web/src/graphql/schema.graphql");

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${typeDefs.trim()}\n`, "utf8");
console.log(`Wrote ${outPath}`);
