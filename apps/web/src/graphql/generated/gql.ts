/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query AnalyticsDashboard($workspaceId: ID!) {\n    activeWorkspace {\n      id\n      name\n    }\n    workspaceDashboard(workspaceId: $workspaceId) {\n      operationCount\n      openHighFindings\n      checksFailed7d\n      execP50Ms\n      execP95Ms\n    }\n    operationsForWorkspace(limit: 10) {\n      id\n      name\n      operationType\n      projectName\n    }\n  }\n": typeof types.AnalyticsDashboardDocument,
    "\n    query ActiveWorkspace {\n      activeWorkspace {\n        id\n        name\n      }\n    }\n  ": typeof types.ActiveWorkspaceDocument,
    "\n  query Collections {\n    collections {\n      id\n      name\n      items {\n        id\n        name\n        operationId\n        queryContent\n      }\n    }\n  }\n": typeof types.CollectionsDocument,
    "\n  mutation CreateCollection($name: String!) {\n    createCollection(name: $name) {\n      id\n    }\n  }\n": typeof types.CreateCollectionDocument,
    "\n  mutation RenameCollection($id: ID!, $name: String!) {\n    renameCollection(id: $id, name: $name) {\n      id\n    }\n  }\n": typeof types.RenameCollectionDocument,
    "\n  mutation DeleteCollection($id: ID!) {\n    deleteCollection(id: $id)\n  }\n": typeof types.DeleteCollectionDocument,
    "\n  mutation DeleteCollectionItem($id: ID!) {\n    deleteCollectionItem(id: $id)\n  }\n": typeof types.DeleteCollectionItemDocument,
    "\n  query Environments {\n    environments {\n      id\n      name\n      endpointUrl\n      isProduction\n      headers\n    }\n  }\n": typeof types.EnvironmentsDocument,
    "\n  query Secrets($environmentId: ID!) {\n    secrets(environmentId: $environmentId) {\n      id\n      name\n      lastFour\n      updatedAt\n    }\n  }\n": typeof types.SecretsDocument,
    "\n  mutation CreateEnv($input: CreateEnvironmentInput!) {\n    createEnvironment(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateEnvDocument,
    "\n  mutation UpdateEnv($id: ID!, $input: UpdateEnvironmentInput!) {\n    updateEnvironment(id: $id, input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateEnvDocument,
    "\n  mutation UpsertSecret($input: UpsertSecretInput!) {\n    upsertSecret(input: $input) {\n      id\n    }\n  }\n": typeof types.UpsertSecretDocument,
    "\n  mutation TestConnection($input: ExecuteOperationInput!) {\n    executeOperation(input: $input) {\n      execution {\n        status\n      }\n    }\n  }\n": typeof types.TestConnectionDocument,
    "\n  query History {\n    executions(limit: 50) {\n      id\n      status\n      durationMs\n      createdAt\n      httpStatus\n      operationId\n      responsePreview\n    }\n  }\n": typeof types.HistoryDocument,
    "\n  query Jobs {\n    jobs(limit: 50) {\n      id\n      jobType\n      status\n      createdAt\n      updatedAt\n      attempts\n      lastError\n      payload\n    }\n  }\n": typeof types.JobsDocument,
    "\n  mutation RetryJob($id: ID!) {\n    retryJob(id: $id) {\n      id\n      status\n    }\n  }\n": typeof types.RetryJobDocument,
    "\n  query OperationDetail($id: ID!) {\n    operation(id: $id) {\n      id\n      name\n      operationType\n      content\n      confidence\n      projectId\n      projectName\n      locations {\n        path\n        startLine\n        endLine\n        githubUrl\n      }\n    }\n    projects {\n      id\n      name\n    }\n    aiSettings {\n      redactionMode\n      enabled\n      hasOpenAiKey\n    }\n  }\n": typeof types.OperationDetailDocument,
    "\n  query ProjectSchemasForOp($projectId: ID!) {\n    schemas(projectId: $projectId) {\n      id\n    }\n  }\n": typeof types.ProjectSchemasForOpDocument,
    "\n  query SchemaVersionsForOp($schemaId: ID!) {\n    schemaVersions(schemaId: $schemaId) {\n      id\n    }\n  }\n": typeof types.SchemaVersionsForOpDocument,
    "\n  query OperationFindings($operationId: ID!) {\n    operationFindings(operationId: $operationId) {\n      id\n      ruleId\n      severity\n      message\n      path\n    }\n  }\n": typeof types.OperationFindingsDocument,
    "\n  mutation ExplainOperationDetail($input: ExplainOperationInput!) {\n    explainOperation(input: $input) {\n      markdown\n      citations {\n        typeName\n        fieldName\n      }\n    }\n  }\n": typeof types.ExplainOperationDetailDocument,
    "\n  mutation GenerateOperationDetail($input: GenerateOperationInput!) {\n    generateOperation(input: $input) {\n      document\n      warnings\n    }\n  }\n": typeof types.GenerateOperationDetailDocument,
    "\n  query OperationsBrowser($filter: OperationsFilter) {\n    projects {\n      id\n      name\n    }\n    operationsForWorkspace(filter: $filter) {\n      id\n      name\n      operationType\n      confidence\n      projectId\n      projectName\n    }\n  }\n": typeof types.OperationsBrowserDocument,
    "\n  query DashboardHome {\n    health {\n      ok\n      version\n    }\n    onboardingStatus {\n      hasProject\n      hasRepository\n      hasPublishedSchema\n      hasEnvironment\n      hasExecution\n      nextStep\n      projectCount\n      environmentCount\n      operationCount\n      lastExecutionAt\n    }\n    executions(limit: 8) {\n      id\n      status\n      durationMs\n      createdAt\n      operationId\n    }\n  }\n": typeof types.DashboardHomeDocument,
    "\n  mutation QuickStartBootstrap($input: BootstrapWorkspaceInput) {\n    bootstrapWorkspace(input: $input) {\n      onboardingStatus {\n        nextStep\n        projectCount\n        environmentCount\n      }\n    }\n  }\n": typeof types.QuickStartBootstrapDocument,
    "\n  query ProjectDetail($id: ID!) {\n    project(id: $id) {\n      id\n      name\n      slug\n    }\n    schemas(projectId: $id) {\n      id\n      name\n    }\n    repositoryLinks(projectId: $id) {\n      id\n      sourceType\n      localPath\n      githubRepo\n      status\n    }\n    operations(projectId: $id) {\n      id\n      name\n      operationType\n      confidence\n    }\n  }\n": typeof types.ProjectDetailDocument,
    "\n  query ProjectComposition($projectId: ID!) {\n    workspaceComposition(projectId: $projectId) {\n      ok\n      errors\n      schemaCount\n    }\n  }\n": typeof types.ProjectCompositionDocument,
    "\n  mutation PublishSchema($input: PublishSchemaInput!) {\n    publishSchema(input: $input) {\n      id\n    }\n  }\n": typeof types.PublishSchemaDocument,
    "\n  mutation EnableRepo($input: EnableRepositoryInput!) {\n    enableRepository(input: $input) {\n      id\n    }\n  }\n": typeof types.EnableRepoDocument,
    "\n  mutation Reindex($id: ID!) {\n    reindexRepository(id: $id) {\n      id\n    }\n  }\n": typeof types.ReindexDocument,
    "\n  query SchemaDetail($schemaId: ID!, $projectId: ID!) {\n    project(id: $projectId) {\n      id\n      name\n    }\n    schema(id: $schemaId) {\n      id\n      name\n    }\n    schemaVersions(schemaId: $schemaId) {\n      id\n      contentHash\n      createdAt\n      sdl\n      checks {\n        status\n        result\n      }\n    }\n  }\n": typeof types.SchemaDetailDocument,
    "\n  mutation RunCheck($schemaVersionId: ID!, $previousVersionId: ID) {\n    runSchemaCheck(schemaVersionId: $schemaVersionId, previousVersionId: $previousVersionId) {\n      id\n      status\n    }\n  }\n": typeof types.RunCheckDocument,
    "\n  query Projects {\n    projects {\n      id\n      name\n      slug\n    }\n  }\n": typeof types.ProjectsDocument,
    "\n  mutation CreateProject($input: CreateProjectInput!) {\n    createProject(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateProjectDocument,
    "\n  query ProjectsForVoyager {\n    projects {\n      id\n      name\n    }\n  }\n": typeof types.ProjectsForVoyagerDocument,
    "\n  query SchemasForVoyager($projectId: ID!) {\n    schemas(projectId: $projectId) {\n      id\n      name\n    }\n  }\n": typeof types.SchemasForVoyagerDocument,
    "\n  query SchemaVersionsForVoyager($schemaId: ID!) {\n    schemaVersions(schemaId: $schemaId) {\n      id\n      sdl\n      createdAt\n    }\n  }\n": typeof types.SchemaVersionsForVoyagerDocument,
    "\n  query SearchPage($q: String!, $limit: Int) {\n    search(q: $q, limit: $limit) {\n      kind\n      id\n      title\n      subtitle\n      href\n      score\n    }\n  }\n": typeof types.SearchPageDocument,
    "\n  mutation StartDeviceFlow {\n    githubDeviceFlowStart {\n      deviceCode\n      userCode\n      verificationUri\n      expiresIn\n      interval\n    }\n  }\n": typeof types.StartDeviceFlowDocument,
    "\n  mutation PollDeviceFlow($deviceCode: String!) {\n    githubDeviceFlowPoll(deviceCode: $deviceCode) {\n      sessionToken\n      user {\n        id\n        githubLogin\n        name\n      }\n      activeWorkspace {\n        id\n        name\n      }\n      onboardingStatus {\n        nextStep\n      }\n    }\n  }\n": typeof types.PollDeviceFlowDocument,
    "\n  mutation SignInLocal($input: LocalSignInInput!) {\n    signInLocal(input: $input) {\n      sessionToken\n      user {\n        id\n        name\n        githubLogin\n      }\n      activeWorkspace {\n        id\n        name\n      }\n      onboardingStatus {\n        nextStep\n      }\n    }\n  }\n": typeof types.SignInLocalDocument,
    "\n  mutation BootstrapWorkspace($input: BootstrapWorkspaceInput) {\n    bootstrapWorkspace(input: $input) {\n      workspace {\n        id\n        name\n      }\n      onboardingStatus {\n        nextStep\n      }\n    }\n  }\n": typeof types.BootstrapWorkspaceDocument,
    "\n  query MeLogin {\n    me {\n      id\n    }\n  }\n": typeof types.MeLoginDocument,
    "\n  query Me {\n    me {\n      id\n      githubLogin\n      name\n    }\n    activeWorkspace {\n      id\n      name\n      slug\n    }\n    workspaces {\n      id\n      name\n      slug\n    }\n    environments {\n      id\n      name\n    }\n  }\n": typeof types.MeDocument,
    "\n  mutation SwitchWorkspace($id: ID!) {\n    switchWorkspace(id: $id) {\n      id\n      name\n      slug\n    }\n  }\n": typeof types.SwitchWorkspaceDocument,
    "\n  mutation CreateWorkspace($input: CreateWorkspaceInput!) {\n    createWorkspace(input: $input) {\n      id\n      name\n      slug\n    }\n  }\n": typeof types.CreateWorkspaceDocument,
    "\n  mutation Logout {\n    logout\n  }\n": typeof types.LogoutDocument,
    "\n  mutation SaveGithubPat($token: String!) {\n    saveGithubPat(token: $token)\n  }\n": typeof types.SaveGithubPatDocument,
    "\n  query AiSettingsForLayout {\n    aiSettings {\n      redactionMode\n      enabled\n      hasOpenAiKey\n    }\n  }\n": typeof types.AiSettingsForLayoutDocument,
    "\n  mutation UpdateAiSettings($input: UpdateAiSettingsInput!) {\n    updateAiSettings(input: $input) {\n      redactionMode\n      enabled\n      hasOpenAiKey\n    }\n  }\n": typeof types.UpdateAiSettingsDocument,
    "\n  mutation SaveOpenAiKey($apiKey: String!) {\n    saveOpenAiKey(apiKey: $apiKey) {\n      hasOpenAiKey\n      redactionMode\n      enabled\n    }\n  }\n": typeof types.SaveOpenAiKeyDocument,
    "\n  query CacheStatus {\n    cacheStatus {\n      enabled\n      connected\n    }\n  }\n": typeof types.CacheStatusDocument,
    "\n  mutation SaveNotifyWebhook($url: String!) {\n    saveNotifyWebhook(url: $url)\n  }\n": typeof types.SaveNotifyWebhookDocument,
    "\n  query GlobalSearch($q: String!, $limit: Int) {\n    search(q: $q, limit: $limit) {\n      kind\n      id\n      title\n      subtitle\n      href\n      score\n    }\n  }\n": typeof types.GlobalSearchDocument,
    "\n  query AiSettingsForExecute {\n    aiSettings {\n      redactionMode\n      enabled\n      hasOpenAiKey\n    }\n  }\n": typeof types.AiSettingsForExecuteDocument,
    "\n  mutation ExplainOperation($input: ExplainOperationInput!) {\n    explainOperation(input: $input) {\n      markdown\n      citations {\n        typeName\n        fieldName\n      }\n    }\n  }\n": typeof types.ExplainOperationDocument,
    "\n  mutation GenerateOperation($input: GenerateOperationInput!) {\n    generateOperation(input: $input) {\n      document\n      warnings\n    }\n  }\n": typeof types.GenerateOperationDocument,
    "\n  query ProjectSchemas($projectId: ID!) {\n    schemas(projectId: $projectId) {\n      id\n    }\n  }\n": typeof types.ProjectSchemasDocument,
    "\n  query SchemaVersionsBySchema($schemaId: ID!) {\n    schemaVersions(schemaId: $schemaId) {\n      id\n    }\n  }\n": typeof types.SchemaVersionsBySchemaDocument,
    "\n  query EnvironmentsForExecute {\n    environments {\n      id\n      name\n      headers\n    }\n  }\n": typeof types.EnvironmentsForExecuteDocument,
    "\n  query OperationForRun($id: ID!) {\n    operation(id: $id) {\n      id\n      name\n      content\n      projectId\n    }\n    environments {\n      id\n      name\n      headers\n    }\n  }\n": typeof types.OperationForRunDocument,
    "\n  query CollectionItemForExecute($id: ID!) {\n    collectionItem(id: $id) {\n      id\n      name\n      queryContent\n      variablesJson\n      operationId\n      collectionId\n    }\n    environments {\n      id\n      name\n      headers\n    }\n  }\n": typeof types.CollectionItemForExecuteDocument,
    "\n  mutation Execute($input: ExecuteOperationInput!) {\n    executeOperation(input: $input) {\n      responseBody\n      execution {\n        id\n        status\n        durationMs\n        httpStatus\n      }\n    }\n  }\n": typeof types.ExecuteDocument,
    "\n  query CollectionsForSave {\n    collections {\n      id\n      name\n    }\n  }\n": typeof types.CollectionsForSaveDocument,
    "\n  mutation CreateCollectionForSave($name: String!) {\n    createCollection(name: $name) {\n      id\n      name\n    }\n  }\n": typeof types.CreateCollectionForSaveDocument,
    "\n  mutation SaveToCollection($input: SaveToCollectionInput!) {\n    saveToCollection(input: $input) {\n      id\n      name\n    }\n  }\n": typeof types.SaveToCollectionDocument,
};
const documents: Documents = {
    "\n  query AnalyticsDashboard($workspaceId: ID!) {\n    activeWorkspace {\n      id\n      name\n    }\n    workspaceDashboard(workspaceId: $workspaceId) {\n      operationCount\n      openHighFindings\n      checksFailed7d\n      execP50Ms\n      execP95Ms\n    }\n    operationsForWorkspace(limit: 10) {\n      id\n      name\n      operationType\n      projectName\n    }\n  }\n": types.AnalyticsDashboardDocument,
    "\n    query ActiveWorkspace {\n      activeWorkspace {\n        id\n        name\n      }\n    }\n  ": types.ActiveWorkspaceDocument,
    "\n  query Collections {\n    collections {\n      id\n      name\n      items {\n        id\n        name\n        operationId\n        queryContent\n      }\n    }\n  }\n": types.CollectionsDocument,
    "\n  mutation CreateCollection($name: String!) {\n    createCollection(name: $name) {\n      id\n    }\n  }\n": types.CreateCollectionDocument,
    "\n  mutation RenameCollection($id: ID!, $name: String!) {\n    renameCollection(id: $id, name: $name) {\n      id\n    }\n  }\n": types.RenameCollectionDocument,
    "\n  mutation DeleteCollection($id: ID!) {\n    deleteCollection(id: $id)\n  }\n": types.DeleteCollectionDocument,
    "\n  mutation DeleteCollectionItem($id: ID!) {\n    deleteCollectionItem(id: $id)\n  }\n": types.DeleteCollectionItemDocument,
    "\n  query Environments {\n    environments {\n      id\n      name\n      endpointUrl\n      isProduction\n      headers\n    }\n  }\n": types.EnvironmentsDocument,
    "\n  query Secrets($environmentId: ID!) {\n    secrets(environmentId: $environmentId) {\n      id\n      name\n      lastFour\n      updatedAt\n    }\n  }\n": types.SecretsDocument,
    "\n  mutation CreateEnv($input: CreateEnvironmentInput!) {\n    createEnvironment(input: $input) {\n      id\n    }\n  }\n": types.CreateEnvDocument,
    "\n  mutation UpdateEnv($id: ID!, $input: UpdateEnvironmentInput!) {\n    updateEnvironment(id: $id, input: $input) {\n      id\n    }\n  }\n": types.UpdateEnvDocument,
    "\n  mutation UpsertSecret($input: UpsertSecretInput!) {\n    upsertSecret(input: $input) {\n      id\n    }\n  }\n": types.UpsertSecretDocument,
    "\n  mutation TestConnection($input: ExecuteOperationInput!) {\n    executeOperation(input: $input) {\n      execution {\n        status\n      }\n    }\n  }\n": types.TestConnectionDocument,
    "\n  query History {\n    executions(limit: 50) {\n      id\n      status\n      durationMs\n      createdAt\n      httpStatus\n      operationId\n      responsePreview\n    }\n  }\n": types.HistoryDocument,
    "\n  query Jobs {\n    jobs(limit: 50) {\n      id\n      jobType\n      status\n      createdAt\n      updatedAt\n      attempts\n      lastError\n      payload\n    }\n  }\n": types.JobsDocument,
    "\n  mutation RetryJob($id: ID!) {\n    retryJob(id: $id) {\n      id\n      status\n    }\n  }\n": types.RetryJobDocument,
    "\n  query OperationDetail($id: ID!) {\n    operation(id: $id) {\n      id\n      name\n      operationType\n      content\n      confidence\n      projectId\n      projectName\n      locations {\n        path\n        startLine\n        endLine\n        githubUrl\n      }\n    }\n    projects {\n      id\n      name\n    }\n    aiSettings {\n      redactionMode\n      enabled\n      hasOpenAiKey\n    }\n  }\n": types.OperationDetailDocument,
    "\n  query ProjectSchemasForOp($projectId: ID!) {\n    schemas(projectId: $projectId) {\n      id\n    }\n  }\n": types.ProjectSchemasForOpDocument,
    "\n  query SchemaVersionsForOp($schemaId: ID!) {\n    schemaVersions(schemaId: $schemaId) {\n      id\n    }\n  }\n": types.SchemaVersionsForOpDocument,
    "\n  query OperationFindings($operationId: ID!) {\n    operationFindings(operationId: $operationId) {\n      id\n      ruleId\n      severity\n      message\n      path\n    }\n  }\n": types.OperationFindingsDocument,
    "\n  mutation ExplainOperationDetail($input: ExplainOperationInput!) {\n    explainOperation(input: $input) {\n      markdown\n      citations {\n        typeName\n        fieldName\n      }\n    }\n  }\n": types.ExplainOperationDetailDocument,
    "\n  mutation GenerateOperationDetail($input: GenerateOperationInput!) {\n    generateOperation(input: $input) {\n      document\n      warnings\n    }\n  }\n": types.GenerateOperationDetailDocument,
    "\n  query OperationsBrowser($filter: OperationsFilter) {\n    projects {\n      id\n      name\n    }\n    operationsForWorkspace(filter: $filter) {\n      id\n      name\n      operationType\n      confidence\n      projectId\n      projectName\n    }\n  }\n": types.OperationsBrowserDocument,
    "\n  query DashboardHome {\n    health {\n      ok\n      version\n    }\n    onboardingStatus {\n      hasProject\n      hasRepository\n      hasPublishedSchema\n      hasEnvironment\n      hasExecution\n      nextStep\n      projectCount\n      environmentCount\n      operationCount\n      lastExecutionAt\n    }\n    executions(limit: 8) {\n      id\n      status\n      durationMs\n      createdAt\n      operationId\n    }\n  }\n": types.DashboardHomeDocument,
    "\n  mutation QuickStartBootstrap($input: BootstrapWorkspaceInput) {\n    bootstrapWorkspace(input: $input) {\n      onboardingStatus {\n        nextStep\n        projectCount\n        environmentCount\n      }\n    }\n  }\n": types.QuickStartBootstrapDocument,
    "\n  query ProjectDetail($id: ID!) {\n    project(id: $id) {\n      id\n      name\n      slug\n    }\n    schemas(projectId: $id) {\n      id\n      name\n    }\n    repositoryLinks(projectId: $id) {\n      id\n      sourceType\n      localPath\n      githubRepo\n      status\n    }\n    operations(projectId: $id) {\n      id\n      name\n      operationType\n      confidence\n    }\n  }\n": types.ProjectDetailDocument,
    "\n  query ProjectComposition($projectId: ID!) {\n    workspaceComposition(projectId: $projectId) {\n      ok\n      errors\n      schemaCount\n    }\n  }\n": types.ProjectCompositionDocument,
    "\n  mutation PublishSchema($input: PublishSchemaInput!) {\n    publishSchema(input: $input) {\n      id\n    }\n  }\n": types.PublishSchemaDocument,
    "\n  mutation EnableRepo($input: EnableRepositoryInput!) {\n    enableRepository(input: $input) {\n      id\n    }\n  }\n": types.EnableRepoDocument,
    "\n  mutation Reindex($id: ID!) {\n    reindexRepository(id: $id) {\n      id\n    }\n  }\n": types.ReindexDocument,
    "\n  query SchemaDetail($schemaId: ID!, $projectId: ID!) {\n    project(id: $projectId) {\n      id\n      name\n    }\n    schema(id: $schemaId) {\n      id\n      name\n    }\n    schemaVersions(schemaId: $schemaId) {\n      id\n      contentHash\n      createdAt\n      sdl\n      checks {\n        status\n        result\n      }\n    }\n  }\n": types.SchemaDetailDocument,
    "\n  mutation RunCheck($schemaVersionId: ID!, $previousVersionId: ID) {\n    runSchemaCheck(schemaVersionId: $schemaVersionId, previousVersionId: $previousVersionId) {\n      id\n      status\n    }\n  }\n": types.RunCheckDocument,
    "\n  query Projects {\n    projects {\n      id\n      name\n      slug\n    }\n  }\n": types.ProjectsDocument,
    "\n  mutation CreateProject($input: CreateProjectInput!) {\n    createProject(input: $input) {\n      id\n    }\n  }\n": types.CreateProjectDocument,
    "\n  query ProjectsForVoyager {\n    projects {\n      id\n      name\n    }\n  }\n": types.ProjectsForVoyagerDocument,
    "\n  query SchemasForVoyager($projectId: ID!) {\n    schemas(projectId: $projectId) {\n      id\n      name\n    }\n  }\n": types.SchemasForVoyagerDocument,
    "\n  query SchemaVersionsForVoyager($schemaId: ID!) {\n    schemaVersions(schemaId: $schemaId) {\n      id\n      sdl\n      createdAt\n    }\n  }\n": types.SchemaVersionsForVoyagerDocument,
    "\n  query SearchPage($q: String!, $limit: Int) {\n    search(q: $q, limit: $limit) {\n      kind\n      id\n      title\n      subtitle\n      href\n      score\n    }\n  }\n": types.SearchPageDocument,
    "\n  mutation StartDeviceFlow {\n    githubDeviceFlowStart {\n      deviceCode\n      userCode\n      verificationUri\n      expiresIn\n      interval\n    }\n  }\n": types.StartDeviceFlowDocument,
    "\n  mutation PollDeviceFlow($deviceCode: String!) {\n    githubDeviceFlowPoll(deviceCode: $deviceCode) {\n      sessionToken\n      user {\n        id\n        githubLogin\n        name\n      }\n      activeWorkspace {\n        id\n        name\n      }\n      onboardingStatus {\n        nextStep\n      }\n    }\n  }\n": types.PollDeviceFlowDocument,
    "\n  mutation SignInLocal($input: LocalSignInInput!) {\n    signInLocal(input: $input) {\n      sessionToken\n      user {\n        id\n        name\n        githubLogin\n      }\n      activeWorkspace {\n        id\n        name\n      }\n      onboardingStatus {\n        nextStep\n      }\n    }\n  }\n": types.SignInLocalDocument,
    "\n  mutation BootstrapWorkspace($input: BootstrapWorkspaceInput) {\n    bootstrapWorkspace(input: $input) {\n      workspace {\n        id\n        name\n      }\n      onboardingStatus {\n        nextStep\n      }\n    }\n  }\n": types.BootstrapWorkspaceDocument,
    "\n  query MeLogin {\n    me {\n      id\n    }\n  }\n": types.MeLoginDocument,
    "\n  query Me {\n    me {\n      id\n      githubLogin\n      name\n    }\n    activeWorkspace {\n      id\n      name\n      slug\n    }\n    workspaces {\n      id\n      name\n      slug\n    }\n    environments {\n      id\n      name\n    }\n  }\n": types.MeDocument,
    "\n  mutation SwitchWorkspace($id: ID!) {\n    switchWorkspace(id: $id) {\n      id\n      name\n      slug\n    }\n  }\n": types.SwitchWorkspaceDocument,
    "\n  mutation CreateWorkspace($input: CreateWorkspaceInput!) {\n    createWorkspace(input: $input) {\n      id\n      name\n      slug\n    }\n  }\n": types.CreateWorkspaceDocument,
    "\n  mutation Logout {\n    logout\n  }\n": types.LogoutDocument,
    "\n  mutation SaveGithubPat($token: String!) {\n    saveGithubPat(token: $token)\n  }\n": types.SaveGithubPatDocument,
    "\n  query AiSettingsForLayout {\n    aiSettings {\n      redactionMode\n      enabled\n      hasOpenAiKey\n    }\n  }\n": types.AiSettingsForLayoutDocument,
    "\n  mutation UpdateAiSettings($input: UpdateAiSettingsInput!) {\n    updateAiSettings(input: $input) {\n      redactionMode\n      enabled\n      hasOpenAiKey\n    }\n  }\n": types.UpdateAiSettingsDocument,
    "\n  mutation SaveOpenAiKey($apiKey: String!) {\n    saveOpenAiKey(apiKey: $apiKey) {\n      hasOpenAiKey\n      redactionMode\n      enabled\n    }\n  }\n": types.SaveOpenAiKeyDocument,
    "\n  query CacheStatus {\n    cacheStatus {\n      enabled\n      connected\n    }\n  }\n": types.CacheStatusDocument,
    "\n  mutation SaveNotifyWebhook($url: String!) {\n    saveNotifyWebhook(url: $url)\n  }\n": types.SaveNotifyWebhookDocument,
    "\n  query GlobalSearch($q: String!, $limit: Int) {\n    search(q: $q, limit: $limit) {\n      kind\n      id\n      title\n      subtitle\n      href\n      score\n    }\n  }\n": types.GlobalSearchDocument,
    "\n  query AiSettingsForExecute {\n    aiSettings {\n      redactionMode\n      enabled\n      hasOpenAiKey\n    }\n  }\n": types.AiSettingsForExecuteDocument,
    "\n  mutation ExplainOperation($input: ExplainOperationInput!) {\n    explainOperation(input: $input) {\n      markdown\n      citations {\n        typeName\n        fieldName\n      }\n    }\n  }\n": types.ExplainOperationDocument,
    "\n  mutation GenerateOperation($input: GenerateOperationInput!) {\n    generateOperation(input: $input) {\n      document\n      warnings\n    }\n  }\n": types.GenerateOperationDocument,
    "\n  query ProjectSchemas($projectId: ID!) {\n    schemas(projectId: $projectId) {\n      id\n    }\n  }\n": types.ProjectSchemasDocument,
    "\n  query SchemaVersionsBySchema($schemaId: ID!) {\n    schemaVersions(schemaId: $schemaId) {\n      id\n    }\n  }\n": types.SchemaVersionsBySchemaDocument,
    "\n  query EnvironmentsForExecute {\n    environments {\n      id\n      name\n      headers\n    }\n  }\n": types.EnvironmentsForExecuteDocument,
    "\n  query OperationForRun($id: ID!) {\n    operation(id: $id) {\n      id\n      name\n      content\n      projectId\n    }\n    environments {\n      id\n      name\n      headers\n    }\n  }\n": types.OperationForRunDocument,
    "\n  query CollectionItemForExecute($id: ID!) {\n    collectionItem(id: $id) {\n      id\n      name\n      queryContent\n      variablesJson\n      operationId\n      collectionId\n    }\n    environments {\n      id\n      name\n      headers\n    }\n  }\n": types.CollectionItemForExecuteDocument,
    "\n  mutation Execute($input: ExecuteOperationInput!) {\n    executeOperation(input: $input) {\n      responseBody\n      execution {\n        id\n        status\n        durationMs\n        httpStatus\n      }\n    }\n  }\n": types.ExecuteDocument,
    "\n  query CollectionsForSave {\n    collections {\n      id\n      name\n    }\n  }\n": types.CollectionsForSaveDocument,
    "\n  mutation CreateCollectionForSave($name: String!) {\n    createCollection(name: $name) {\n      id\n      name\n    }\n  }\n": types.CreateCollectionForSaveDocument,
    "\n  mutation SaveToCollection($input: SaveToCollectionInput!) {\n    saveToCollection(input: $input) {\n      id\n      name\n    }\n  }\n": types.SaveToCollectionDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query AnalyticsDashboard($workspaceId: ID!) {\n    activeWorkspace {\n      id\n      name\n    }\n    workspaceDashboard(workspaceId: $workspaceId) {\n      operationCount\n      openHighFindings\n      checksFailed7d\n      execP50Ms\n      execP95Ms\n    }\n    operationsForWorkspace(limit: 10) {\n      id\n      name\n      operationType\n      projectName\n    }\n  }\n"): (typeof documents)["\n  query AnalyticsDashboard($workspaceId: ID!) {\n    activeWorkspace {\n      id\n      name\n    }\n    workspaceDashboard(workspaceId: $workspaceId) {\n      operationCount\n      openHighFindings\n      checksFailed7d\n      execP50Ms\n      execP95Ms\n    }\n    operationsForWorkspace(limit: 10) {\n      id\n      name\n      operationType\n      projectName\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n    query ActiveWorkspace {\n      activeWorkspace {\n        id\n        name\n      }\n    }\n  "): (typeof documents)["\n    query ActiveWorkspace {\n      activeWorkspace {\n        id\n        name\n      }\n    }\n  "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query Collections {\n    collections {\n      id\n      name\n      items {\n        id\n        name\n        operationId\n        queryContent\n      }\n    }\n  }\n"): (typeof documents)["\n  query Collections {\n    collections {\n      id\n      name\n      items {\n        id\n        name\n        operationId\n        queryContent\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateCollection($name: String!) {\n    createCollection(name: $name) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateCollection($name: String!) {\n    createCollection(name: $name) {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation RenameCollection($id: ID!, $name: String!) {\n    renameCollection(id: $id, name: $name) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation RenameCollection($id: ID!, $name: String!) {\n    renameCollection(id: $id, name: $name) {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteCollection($id: ID!) {\n    deleteCollection(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteCollection($id: ID!) {\n    deleteCollection(id: $id)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteCollectionItem($id: ID!) {\n    deleteCollectionItem(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteCollectionItem($id: ID!) {\n    deleteCollectionItem(id: $id)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query Environments {\n    environments {\n      id\n      name\n      endpointUrl\n      isProduction\n      headers\n    }\n  }\n"): (typeof documents)["\n  query Environments {\n    environments {\n      id\n      name\n      endpointUrl\n      isProduction\n      headers\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query Secrets($environmentId: ID!) {\n    secrets(environmentId: $environmentId) {\n      id\n      name\n      lastFour\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query Secrets($environmentId: ID!) {\n    secrets(environmentId: $environmentId) {\n      id\n      name\n      lastFour\n      updatedAt\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateEnv($input: CreateEnvironmentInput!) {\n    createEnvironment(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateEnv($input: CreateEnvironmentInput!) {\n    createEnvironment(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateEnv($id: ID!, $input: UpdateEnvironmentInput!) {\n    updateEnvironment(id: $id, input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateEnv($id: ID!, $input: UpdateEnvironmentInput!) {\n    updateEnvironment(id: $id, input: $input) {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpsertSecret($input: UpsertSecretInput!) {\n    upsertSecret(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpsertSecret($input: UpsertSecretInput!) {\n    upsertSecret(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation TestConnection($input: ExecuteOperationInput!) {\n    executeOperation(input: $input) {\n      execution {\n        status\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation TestConnection($input: ExecuteOperationInput!) {\n    executeOperation(input: $input) {\n      execution {\n        status\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query History {\n    executions(limit: 50) {\n      id\n      status\n      durationMs\n      createdAt\n      httpStatus\n      operationId\n      responsePreview\n    }\n  }\n"): (typeof documents)["\n  query History {\n    executions(limit: 50) {\n      id\n      status\n      durationMs\n      createdAt\n      httpStatus\n      operationId\n      responsePreview\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query Jobs {\n    jobs(limit: 50) {\n      id\n      jobType\n      status\n      createdAt\n      updatedAt\n      attempts\n      lastError\n      payload\n    }\n  }\n"): (typeof documents)["\n  query Jobs {\n    jobs(limit: 50) {\n      id\n      jobType\n      status\n      createdAt\n      updatedAt\n      attempts\n      lastError\n      payload\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation RetryJob($id: ID!) {\n    retryJob(id: $id) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation RetryJob($id: ID!) {\n    retryJob(id: $id) {\n      id\n      status\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query OperationDetail($id: ID!) {\n    operation(id: $id) {\n      id\n      name\n      operationType\n      content\n      confidence\n      projectId\n      projectName\n      locations {\n        path\n        startLine\n        endLine\n        githubUrl\n      }\n    }\n    projects {\n      id\n      name\n    }\n    aiSettings {\n      redactionMode\n      enabled\n      hasOpenAiKey\n    }\n  }\n"): (typeof documents)["\n  query OperationDetail($id: ID!) {\n    operation(id: $id) {\n      id\n      name\n      operationType\n      content\n      confidence\n      projectId\n      projectName\n      locations {\n        path\n        startLine\n        endLine\n        githubUrl\n      }\n    }\n    projects {\n      id\n      name\n    }\n    aiSettings {\n      redactionMode\n      enabled\n      hasOpenAiKey\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query ProjectSchemasForOp($projectId: ID!) {\n    schemas(projectId: $projectId) {\n      id\n    }\n  }\n"): (typeof documents)["\n  query ProjectSchemasForOp($projectId: ID!) {\n    schemas(projectId: $projectId) {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query SchemaVersionsForOp($schemaId: ID!) {\n    schemaVersions(schemaId: $schemaId) {\n      id\n    }\n  }\n"): (typeof documents)["\n  query SchemaVersionsForOp($schemaId: ID!) {\n    schemaVersions(schemaId: $schemaId) {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query OperationFindings($operationId: ID!) {\n    operationFindings(operationId: $operationId) {\n      id\n      ruleId\n      severity\n      message\n      path\n    }\n  }\n"): (typeof documents)["\n  query OperationFindings($operationId: ID!) {\n    operationFindings(operationId: $operationId) {\n      id\n      ruleId\n      severity\n      message\n      path\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation ExplainOperationDetail($input: ExplainOperationInput!) {\n    explainOperation(input: $input) {\n      markdown\n      citations {\n        typeName\n        fieldName\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation ExplainOperationDetail($input: ExplainOperationInput!) {\n    explainOperation(input: $input) {\n      markdown\n      citations {\n        typeName\n        fieldName\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation GenerateOperationDetail($input: GenerateOperationInput!) {\n    generateOperation(input: $input) {\n      document\n      warnings\n    }\n  }\n"): (typeof documents)["\n  mutation GenerateOperationDetail($input: GenerateOperationInput!) {\n    generateOperation(input: $input) {\n      document\n      warnings\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query OperationsBrowser($filter: OperationsFilter) {\n    projects {\n      id\n      name\n    }\n    operationsForWorkspace(filter: $filter) {\n      id\n      name\n      operationType\n      confidence\n      projectId\n      projectName\n    }\n  }\n"): (typeof documents)["\n  query OperationsBrowser($filter: OperationsFilter) {\n    projects {\n      id\n      name\n    }\n    operationsForWorkspace(filter: $filter) {\n      id\n      name\n      operationType\n      confidence\n      projectId\n      projectName\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query DashboardHome {\n    health {\n      ok\n      version\n    }\n    onboardingStatus {\n      hasProject\n      hasRepository\n      hasPublishedSchema\n      hasEnvironment\n      hasExecution\n      nextStep\n      projectCount\n      environmentCount\n      operationCount\n      lastExecutionAt\n    }\n    executions(limit: 8) {\n      id\n      status\n      durationMs\n      createdAt\n      operationId\n    }\n  }\n"): (typeof documents)["\n  query DashboardHome {\n    health {\n      ok\n      version\n    }\n    onboardingStatus {\n      hasProject\n      hasRepository\n      hasPublishedSchema\n      hasEnvironment\n      hasExecution\n      nextStep\n      projectCount\n      environmentCount\n      operationCount\n      lastExecutionAt\n    }\n    executions(limit: 8) {\n      id\n      status\n      durationMs\n      createdAt\n      operationId\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation QuickStartBootstrap($input: BootstrapWorkspaceInput) {\n    bootstrapWorkspace(input: $input) {\n      onboardingStatus {\n        nextStep\n        projectCount\n        environmentCount\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation QuickStartBootstrap($input: BootstrapWorkspaceInput) {\n    bootstrapWorkspace(input: $input) {\n      onboardingStatus {\n        nextStep\n        projectCount\n        environmentCount\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query ProjectDetail($id: ID!) {\n    project(id: $id) {\n      id\n      name\n      slug\n    }\n    schemas(projectId: $id) {\n      id\n      name\n    }\n    repositoryLinks(projectId: $id) {\n      id\n      sourceType\n      localPath\n      githubRepo\n      status\n    }\n    operations(projectId: $id) {\n      id\n      name\n      operationType\n      confidence\n    }\n  }\n"): (typeof documents)["\n  query ProjectDetail($id: ID!) {\n    project(id: $id) {\n      id\n      name\n      slug\n    }\n    schemas(projectId: $id) {\n      id\n      name\n    }\n    repositoryLinks(projectId: $id) {\n      id\n      sourceType\n      localPath\n      githubRepo\n      status\n    }\n    operations(projectId: $id) {\n      id\n      name\n      operationType\n      confidence\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query ProjectComposition($projectId: ID!) {\n    workspaceComposition(projectId: $projectId) {\n      ok\n      errors\n      schemaCount\n    }\n  }\n"): (typeof documents)["\n  query ProjectComposition($projectId: ID!) {\n    workspaceComposition(projectId: $projectId) {\n      ok\n      errors\n      schemaCount\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation PublishSchema($input: PublishSchemaInput!) {\n    publishSchema(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation PublishSchema($input: PublishSchemaInput!) {\n    publishSchema(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation EnableRepo($input: EnableRepositoryInput!) {\n    enableRepository(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation EnableRepo($input: EnableRepositoryInput!) {\n    enableRepository(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation Reindex($id: ID!) {\n    reindexRepository(id: $id) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation Reindex($id: ID!) {\n    reindexRepository(id: $id) {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query SchemaDetail($schemaId: ID!, $projectId: ID!) {\n    project(id: $projectId) {\n      id\n      name\n    }\n    schema(id: $schemaId) {\n      id\n      name\n    }\n    schemaVersions(schemaId: $schemaId) {\n      id\n      contentHash\n      createdAt\n      sdl\n      checks {\n        status\n        result\n      }\n    }\n  }\n"): (typeof documents)["\n  query SchemaDetail($schemaId: ID!, $projectId: ID!) {\n    project(id: $projectId) {\n      id\n      name\n    }\n    schema(id: $schemaId) {\n      id\n      name\n    }\n    schemaVersions(schemaId: $schemaId) {\n      id\n      contentHash\n      createdAt\n      sdl\n      checks {\n        status\n        result\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation RunCheck($schemaVersionId: ID!, $previousVersionId: ID) {\n    runSchemaCheck(schemaVersionId: $schemaVersionId, previousVersionId: $previousVersionId) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation RunCheck($schemaVersionId: ID!, $previousVersionId: ID) {\n    runSchemaCheck(schemaVersionId: $schemaVersionId, previousVersionId: $previousVersionId) {\n      id\n      status\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query Projects {\n    projects {\n      id\n      name\n      slug\n    }\n  }\n"): (typeof documents)["\n  query Projects {\n    projects {\n      id\n      name\n      slug\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateProject($input: CreateProjectInput!) {\n    createProject(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateProject($input: CreateProjectInput!) {\n    createProject(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query ProjectsForVoyager {\n    projects {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query ProjectsForVoyager {\n    projects {\n      id\n      name\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query SchemasForVoyager($projectId: ID!) {\n    schemas(projectId: $projectId) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query SchemasForVoyager($projectId: ID!) {\n    schemas(projectId: $projectId) {\n      id\n      name\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query SchemaVersionsForVoyager($schemaId: ID!) {\n    schemaVersions(schemaId: $schemaId) {\n      id\n      sdl\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query SchemaVersionsForVoyager($schemaId: ID!) {\n    schemaVersions(schemaId: $schemaId) {\n      id\n      sdl\n      createdAt\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query SearchPage($q: String!, $limit: Int) {\n    search(q: $q, limit: $limit) {\n      kind\n      id\n      title\n      subtitle\n      href\n      score\n    }\n  }\n"): (typeof documents)["\n  query SearchPage($q: String!, $limit: Int) {\n    search(q: $q, limit: $limit) {\n      kind\n      id\n      title\n      subtitle\n      href\n      score\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation StartDeviceFlow {\n    githubDeviceFlowStart {\n      deviceCode\n      userCode\n      verificationUri\n      expiresIn\n      interval\n    }\n  }\n"): (typeof documents)["\n  mutation StartDeviceFlow {\n    githubDeviceFlowStart {\n      deviceCode\n      userCode\n      verificationUri\n      expiresIn\n      interval\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation PollDeviceFlow($deviceCode: String!) {\n    githubDeviceFlowPoll(deviceCode: $deviceCode) {\n      sessionToken\n      user {\n        id\n        githubLogin\n        name\n      }\n      activeWorkspace {\n        id\n        name\n      }\n      onboardingStatus {\n        nextStep\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation PollDeviceFlow($deviceCode: String!) {\n    githubDeviceFlowPoll(deviceCode: $deviceCode) {\n      sessionToken\n      user {\n        id\n        githubLogin\n        name\n      }\n      activeWorkspace {\n        id\n        name\n      }\n      onboardingStatus {\n        nextStep\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation SignInLocal($input: LocalSignInInput!) {\n    signInLocal(input: $input) {\n      sessionToken\n      user {\n        id\n        name\n        githubLogin\n      }\n      activeWorkspace {\n        id\n        name\n      }\n      onboardingStatus {\n        nextStep\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation SignInLocal($input: LocalSignInInput!) {\n    signInLocal(input: $input) {\n      sessionToken\n      user {\n        id\n        name\n        githubLogin\n      }\n      activeWorkspace {\n        id\n        name\n      }\n      onboardingStatus {\n        nextStep\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation BootstrapWorkspace($input: BootstrapWorkspaceInput) {\n    bootstrapWorkspace(input: $input) {\n      workspace {\n        id\n        name\n      }\n      onboardingStatus {\n        nextStep\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation BootstrapWorkspace($input: BootstrapWorkspaceInput) {\n    bootstrapWorkspace(input: $input) {\n      workspace {\n        id\n        name\n      }\n      onboardingStatus {\n        nextStep\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query MeLogin {\n    me {\n      id\n    }\n  }\n"): (typeof documents)["\n  query MeLogin {\n    me {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query Me {\n    me {\n      id\n      githubLogin\n      name\n    }\n    activeWorkspace {\n      id\n      name\n      slug\n    }\n    workspaces {\n      id\n      name\n      slug\n    }\n    environments {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query Me {\n    me {\n      id\n      githubLogin\n      name\n    }\n    activeWorkspace {\n      id\n      name\n      slug\n    }\n    workspaces {\n      id\n      name\n      slug\n    }\n    environments {\n      id\n      name\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation SwitchWorkspace($id: ID!) {\n    switchWorkspace(id: $id) {\n      id\n      name\n      slug\n    }\n  }\n"): (typeof documents)["\n  mutation SwitchWorkspace($id: ID!) {\n    switchWorkspace(id: $id) {\n      id\n      name\n      slug\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateWorkspace($input: CreateWorkspaceInput!) {\n    createWorkspace(input: $input) {\n      id\n      name\n      slug\n    }\n  }\n"): (typeof documents)["\n  mutation CreateWorkspace($input: CreateWorkspaceInput!) {\n    createWorkspace(input: $input) {\n      id\n      name\n      slug\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation Logout {\n    logout\n  }\n"): (typeof documents)["\n  mutation Logout {\n    logout\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation SaveGithubPat($token: String!) {\n    saveGithubPat(token: $token)\n  }\n"): (typeof documents)["\n  mutation SaveGithubPat($token: String!) {\n    saveGithubPat(token: $token)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query AiSettingsForLayout {\n    aiSettings {\n      redactionMode\n      enabled\n      hasOpenAiKey\n    }\n  }\n"): (typeof documents)["\n  query AiSettingsForLayout {\n    aiSettings {\n      redactionMode\n      enabled\n      hasOpenAiKey\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateAiSettings($input: UpdateAiSettingsInput!) {\n    updateAiSettings(input: $input) {\n      redactionMode\n      enabled\n      hasOpenAiKey\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateAiSettings($input: UpdateAiSettingsInput!) {\n    updateAiSettings(input: $input) {\n      redactionMode\n      enabled\n      hasOpenAiKey\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation SaveOpenAiKey($apiKey: String!) {\n    saveOpenAiKey(apiKey: $apiKey) {\n      hasOpenAiKey\n      redactionMode\n      enabled\n    }\n  }\n"): (typeof documents)["\n  mutation SaveOpenAiKey($apiKey: String!) {\n    saveOpenAiKey(apiKey: $apiKey) {\n      hasOpenAiKey\n      redactionMode\n      enabled\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query CacheStatus {\n    cacheStatus {\n      enabled\n      connected\n    }\n  }\n"): (typeof documents)["\n  query CacheStatus {\n    cacheStatus {\n      enabled\n      connected\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation SaveNotifyWebhook($url: String!) {\n    saveNotifyWebhook(url: $url)\n  }\n"): (typeof documents)["\n  mutation SaveNotifyWebhook($url: String!) {\n    saveNotifyWebhook(url: $url)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GlobalSearch($q: String!, $limit: Int) {\n    search(q: $q, limit: $limit) {\n      kind\n      id\n      title\n      subtitle\n      href\n      score\n    }\n  }\n"): (typeof documents)["\n  query GlobalSearch($q: String!, $limit: Int) {\n    search(q: $q, limit: $limit) {\n      kind\n      id\n      title\n      subtitle\n      href\n      score\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query AiSettingsForExecute {\n    aiSettings {\n      redactionMode\n      enabled\n      hasOpenAiKey\n    }\n  }\n"): (typeof documents)["\n  query AiSettingsForExecute {\n    aiSettings {\n      redactionMode\n      enabled\n      hasOpenAiKey\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation ExplainOperation($input: ExplainOperationInput!) {\n    explainOperation(input: $input) {\n      markdown\n      citations {\n        typeName\n        fieldName\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation ExplainOperation($input: ExplainOperationInput!) {\n    explainOperation(input: $input) {\n      markdown\n      citations {\n        typeName\n        fieldName\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation GenerateOperation($input: GenerateOperationInput!) {\n    generateOperation(input: $input) {\n      document\n      warnings\n    }\n  }\n"): (typeof documents)["\n  mutation GenerateOperation($input: GenerateOperationInput!) {\n    generateOperation(input: $input) {\n      document\n      warnings\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query ProjectSchemas($projectId: ID!) {\n    schemas(projectId: $projectId) {\n      id\n    }\n  }\n"): (typeof documents)["\n  query ProjectSchemas($projectId: ID!) {\n    schemas(projectId: $projectId) {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query SchemaVersionsBySchema($schemaId: ID!) {\n    schemaVersions(schemaId: $schemaId) {\n      id\n    }\n  }\n"): (typeof documents)["\n  query SchemaVersionsBySchema($schemaId: ID!) {\n    schemaVersions(schemaId: $schemaId) {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query EnvironmentsForExecute {\n    environments {\n      id\n      name\n      headers\n    }\n  }\n"): (typeof documents)["\n  query EnvironmentsForExecute {\n    environments {\n      id\n      name\n      headers\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query OperationForRun($id: ID!) {\n    operation(id: $id) {\n      id\n      name\n      content\n      projectId\n    }\n    environments {\n      id\n      name\n      headers\n    }\n  }\n"): (typeof documents)["\n  query OperationForRun($id: ID!) {\n    operation(id: $id) {\n      id\n      name\n      content\n      projectId\n    }\n    environments {\n      id\n      name\n      headers\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query CollectionItemForExecute($id: ID!) {\n    collectionItem(id: $id) {\n      id\n      name\n      queryContent\n      variablesJson\n      operationId\n      collectionId\n    }\n    environments {\n      id\n      name\n      headers\n    }\n  }\n"): (typeof documents)["\n  query CollectionItemForExecute($id: ID!) {\n    collectionItem(id: $id) {\n      id\n      name\n      queryContent\n      variablesJson\n      operationId\n      collectionId\n    }\n    environments {\n      id\n      name\n      headers\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation Execute($input: ExecuteOperationInput!) {\n    executeOperation(input: $input) {\n      responseBody\n      execution {\n        id\n        status\n        durationMs\n        httpStatus\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation Execute($input: ExecuteOperationInput!) {\n    executeOperation(input: $input) {\n      responseBody\n      execution {\n        id\n        status\n        durationMs\n        httpStatus\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query CollectionsForSave {\n    collections {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query CollectionsForSave {\n    collections {\n      id\n      name\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateCollectionForSave($name: String!) {\n    createCollection(name: $name) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation CreateCollectionForSave($name: String!) {\n    createCollection(name: $name) {\n      id\n      name\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation SaveToCollection($input: SaveToCollectionInput!) {\n    saveToCollection(input: $input) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation SaveToCollection($input: SaveToCollectionInput!) {\n    saveToCollection(input: $input) {\n      id\n      name\n    }\n  }\n"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;