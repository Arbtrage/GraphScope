export const typeDefs = /* GraphQL */ `
type Project {
    id: ID!
    workspaceId: ID!
    name: String!
    slug: String!
  }

  input CreateProjectInput {
    name: String!
    slug: String!
  }

  input UpdateProjectInput {
    name: String
    slug: String
  }

  type Schema {
    id: ID!
    workspaceId: ID!
    projectId: ID!
    name: String!
  }

  type SchemaVersion {
    id: ID!
    schemaId: ID!
    workspaceId: ID!
    contentHash: String!
    sdl: String!
    gitSha: String
    createdAt: String!
    checks: [SchemaCheck!]!
  }

  type SchemaCheck {
    id: ID!
    schemaVersionId: ID!
    status: SchemaCheckStatus!
    result: SchemaCheckResult
    breakingCount: Int!
    dangerousCount: Int!
  }

  enum SchemaCheckStatus {
    PENDING
    RUNNING
    PASSED
    FAILED
    ERROR
  }

  enum SchemaCheckResult {
    BREAKING
    DANGEROUS
    SAFE
  }

  input PublishSchemaInput {
    projectId: ID!
    name: String!
    sdl: String!
    gitSha: String
  }
`;
