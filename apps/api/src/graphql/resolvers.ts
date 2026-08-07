import { GraphQLJSON } from "graphql-scalars";
import { resolvers as aiResolvers } from "./resolvers/ai.js";
import { resolvers as catalogResolvers } from "./resolvers/catalog.js";
import { resolvers as discoveryResolvers } from "./resolvers/discovery.js";
import { resolvers as executionResolvers } from "./resolvers/execution.js";
import { resolvers as jobsResolvers } from "./resolvers/jobs.js";
import { resolvers as searchResolvers } from "./resolvers/search.js";
import { resolvers as workspaceResolvers } from "./resolvers/workspace.js";
import { resolvers as analyticsResolvers } from "./resolvers/analytics.js";
import { resolvers as compositionResolvers } from "./resolvers/composition.js";

export const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    ...workspaceResolvers.Query,
    ...catalogResolvers.Query,
    ...discoveryResolvers.Query,
    ...searchResolvers.Query,
    ...executionResolvers.Query,
    ...jobsResolvers.Query,
    ...aiResolvers.Query,
    ...analyticsResolvers.Query,
    ...compositionResolvers.Query,
  },
  Mutation: {
    ...workspaceResolvers.Mutation,
    ...catalogResolvers.Mutation,
    ...discoveryResolvers.Mutation,
    ...searchResolvers.Mutation,
    ...executionResolvers.Mutation,
    ...aiResolvers.Mutation,
    ...jobsResolvers.Mutation,
  },
  SchemaVersion: catalogResolvers.SchemaVersion,
  Collection: executionResolvers.Collection,
};
