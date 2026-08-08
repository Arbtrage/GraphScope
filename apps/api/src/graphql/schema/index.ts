import { typeDefs as workspace } from "./workspace.js";
import { typeDefs as catalog } from "./catalog.js";
import { typeDefs as discovery } from "./discovery.js";
import { typeDefs as execution } from "./execution.js";
import { typeDefs as search } from "./search.js";
import { typeDefs as jobs } from "./jobs.js";
import { typeDefs as composition } from "./composition.js";
import { typeDefs as ai } from "./ai.js";
import { typeDefs as analytics } from "./analytics.js";
import { typeDefs as root } from "./root.js";

export const typeDefs = [
  workspace,
  catalog,
  discovery,
  execution,
  search,
  jobs,
  composition,
  ai,
  analytics,
  root,
].join("\n\n");
