export const typeDefs = /* GraphQL */ `
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
    onboardingStatus: OnboardingStatus!
    search(q: String!, kinds: [SearchResultKind!], limit: Int): [SearchResult!]!
    environments: [Environment!]!
    environment(id: ID!): Environment
    secrets(environmentId: ID!): [SecretMeta!]!
    executions(limit: Int): [Execution!]!
    collections: [Collection!]!
    collection(id: ID!): Collection
    collectionItem(id: ID!): CollectionItem
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
    bootstrapWorkspace(input: BootstrapWorkspaceInput): BootstrapWorkspacePayload!
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
    deleteCollectionItem(id: ID!): Boolean!
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
