import type { Repositories } from "@graphscope/db";
import { readSdlFile } from "../../services/schema-publish.js";
import { compareSchemas, validateSdl } from "../../services/schema-check.js";

export async function runSchemaCheckTask(
  repos: Repositories,
  payload: { checkId: string; schemaVersionId: string; workspaceId: string; previousVersionId?: string },
): Promise<void> {
  await repos.schemas.updateCheck(payload.checkId, { status: "RUNNING" });
  try {
    const version = await repos.schemas.findVersionById(payload.schemaVersionId, payload.workspaceId);
    if (!version) {
      await repos.schemas.updateCheck(payload.checkId, { status: "ERROR", result: null });
      return;
    }
    const newSdl = await readSdlFile(version.sdlPath);
    validateSdl(newSdl);

    if (!payload.previousVersionId) {
      await repos.schemas.updateCheck(payload.checkId, {
        status: "PASSED",
        result: "SAFE",
        breakingCount: 0,
        dangerousCount: 0,
        resultJson: { message: "First version" },
      });
      return;
    }

    const prev = await repos.schemas.findVersionById(payload.previousVersionId, payload.workspaceId);
    if (!prev) {
      await repos.schemas.updateCheck(payload.checkId, { status: "ERROR", result: null });
      return;
    }
    const oldSdl = await readSdlFile(prev.sdlPath);
    const comparison = await compareSchemas(oldSdl, newSdl);
    await repos.schemas.updateCheck(payload.checkId, {
      status: comparison.breakingCount > 0 ? "FAILED" : "PASSED",
      result: comparison.result,
      breakingCount: comparison.breakingCount,
      dangerousCount: comparison.dangerousCount,
      resultJson: { changes: comparison.changes },
    });
  } catch (err) {
    await repos.schemas.updateCheck(payload.checkId, {
      status: "ERROR",
      result: null,
      resultJson: { error: err instanceof Error ? err.message : String(err) },
    });
  }
}
