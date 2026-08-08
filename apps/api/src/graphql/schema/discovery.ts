export const typeDefs = /* GraphQL */ `
type RepositoryLink {
    id: ID!
    projectId: ID!
    workspaceId: ID!
    sourceType: RepoSourceType!
    localPath: String
    githubRepo: String
    defaultBranch: String!
    status: RepoSyncStatus!
    lastIndexedSha: String
    lastError: String
  }

  enum RepoSourceType {
    LOCAL
    GITHUB
  }

  enum RepoSyncStatus {
    CONNECTED
    SYNCING
    INDEXED
    ERROR
    DISABLED
  }

  type OperationSourceLocation {
    path: String!
    startLine: Int!
    endLine: Int!
    githubUrl: String
  }

  type OperationDocument {
    id: ID!
    projectId: ID!
    workspaceId: ID!
    projectName: String
    name: String
    operationType: OperationType!
    contentHash: String!
    content: String!
    confidence: Float!
    isManual: Boolean!
    locations: [OperationSourceLocation!]!
  }

  enum OperationType {
    QUERY
    MUTATION
    SUBSCRIPTION
  }

  input EnableRepositoryInput {
    projectId: ID!
    sourceType: RepoSourceType!
    localPath: String
    githubRepo: String
    defaultBranch: String
  }


  input OperationsFilter {
    projectId: ID
    operationType: OperationType
    search: String
  }
`;
