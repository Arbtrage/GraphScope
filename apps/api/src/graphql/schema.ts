export const typeDefs = `#graphql
  type Health {
    ok: Boolean!
    version: String!
  }

  type User {
    id: ID!
    githubLogin: String
    name: String
  }

  type Workspace {
    id: ID!
    name: String!
    slug: String!
  }

  type DeviceFlowPayload {
    deviceCode: String!
    userCode: String!
    verificationUri: String!
    expiresIn: Int!
    interval: Int!
  }

  type AuthPayload {
    sessionToken: String!
    user: User!
    activeWorkspace: Workspace
  }

  input CreateWorkspaceInput {
    name: String!
    slug: String!
  }

  input LocalSignInInput {
    displayName: String!
  }

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
  }

  input SaveToCollectionInput {
    collectionId: ID!
    name: String!
    queryContent: String!
    variablesJson: String
    operationId: ID
  }

  input OperationsFilter {
    projectId: ID
    operationType: OperationType
    search: String
  }

  type WorkspaceStats {
    projectCount: Int!
    operationCount: Int!
    environmentCount: Int!
    lastExecutionAt: String
  }

  enum SearchResultKind {
    OPERATION
    TYPE
    FIELD
    REPOSITORY
    COLLECTION
    PROJECT
  }

  type SearchResult {
    kind: SearchResultKind!
    id: ID!
    title: String!
    subtitle: String
    href: String!
    score: Float!
  }

  type ReindexSearchPayload {
    ok: Boolean!
    documentCount: Int!
  }

  enum JobStatus {
    PENDING
    RUNNING
    COMPLETED
    FAILED
  }

  type Job {
    id: ID!
    workspaceId: ID!
    jobType: String!
    status: JobStatus!
    payload: JSON!
    createdAt: String!
    updatedAt: String!
    attempts: Int!
    lastError: String
    lockedAt: String
  }

  type CacheStatus {
    enabled: Boolean!
    connected: Boolean!
  }

  type CompositionStatus {
    ok: Boolean!
    errors: [String!]!
    schemaCount: Int!
    mergedSdl: String
  }

  enum AiRedactionMode {
    STRICT
    STANDARD
    FULL
  }

  type SchemaCitation {
    typeName: String!
    fieldName: String
  }

  type AiExplanation {
    markdown: String!
    citations: [SchemaCitation!]!
  }

  type AiGeneratedOperation {
    document: String!
    warnings: [String!]!
  }

  type AiSettings {
    id: ID!
    workspaceId: ID!
    redactionMode: AiRedactionMode!
    enabled: Boolean!
    monthlyTokenBudget: Int!
    tokensUsed: Int!
    hasOpenAiKey: Boolean!
  }

  input ExplainOperationInput {
    operationId: ID
    operationContent: String
    schemaVersionId: ID
    projectId: ID
  }

  input GenerateOperationInput {
    prompt: String!
    schemaVersionId: ID!
    operationType: OperationType
  }

  input UpdateAiSettingsInput {
    redactionMode: AiRedactionMode
    enabled: Boolean
    monthlyTokenBudget: Int
  }

  enum FindingSeverity {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  type OperationFinding {
    id: ID!
    ruleId: String!
    severity: FindingSeverity!
    message: String!
    path: String
  }

  type WorkspaceDashboard {
    operationCount: Int!
    openHighFindings: Int!
    checksFailed7d: Int!
    execP50Ms: Float
    execP95Ms: Float
  }

  type Query {
    health: Health!
    me: User
    activeWorkspace: Workspace
    workspaces: [Workspace!]!
    workspace(id: ID!): Workspace
    projects: [Project!]!
    project(id: ID!): Project
    schemas(projectId: ID!): [Schema!]!
    schema(id: ID!): Schema
    schemaVersions(schemaId: ID!): [SchemaVersion!]!
    repositoryLinks(projectId: ID!): [RepositoryLink!]!
    operations(projectId: ID!, limit: Int): [OperationDocument!]!
    operationsForWorkspace(filter: OperationsFilter, limit: Int): [OperationDocument!]!
    operation(id: ID!): OperationDocument
    workspaceStats: WorkspaceStats!
    search(q: String!, kinds: [SearchResultKind!], limit: Int): [SearchResult!]!
    environments: [Environment!]!
    environment(id: ID!): Environment
    secrets(environmentId: ID!): [SecretMeta!]!
    executions(limit: Int): [Execution!]!
    collections: [Collection!]!
    collection(id: ID!): Collection
    jobs(limit: Int): [Job!]!
    aiSettings: AiSettings
    operationFindings(operationId: ID!): [OperationFinding!]!
    workspaceDashboard(workspaceId: ID!): WorkspaceDashboard!
    cacheStatus: CacheStatus!
    workspaceComposition(projectId: ID!): CompositionStatus!
  }

  type Mutation {
    createWorkspace(input: CreateWorkspaceInput!): Workspace!
    switchWorkspace(id: ID!): Workspace!
    githubDeviceFlowStart: DeviceFlowPayload!
    githubDeviceFlowPoll(deviceCode: String!): AuthPayload
    signInLocal(input: LocalSignInInput!): AuthPayload!
    saveGithubPat(token: String!): Boolean!
    logout: Boolean!

    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    deleteProject(id: ID!): Boolean!
    publishSchema(input: PublishSchemaInput!): SchemaVersion!
    runSchemaCheck(schemaVersionId: ID!, previousVersionId: ID): SchemaCheck!

    enableRepository(input: EnableRepositoryInput!): RepositoryLink!
    reindexRepository(id: ID!): RepositoryLink!
    disableRepository(id: ID!): RepositoryLink!
    setOperationManualFlag(id: ID!, isOperation: Boolean!): OperationDocument!

    createEnvironment(input: CreateEnvironmentInput!): Environment!
    updateEnvironment(id: ID!, input: UpdateEnvironmentInput!): Environment!
    deleteEnvironment(id: ID!): Boolean!
    upsertSecret(input: UpsertSecretInput!): SecretMeta!
    deleteSecret(id: ID!): Boolean!
    executeOperation(input: ExecuteOperationInput!): ExecutionPayload!

    createCollection(name: String!): Collection!
    renameCollection(id: ID!, name: String!): Collection!
    deleteCollection(id: ID!): Boolean!
    saveToCollection(input: SaveToCollectionInput!): CollectionItem!
    reindexSearch: ReindexSearchPayload!

    explainOperation(input: ExplainOperationInput!): AiExplanation!
    generateOperation(input: GenerateOperationInput!): AiGeneratedOperation!
    updateAiSettings(input: UpdateAiSettingsInput!): AiSettings!
    saveOpenAiKey(apiKey: String!): AiSettings!
    retryJob(id: ID!): Job!
    saveNotifyWebhook(url: String!): Boolean!
  }
`;
