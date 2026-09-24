export const typeDefs = /* GraphQL */ `
  type ExplorerRepositoryInfo {
    id: ID!
    name: String!
    branch: String!
    scannedAtLabel: String!
    localPath: String
    status: String!
    lastError: String
    operationCount: Int!
  }

  type ExplorerRepoStats {
    operations: Int!
    queries: Int!
    mutations: Int!
    subscriptions: Int!
    fragments: Int!
    types: Int!
    endpoints: Int!
    files: Int!
  }

  type ExplorerSourceLocation {
    fileId: ID!
    path: String!
    line: Int!
  }

  type ExplorerOperation {
    id: ID!
    name: String!
    kind: String!
    description: String!
    document: String!
    unused: Boolean!
    lastChanged: String!
    variables: JSON!
    fragmentIds: [ID!]!
    typeIds: [ID!]!
    usageIds: [ID!]!
    endpointId: ID!
    source: ExplorerSourceLocation!
  }

  type ExplorerFragment {
    id: ID!
    name: String!
    document: String!
    typeIds: [ID!]!
    operationIds: [ID!]!
    fileIds: [ID!]!
    duplicateOf: ID
    source: ExplorerSourceLocation!
  }

  type ExplorerType {
    id: ID!
    name: String!
    kind: String!
    sdl: String!
    source: String!
    fieldIds: [ID!]!
    operationIds: [ID!]!
    fragmentIds: [ID!]!
    fileIds: [ID!]!
  }

  type ExplorerField {
    id: ID!
    name: String!
    typeId: ID!
    typeName: String!
    returnType: String!
    deprecated: Boolean
    deprecationReason: String
  }

  type ExplorerFile {
    id: ID!
    path: String!
    kind: String!
    operationIds: [ID!]!
    fragmentIds: [ID!]!
    referenceCount: Int!
  }

  type ExplorerEndpoint {
    id: ID!
    name: String!
    url: String!
    environment: String!
    operationCount: Int!
    schemaDate: String!
    latency: String!
    headers: JSON!
    schemaPulled: Boolean!
    schemaPulledAt: String
  }

  type ExplorerUsage {
    id: ID!
    fileId: ID!
    path: String!
    line: Int!
    kind: String!
  }

  type ExplorerAttention {
    id: ID!
    label: String!
    count: Int!
    severity: String!
  }

  type ExplorerGraphEdge {
    id: ID!
    source: ID!
    target: ID!
    relation: String!
  }

  type ExplorerHistoryEntry {
    id: ID!
    operationId: ID!
    operationName: String!
    kind: String!
    at: String!
    day: String!
  }

  type ExplorerCatalog {
    repository: ExplorerRepositoryInfo!
    stats: ExplorerRepoStats!
    operations: [ExplorerOperation!]!
    fragments: [ExplorerFragment!]!
    types: [ExplorerType!]!
    fields: [ExplorerField!]!
    files: [ExplorerFile!]!
    endpoints: [ExplorerEndpoint!]!
    usages: [ExplorerUsage!]!
    attention: [ExplorerAttention!]!
    recentOperationIds: [ID!]!
    graphEdges: [ExplorerGraphEdge!]!
    surfaceNodeIds: [ID!]!
    history: [ExplorerHistoryEntry!]!
  }

  type ScanStats {
    operations: Int!
    fragments: Int!
    types: Int!
    endpoints: Int!
    files: Int!
  }

  type ScanParseError {
    path: String!
    message: String!
  }

  type ScanStatus {
    jobId: ID!
    status: String!
    step: String
    done: Boolean!
    error: String
    stats: ScanStats
    ignoredCount: Int
    skippedFiles: [String!]
    parseErrors: [ScanParseError!]
  }

  type ExplorerIntrospectPayload {
    ok: Boolean!
    typeCount: Int!
    title: String
    detail: String
  }

  type OpenRepositoryPayload {
    jobId: ID!
    repositoryLinkId: ID!
  }

  type RepositoryTreeEntry {
    path: String!
  }

  type RepositoryFileContent {
    path: String!
    content: String!
    truncated: Boolean!
    byteSize: Int!
    binary: Boolean!
  }
`;
