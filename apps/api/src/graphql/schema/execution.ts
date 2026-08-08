export const typeDefs = /* GraphQL */ `
type Environment {
    id: ID!
    workspaceId: ID!
    name: String!
    endpointUrl: String!
    isProduction: Boolean!
    headers: JSON!
  }

  scalar JSON

  type SecretMeta {
    id: ID!
    environmentId: ID!
    name: String!
    lastFour: String!
    updatedAt: String!
  }

  type Execution {
    id: ID!
    workspaceId: ID!
    status: ExecutionStatus!
    httpStatus: Int
    durationMs: Int!
    responseBytes: Int
    graphqlErrorsCount: Int!
    createdAt: String!
    operationId: ID
    environmentId: ID
    responsePreview: String
  }

  enum ExecutionStatus {
    SUCCESS
    GRAPHQL_ERROR
    TRANSPORT_ERROR
    BLOCKED
    TIMEOUT
  }

  type ExecutionPayload {
    execution: Execution!
    responseBody: String!
  }

  type Collection {
    id: ID!
    workspaceId: ID!
    name: String!
    items: [CollectionItem!]!
  }

  type CollectionItem {
    id: ID!
    collectionId: ID!
    workspaceId: ID!
    name: String!
    queryContent: String!
    variablesJson: String!
    operationId: ID
  }

  input CreateEnvironmentInput {
    name: String!
    endpointUrl: String!
    isProduction: Boolean
    headers: JSON
  }

  input UpdateEnvironmentInput {
    name: String
    endpointUrl: String
    isProduction: Boolean
    headers: JSON
  }

  input UpsertSecretInput {
    environmentId: ID!
    name: String!
    value: String!
  }

  input ExecuteOperationInput {
    environmentId: ID!
    operationId: ID
    adhocQuery: String
    variables: JSON
    """Temporary request headers merged on top of environment headers (request wins)."""
    headers: JSON
  }

  input SaveToCollectionInput {
    collectionId: ID!
    name: String!
    queryContent: String!
    variablesJson: String
    operationId: ID
  }
`;
