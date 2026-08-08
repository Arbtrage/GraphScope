/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  JSON: { input: any; output: any; }
};

export type AiExplanation = {
  __typename?: 'AiExplanation';
  citations: Array<SchemaCitation>;
  markdown: Scalars['String']['output'];
};

export type AiGeneratedOperation = {
  __typename?: 'AiGeneratedOperation';
  document: Scalars['String']['output'];
  warnings: Array<Scalars['String']['output']>;
};

export enum AiRedactionMode {
  Full = 'FULL',
  Standard = 'STANDARD',
  Strict = 'STRICT'
}

export type AiSettings = {
  __typename?: 'AiSettings';
  enabled: Scalars['Boolean']['output'];
  hasOpenAiKey: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  monthlyTokenBudget: Scalars['Int']['output'];
  redactionMode: AiRedactionMode;
  tokensUsed: Scalars['Int']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  activeWorkspace?: Maybe<Workspace>;
  onboardingStatus?: Maybe<OnboardingStatus>;
  sessionToken: Scalars['String']['output'];
  user: User;
};

export type BootstrapWorkspaceInput = {
  createDefaultEnvironment?: InputMaybe<Scalars['Boolean']['input']>;
  projectName?: InputMaybe<Scalars['String']['input']>;
  workspaceName?: InputMaybe<Scalars['String']['input']>;
};

export type BootstrapWorkspacePayload = {
  __typename?: 'BootstrapWorkspacePayload';
  onboardingStatus: OnboardingStatus;
  project?: Maybe<Project>;
  workspace: Workspace;
};

export type CacheStatus = {
  __typename?: 'CacheStatus';
  connected: Scalars['Boolean']['output'];
  enabled: Scalars['Boolean']['output'];
};

export type Collection = {
  __typename?: 'Collection';
  id: Scalars['ID']['output'];
  items: Array<CollectionItem>;
  name: Scalars['String']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type CollectionItem = {
  __typename?: 'CollectionItem';
  collectionId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  operationId?: Maybe<Scalars['ID']['output']>;
  queryContent: Scalars['String']['output'];
  variablesJson: Scalars['String']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type CompositionStatus = {
  __typename?: 'CompositionStatus';
  errors: Array<Scalars['String']['output']>;
  mergedSdl?: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
  schemaCount: Scalars['Int']['output'];
};

export type CreateEnvironmentInput = {
  endpointUrl: Scalars['String']['input'];
  headers?: InputMaybe<Scalars['JSON']['input']>;
  isProduction?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
};

export type CreateProjectInput = {
  name: Scalars['String']['input'];
  slug: Scalars['String']['input'];
};

export type CreateWorkspaceInput = {
  name: Scalars['String']['input'];
  slug: Scalars['String']['input'];
};

export type DeviceFlowPayload = {
  __typename?: 'DeviceFlowPayload';
  deviceCode: Scalars['String']['output'];
  expiresIn: Scalars['Int']['output'];
  interval: Scalars['Int']['output'];
  userCode: Scalars['String']['output'];
  verificationUri: Scalars['String']['output'];
};

export type EnableRepositoryInput = {
  defaultBranch?: InputMaybe<Scalars['String']['input']>;
  githubRepo?: InputMaybe<Scalars['String']['input']>;
  localPath?: InputMaybe<Scalars['String']['input']>;
  projectId: Scalars['ID']['input'];
  sourceType: RepoSourceType;
};

export type Environment = {
  __typename?: 'Environment';
  endpointUrl: Scalars['String']['output'];
  headers: Scalars['JSON']['output'];
  id: Scalars['ID']['output'];
  isProduction: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type ExecuteOperationInput = {
  adhocQuery?: InputMaybe<Scalars['String']['input']>;
  environmentId: Scalars['ID']['input'];
  /** Temporary request headers merged on top of environment headers (request wins). */
  headers?: InputMaybe<Scalars['JSON']['input']>;
  operationId?: InputMaybe<Scalars['ID']['input']>;
  variables?: InputMaybe<Scalars['JSON']['input']>;
};

export type Execution = {
  __typename?: 'Execution';
  createdAt: Scalars['String']['output'];
  durationMs: Scalars['Int']['output'];
  environmentId?: Maybe<Scalars['ID']['output']>;
  graphqlErrorsCount: Scalars['Int']['output'];
  httpStatus?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  operationId?: Maybe<Scalars['ID']['output']>;
  responseBytes?: Maybe<Scalars['Int']['output']>;
  responsePreview?: Maybe<Scalars['String']['output']>;
  status: ExecutionStatus;
  workspaceId: Scalars['ID']['output'];
};

export type ExecutionPayload = {
  __typename?: 'ExecutionPayload';
  execution: Execution;
  responseBody: Scalars['String']['output'];
};

export enum ExecutionStatus {
  Blocked = 'BLOCKED',
  GraphqlError = 'GRAPHQL_ERROR',
  Success = 'SUCCESS',
  Timeout = 'TIMEOUT',
  TransportError = 'TRANSPORT_ERROR'
}

export type ExplainOperationInput = {
  operationContent?: InputMaybe<Scalars['String']['input']>;
  operationId?: InputMaybe<Scalars['ID']['input']>;
  projectId?: InputMaybe<Scalars['ID']['input']>;
  schemaVersionId?: InputMaybe<Scalars['ID']['input']>;
};

export enum FindingSeverity {
  Critical = 'CRITICAL',
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM'
}

export type GenerateOperationInput = {
  operationType?: InputMaybe<OperationType>;
  prompt: Scalars['String']['input'];
  schemaVersionId: Scalars['ID']['input'];
};

export type Health = {
  __typename?: 'Health';
  ok: Scalars['Boolean']['output'];
  version: Scalars['String']['output'];
};

export type Job = {
  __typename?: 'Job';
  attempts: Scalars['Int']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  jobType: Scalars['String']['output'];
  lastError?: Maybe<Scalars['String']['output']>;
  lockedAt?: Maybe<Scalars['String']['output']>;
  payload: Scalars['JSON']['output'];
  status: JobStatus;
  updatedAt: Scalars['String']['output'];
  workspaceId: Scalars['ID']['output'];
};

export enum JobStatus {
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Pending = 'PENDING',
  Running = 'RUNNING'
}

export type LocalSignInInput = {
  displayName: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  bootstrapWorkspace: BootstrapWorkspacePayload;
  createCollection: Collection;
  createEnvironment: Environment;
  createProject: Project;
  createWorkspace: Workspace;
  deleteCollection: Scalars['Boolean']['output'];
  deleteCollectionItem: Scalars['Boolean']['output'];
  deleteEnvironment: Scalars['Boolean']['output'];
  deleteProject: Scalars['Boolean']['output'];
  deleteSecret: Scalars['Boolean']['output'];
  disableRepository: RepositoryLink;
  enableRepository: RepositoryLink;
  executeOperation: ExecutionPayload;
  explainOperation: AiExplanation;
  generateOperation: AiGeneratedOperation;
  githubDeviceFlowPoll?: Maybe<AuthPayload>;
  githubDeviceFlowStart: DeviceFlowPayload;
  logout: Scalars['Boolean']['output'];
  publishSchema: SchemaVersion;
  reindexRepository: RepositoryLink;
  reindexSearch: ReindexSearchPayload;
  renameCollection: Collection;
  retryJob: Job;
  runSchemaCheck: SchemaCheck;
  saveGithubPat: Scalars['Boolean']['output'];
  saveNotifyWebhook: Scalars['Boolean']['output'];
  saveOpenAiKey: AiSettings;
  saveToCollection: CollectionItem;
  setOperationManualFlag: OperationDocument;
  signInLocal: AuthPayload;
  switchWorkspace: Workspace;
  updateAiSettings: AiSettings;
  updateEnvironment: Environment;
  updateProject: Project;
  upsertSecret: SecretMeta;
};


export type MutationBootstrapWorkspaceArgs = {
  input?: InputMaybe<BootstrapWorkspaceInput>;
};


export type MutationCreateCollectionArgs = {
  name: Scalars['String']['input'];
};


export type MutationCreateEnvironmentArgs = {
  input: CreateEnvironmentInput;
};


export type MutationCreateProjectArgs = {
  input: CreateProjectInput;
};


export type MutationCreateWorkspaceArgs = {
  input: CreateWorkspaceInput;
};


export type MutationDeleteCollectionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteCollectionItemArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEnvironmentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteProjectArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSecretArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDisableRepositoryArgs = {
  id: Scalars['ID']['input'];
};


export type MutationEnableRepositoryArgs = {
  input: EnableRepositoryInput;
};


export type MutationExecuteOperationArgs = {
  input: ExecuteOperationInput;
};


export type MutationExplainOperationArgs = {
  input: ExplainOperationInput;
};


export type MutationGenerateOperationArgs = {
  input: GenerateOperationInput;
};


export type MutationGithubDeviceFlowPollArgs = {
  deviceCode: Scalars['String']['input'];
};


export type MutationPublishSchemaArgs = {
  input: PublishSchemaInput;
};


export type MutationReindexRepositoryArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRenameCollectionArgs = {
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};


export type MutationRetryJobArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRunSchemaCheckArgs = {
  previousVersionId?: InputMaybe<Scalars['ID']['input']>;
  schemaVersionId: Scalars['ID']['input'];
};


export type MutationSaveGithubPatArgs = {
  token: Scalars['String']['input'];
};


export type MutationSaveNotifyWebhookArgs = {
  url: Scalars['String']['input'];
};


export type MutationSaveOpenAiKeyArgs = {
  apiKey: Scalars['String']['input'];
};


export type MutationSaveToCollectionArgs = {
  input: SaveToCollectionInput;
};


export type MutationSetOperationManualFlagArgs = {
  id: Scalars['ID']['input'];
  isOperation: Scalars['Boolean']['input'];
};


export type MutationSignInLocalArgs = {
  input: LocalSignInInput;
};


export type MutationSwitchWorkspaceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateAiSettingsArgs = {
  input: UpdateAiSettingsInput;
};


export type MutationUpdateEnvironmentArgs = {
  id: Scalars['ID']['input'];
  input: UpdateEnvironmentInput;
};


export type MutationUpdateProjectArgs = {
  id: Scalars['ID']['input'];
  input: UpdateProjectInput;
};


export type MutationUpsertSecretArgs = {
  input: UpsertSecretInput;
};

export enum OnboardingNextStep {
  AddEnvironment = 'ADD_ENVIRONMENT',
  ConnectRepo = 'CONNECT_REPO',
  CreateProject = 'CREATE_PROJECT',
  Done = 'DONE',
  PublishSchema = 'PUBLISH_SCHEMA',
  RunQuery = 'RUN_QUERY'
}

export type OnboardingStatus = {
  __typename?: 'OnboardingStatus';
  environmentCount: Scalars['Int']['output'];
  hasEnvironment: Scalars['Boolean']['output'];
  hasExecution: Scalars['Boolean']['output'];
  hasProject: Scalars['Boolean']['output'];
  hasPublishedSchema: Scalars['Boolean']['output'];
  hasRepository: Scalars['Boolean']['output'];
  lastExecutionAt?: Maybe<Scalars['String']['output']>;
  nextStep: OnboardingNextStep;
  operationCount: Scalars['Int']['output'];
  projectCount: Scalars['Int']['output'];
};

export type OperationDocument = {
  __typename?: 'OperationDocument';
  confidence: Scalars['Float']['output'];
  content: Scalars['String']['output'];
  contentHash: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isManual: Scalars['Boolean']['output'];
  locations: Array<OperationSourceLocation>;
  name?: Maybe<Scalars['String']['output']>;
  operationType: OperationType;
  projectId: Scalars['ID']['output'];
  projectName?: Maybe<Scalars['String']['output']>;
  workspaceId: Scalars['ID']['output'];
};

export type OperationFinding = {
  __typename?: 'OperationFinding';
  id: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  path?: Maybe<Scalars['String']['output']>;
  ruleId: Scalars['String']['output'];
  severity: FindingSeverity;
};

export type OperationSourceLocation = {
  __typename?: 'OperationSourceLocation';
  endLine: Scalars['Int']['output'];
  githubUrl?: Maybe<Scalars['String']['output']>;
  path: Scalars['String']['output'];
  startLine: Scalars['Int']['output'];
};

export enum OperationType {
  Mutation = 'MUTATION',
  Query = 'QUERY',
  Subscription = 'SUBSCRIPTION'
}

export type OperationsFilter = {
  operationType?: InputMaybe<OperationType>;
  projectId?: InputMaybe<Scalars['ID']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type Project = {
  __typename?: 'Project';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type PublishSchemaInput = {
  gitSha?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
  sdl: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  activeWorkspace?: Maybe<Workspace>;
  aiSettings?: Maybe<AiSettings>;
  cacheStatus: CacheStatus;
  collection?: Maybe<Collection>;
  collectionItem?: Maybe<CollectionItem>;
  collections: Array<Collection>;
  environment?: Maybe<Environment>;
  environments: Array<Environment>;
  executions: Array<Execution>;
  health: Health;
  jobs: Array<Job>;
  me?: Maybe<User>;
  onboardingStatus: OnboardingStatus;
  operation?: Maybe<OperationDocument>;
  operationFindings: Array<OperationFinding>;
  operations: Array<OperationDocument>;
  operationsForWorkspace: Array<OperationDocument>;
  project?: Maybe<Project>;
  projects: Array<Project>;
  repositoryLinks: Array<RepositoryLink>;
  schema?: Maybe<Schema>;
  schemaVersions: Array<SchemaVersion>;
  schemas: Array<Schema>;
  search: Array<SearchResult>;
  secrets: Array<SecretMeta>;
  workspace?: Maybe<Workspace>;
  workspaceComposition: CompositionStatus;
  workspaceDashboard: WorkspaceDashboard;
  workspaceStats: WorkspaceStats;
  workspaces: Array<Workspace>;
};


export type QueryCollectionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCollectionItemArgs = {
  id: Scalars['ID']['input'];
};


export type QueryEnvironmentArgs = {
  id: Scalars['ID']['input'];
};


export type QueryExecutionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryJobsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryOperationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryOperationFindingsArgs = {
  operationId: Scalars['ID']['input'];
};


export type QueryOperationsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  projectId: Scalars['ID']['input'];
};


export type QueryOperationsForWorkspaceArgs = {
  filter?: InputMaybe<OperationsFilter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryProjectArgs = {
  id: Scalars['ID']['input'];
};


export type QueryRepositoryLinksArgs = {
  projectId: Scalars['ID']['input'];
};


export type QuerySchemaArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySchemaVersionsArgs = {
  schemaId: Scalars['ID']['input'];
};


export type QuerySchemasArgs = {
  projectId: Scalars['ID']['input'];
};


export type QuerySearchArgs = {
  kinds?: InputMaybe<Array<SearchResultKind>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  q: Scalars['String']['input'];
};


export type QuerySecretsArgs = {
  environmentId: Scalars['ID']['input'];
};


export type QueryWorkspaceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryWorkspaceCompositionArgs = {
  projectId: Scalars['ID']['input'];
};


export type QueryWorkspaceDashboardArgs = {
  workspaceId: Scalars['ID']['input'];
};

export type ReindexSearchPayload = {
  __typename?: 'ReindexSearchPayload';
  documentCount: Scalars['Int']['output'];
  ok: Scalars['Boolean']['output'];
};

export enum RepoSourceType {
  Github = 'GITHUB',
  Local = 'LOCAL'
}

export enum RepoSyncStatus {
  Connected = 'CONNECTED',
  Disabled = 'DISABLED',
  Error = 'ERROR',
  Indexed = 'INDEXED',
  Syncing = 'SYNCING'
}

export type RepositoryLink = {
  __typename?: 'RepositoryLink';
  defaultBranch: Scalars['String']['output'];
  githubRepo?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastError?: Maybe<Scalars['String']['output']>;
  lastIndexedSha?: Maybe<Scalars['String']['output']>;
  localPath?: Maybe<Scalars['String']['output']>;
  projectId: Scalars['ID']['output'];
  sourceType: RepoSourceType;
  status: RepoSyncStatus;
  workspaceId: Scalars['ID']['output'];
};

export type SaveToCollectionInput = {
  collectionId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  operationId?: InputMaybe<Scalars['ID']['input']>;
  queryContent: Scalars['String']['input'];
  variablesJson?: InputMaybe<Scalars['String']['input']>;
};

export type Schema = {
  __typename?: 'Schema';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  projectId: Scalars['ID']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type SchemaCheck = {
  __typename?: 'SchemaCheck';
  breakingCount: Scalars['Int']['output'];
  dangerousCount: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  result?: Maybe<SchemaCheckResult>;
  schemaVersionId: Scalars['ID']['output'];
  status: SchemaCheckStatus;
};

export enum SchemaCheckResult {
  Breaking = 'BREAKING',
  Dangerous = 'DANGEROUS',
  Safe = 'SAFE'
}

export enum SchemaCheckStatus {
  Error = 'ERROR',
  Failed = 'FAILED',
  Passed = 'PASSED',
  Pending = 'PENDING',
  Running = 'RUNNING'
}

export type SchemaCitation = {
  __typename?: 'SchemaCitation';
  fieldName?: Maybe<Scalars['String']['output']>;
  typeName: Scalars['String']['output'];
};

export type SchemaVersion = {
  __typename?: 'SchemaVersion';
  checks: Array<SchemaCheck>;
  contentHash: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  gitSha?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  schemaId: Scalars['ID']['output'];
  sdl: Scalars['String']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type SearchResult = {
  __typename?: 'SearchResult';
  href: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  kind: SearchResultKind;
  score: Scalars['Float']['output'];
  subtitle?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export enum SearchResultKind {
  Collection = 'COLLECTION',
  Field = 'FIELD',
  Operation = 'OPERATION',
  Project = 'PROJECT',
  Repository = 'REPOSITORY',
  Type = 'TYPE'
}

export type SecretMeta = {
  __typename?: 'SecretMeta';
  environmentId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  lastFour: Scalars['String']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type UpdateAiSettingsInput = {
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  monthlyTokenBudget?: InputMaybe<Scalars['Int']['input']>;
  redactionMode?: InputMaybe<AiRedactionMode>;
};

export type UpdateEnvironmentInput = {
  endpointUrl?: InputMaybe<Scalars['String']['input']>;
  headers?: InputMaybe<Scalars['JSON']['input']>;
  isProduction?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateProjectInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertSecretInput = {
  environmentId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type User = {
  __typename?: 'User';
  githubLogin?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
};

export type Workspace = {
  __typename?: 'Workspace';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
};

export type WorkspaceDashboard = {
  __typename?: 'WorkspaceDashboard';
  checksFailed7d: Scalars['Int']['output'];
  execP50Ms?: Maybe<Scalars['Float']['output']>;
  execP95Ms?: Maybe<Scalars['Float']['output']>;
  openHighFindings: Scalars['Int']['output'];
  operationCount: Scalars['Int']['output'];
};

export type WorkspaceStats = {
  __typename?: 'WorkspaceStats';
  environmentCount: Scalars['Int']['output'];
  lastExecutionAt?: Maybe<Scalars['String']['output']>;
  operationCount: Scalars['Int']['output'];
  projectCount: Scalars['Int']['output'];
};

export type AnalyticsDashboardQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type AnalyticsDashboardQuery = { __typename?: 'Query', activeWorkspace?: { __typename?: 'Workspace', id: string, name: string } | null, workspaceDashboard: { __typename?: 'WorkspaceDashboard', operationCount: number, openHighFindings: number, checksFailed7d: number, execP50Ms?: number | null, execP95Ms?: number | null }, operationsForWorkspace: Array<{ __typename?: 'OperationDocument', id: string, name?: string | null, operationType: OperationType, projectName?: string | null }> };

export type ActiveWorkspaceQueryVariables = Exact<{ [key: string]: never; }>;


export type ActiveWorkspaceQuery = { __typename?: 'Query', activeWorkspace?: { __typename?: 'Workspace', id: string, name: string } | null };

export type CollectionsQueryVariables = Exact<{ [key: string]: never; }>;


export type CollectionsQuery = { __typename?: 'Query', collections: Array<{ __typename?: 'Collection', id: string, name: string, items: Array<{ __typename?: 'CollectionItem', id: string, name: string, operationId?: string | null, queryContent: string }> }> };

export type CreateCollectionMutationVariables = Exact<{
  name: Scalars['String']['input'];
}>;


export type CreateCollectionMutation = { __typename?: 'Mutation', createCollection: { __typename?: 'Collection', id: string } };

export type RenameCollectionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
}>;


export type RenameCollectionMutation = { __typename?: 'Mutation', renameCollection: { __typename?: 'Collection', id: string } };

export type DeleteCollectionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteCollectionMutation = { __typename?: 'Mutation', deleteCollection: boolean };

export type DeleteCollectionItemMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteCollectionItemMutation = { __typename?: 'Mutation', deleteCollectionItem: boolean };

export type EnvironmentsQueryVariables = Exact<{ [key: string]: never; }>;


export type EnvironmentsQuery = { __typename?: 'Query', environments: Array<{ __typename?: 'Environment', id: string, name: string, endpointUrl: string, isProduction: boolean, headers: any }> };

export type SecretsQueryVariables = Exact<{
  environmentId: Scalars['ID']['input'];
}>;


export type SecretsQuery = { __typename?: 'Query', secrets: Array<{ __typename?: 'SecretMeta', id: string, name: string, lastFour: string, updatedAt: string }> };

export type CreateEnvMutationVariables = Exact<{
  input: CreateEnvironmentInput;
}>;


export type CreateEnvMutation = { __typename?: 'Mutation', createEnvironment: { __typename?: 'Environment', id: string } };

export type UpdateEnvMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateEnvironmentInput;
}>;


export type UpdateEnvMutation = { __typename?: 'Mutation', updateEnvironment: { __typename?: 'Environment', id: string } };

export type UpsertSecretMutationVariables = Exact<{
  input: UpsertSecretInput;
}>;


export type UpsertSecretMutation = { __typename?: 'Mutation', upsertSecret: { __typename?: 'SecretMeta', id: string } };

export type TestConnectionMutationVariables = Exact<{
  input: ExecuteOperationInput;
}>;


export type TestConnectionMutation = { __typename?: 'Mutation', executeOperation: { __typename?: 'ExecutionPayload', execution: { __typename?: 'Execution', status: ExecutionStatus } } };

export type HistoryQueryVariables = Exact<{ [key: string]: never; }>;


export type HistoryQuery = { __typename?: 'Query', executions: Array<{ __typename?: 'Execution', id: string, status: ExecutionStatus, durationMs: number, createdAt: string, httpStatus?: number | null, operationId?: string | null, responsePreview?: string | null }> };

export type JobsQueryVariables = Exact<{ [key: string]: never; }>;


export type JobsQuery = { __typename?: 'Query', jobs: Array<{ __typename?: 'Job', id: string, jobType: string, status: JobStatus, createdAt: string, updatedAt: string, attempts: number, lastError?: string | null, payload: any }> };

export type RetryJobMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RetryJobMutation = { __typename?: 'Mutation', retryJob: { __typename?: 'Job', id: string, status: JobStatus } };

export type OperationDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type OperationDetailQuery = { __typename?: 'Query', operation?: { __typename?: 'OperationDocument', id: string, name?: string | null, operationType: OperationType, content: string, confidence: number, projectId: string, projectName?: string | null, locations: Array<{ __typename?: 'OperationSourceLocation', path: string, startLine: number, endLine: number, githubUrl?: string | null }> } | null, projects: Array<{ __typename?: 'Project', id: string, name: string }>, aiSettings?: { __typename?: 'AiSettings', redactionMode: AiRedactionMode, enabled: boolean, hasOpenAiKey: boolean } | null };

export type ProjectSchemasForOpQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type ProjectSchemasForOpQuery = { __typename?: 'Query', schemas: Array<{ __typename?: 'Schema', id: string }> };

export type SchemaVersionsForOpQueryVariables = Exact<{
  schemaId: Scalars['ID']['input'];
}>;


export type SchemaVersionsForOpQuery = { __typename?: 'Query', schemaVersions: Array<{ __typename?: 'SchemaVersion', id: string }> };

export type OperationFindingsQueryVariables = Exact<{
  operationId: Scalars['ID']['input'];
}>;


export type OperationFindingsQuery = { __typename?: 'Query', operationFindings: Array<{ __typename?: 'OperationFinding', id: string, ruleId: string, severity: FindingSeverity, message: string, path?: string | null }> };

export type ExplainOperationDetailMutationVariables = Exact<{
  input: ExplainOperationInput;
}>;


export type ExplainOperationDetailMutation = { __typename?: 'Mutation', explainOperation: { __typename?: 'AiExplanation', markdown: string, citations: Array<{ __typename?: 'SchemaCitation', typeName: string, fieldName?: string | null }> } };

export type GenerateOperationDetailMutationVariables = Exact<{
  input: GenerateOperationInput;
}>;


export type GenerateOperationDetailMutation = { __typename?: 'Mutation', generateOperation: { __typename?: 'AiGeneratedOperation', document: string, warnings: Array<string> } };

export type OperationsBrowserQueryVariables = Exact<{
  filter?: InputMaybe<OperationsFilter>;
}>;


export type OperationsBrowserQuery = { __typename?: 'Query', projects: Array<{ __typename?: 'Project', id: string, name: string }>, operationsForWorkspace: Array<{ __typename?: 'OperationDocument', id: string, name?: string | null, operationType: OperationType, confidence: number, projectId: string, projectName?: string | null }> };

export type DashboardHomeQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardHomeQuery = { __typename?: 'Query', health: { __typename?: 'Health', ok: boolean, version: string }, onboardingStatus: { __typename?: 'OnboardingStatus', hasProject: boolean, hasRepository: boolean, hasPublishedSchema: boolean, hasEnvironment: boolean, hasExecution: boolean, nextStep: OnboardingNextStep, projectCount: number, environmentCount: number, operationCount: number, lastExecutionAt?: string | null }, executions: Array<{ __typename?: 'Execution', id: string, status: ExecutionStatus, durationMs: number, createdAt: string, operationId?: string | null }> };

export type QuickStartBootstrapMutationVariables = Exact<{
  input?: InputMaybe<BootstrapWorkspaceInput>;
}>;


export type QuickStartBootstrapMutation = { __typename?: 'Mutation', bootstrapWorkspace: { __typename?: 'BootstrapWorkspacePayload', onboardingStatus: { __typename?: 'OnboardingStatus', nextStep: OnboardingNextStep, projectCount: number, environmentCount: number } } };

export type ProjectDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ProjectDetailQuery = { __typename?: 'Query', project?: { __typename?: 'Project', id: string, name: string, slug: string } | null, schemas: Array<{ __typename?: 'Schema', id: string, name: string }>, repositoryLinks: Array<{ __typename?: 'RepositoryLink', id: string, sourceType: RepoSourceType, localPath?: string | null, githubRepo?: string | null, status: RepoSyncStatus }>, operations: Array<{ __typename?: 'OperationDocument', id: string, name?: string | null, operationType: OperationType, confidence: number }> };

export type ProjectCompositionQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type ProjectCompositionQuery = { __typename?: 'Query', workspaceComposition: { __typename?: 'CompositionStatus', ok: boolean, errors: Array<string>, schemaCount: number } };

export type PublishSchemaMutationVariables = Exact<{
  input: PublishSchemaInput;
}>;


export type PublishSchemaMutation = { __typename?: 'Mutation', publishSchema: { __typename?: 'SchemaVersion', id: string } };

export type EnableRepoMutationVariables = Exact<{
  input: EnableRepositoryInput;
}>;


export type EnableRepoMutation = { __typename?: 'Mutation', enableRepository: { __typename?: 'RepositoryLink', id: string } };

export type ReindexMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ReindexMutation = { __typename?: 'Mutation', reindexRepository: { __typename?: 'RepositoryLink', id: string } };

export type SchemaDetailQueryVariables = Exact<{
  schemaId: Scalars['ID']['input'];
  projectId: Scalars['ID']['input'];
}>;


export type SchemaDetailQuery = { __typename?: 'Query', project?: { __typename?: 'Project', id: string, name: string } | null, schema?: { __typename?: 'Schema', id: string, name: string } | null, schemaVersions: Array<{ __typename?: 'SchemaVersion', id: string, contentHash: string, createdAt: string, sdl: string, checks: Array<{ __typename?: 'SchemaCheck', status: SchemaCheckStatus, result?: SchemaCheckResult | null }> }> };

export type RunCheckMutationVariables = Exact<{
  schemaVersionId: Scalars['ID']['input'];
  previousVersionId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type RunCheckMutation = { __typename?: 'Mutation', runSchemaCheck: { __typename?: 'SchemaCheck', id: string, status: SchemaCheckStatus } };

export type ProjectsQueryVariables = Exact<{ [key: string]: never; }>;


export type ProjectsQuery = { __typename?: 'Query', projects: Array<{ __typename?: 'Project', id: string, name: string, slug: string }> };

export type CreateProjectMutationVariables = Exact<{
  input: CreateProjectInput;
}>;


export type CreateProjectMutation = { __typename?: 'Mutation', createProject: { __typename?: 'Project', id: string } };

export type ProjectsForVoyagerQueryVariables = Exact<{ [key: string]: never; }>;


export type ProjectsForVoyagerQuery = { __typename?: 'Query', projects: Array<{ __typename?: 'Project', id: string, name: string }> };

export type SchemasForVoyagerQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type SchemasForVoyagerQuery = { __typename?: 'Query', schemas: Array<{ __typename?: 'Schema', id: string, name: string }> };

export type SchemaVersionsForVoyagerQueryVariables = Exact<{
  schemaId: Scalars['ID']['input'];
}>;


export type SchemaVersionsForVoyagerQuery = { __typename?: 'Query', schemaVersions: Array<{ __typename?: 'SchemaVersion', id: string, sdl: string, createdAt: string }> };

export type SearchPageQueryVariables = Exact<{
  q: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type SearchPageQuery = { __typename?: 'Query', search: Array<{ __typename?: 'SearchResult', kind: SearchResultKind, id: string, title: string, subtitle?: string | null, href: string, score: number }> };

export type StartDeviceFlowMutationVariables = Exact<{ [key: string]: never; }>;


export type StartDeviceFlowMutation = { __typename?: 'Mutation', githubDeviceFlowStart: { __typename?: 'DeviceFlowPayload', deviceCode: string, userCode: string, verificationUri: string, expiresIn: number, interval: number } };

export type PollDeviceFlowMutationVariables = Exact<{
  deviceCode: Scalars['String']['input'];
}>;


export type PollDeviceFlowMutation = { __typename?: 'Mutation', githubDeviceFlowPoll?: { __typename?: 'AuthPayload', sessionToken: string, user: { __typename?: 'User', id: string, githubLogin?: string | null, name?: string | null }, activeWorkspace?: { __typename?: 'Workspace', id: string, name: string } | null, onboardingStatus?: { __typename?: 'OnboardingStatus', nextStep: OnboardingNextStep } | null } | null };

export type SignInLocalMutationVariables = Exact<{
  input: LocalSignInInput;
}>;


export type SignInLocalMutation = { __typename?: 'Mutation', signInLocal: { __typename?: 'AuthPayload', sessionToken: string, user: { __typename?: 'User', id: string, name?: string | null, githubLogin?: string | null }, activeWorkspace?: { __typename?: 'Workspace', id: string, name: string } | null, onboardingStatus?: { __typename?: 'OnboardingStatus', nextStep: OnboardingNextStep } | null } };

export type BootstrapWorkspaceMutationVariables = Exact<{
  input?: InputMaybe<BootstrapWorkspaceInput>;
}>;


export type BootstrapWorkspaceMutation = { __typename?: 'Mutation', bootstrapWorkspace: { __typename?: 'BootstrapWorkspacePayload', workspace: { __typename?: 'Workspace', id: string, name: string }, onboardingStatus: { __typename?: 'OnboardingStatus', nextStep: OnboardingNextStep } } };

export type MeLoginQueryVariables = Exact<{ [key: string]: never; }>;


export type MeLoginQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string } | null };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string, githubLogin?: string | null, name?: string | null } | null, activeWorkspace?: { __typename?: 'Workspace', id: string, name: string, slug: string } | null, workspaces: Array<{ __typename?: 'Workspace', id: string, name: string, slug: string }>, environments: Array<{ __typename?: 'Environment', id: string, name: string }> };

export type SwitchWorkspaceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SwitchWorkspaceMutation = { __typename?: 'Mutation', switchWorkspace: { __typename?: 'Workspace', id: string, name: string, slug: string } };

export type CreateWorkspaceMutationVariables = Exact<{
  input: CreateWorkspaceInput;
}>;


export type CreateWorkspaceMutation = { __typename?: 'Mutation', createWorkspace: { __typename?: 'Workspace', id: string, name: string, slug: string } };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { __typename?: 'Mutation', logout: boolean };

export type SaveGithubPatMutationVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type SaveGithubPatMutation = { __typename?: 'Mutation', saveGithubPat: boolean };

export type AiSettingsForLayoutQueryVariables = Exact<{ [key: string]: never; }>;


export type AiSettingsForLayoutQuery = { __typename?: 'Query', aiSettings?: { __typename?: 'AiSettings', redactionMode: AiRedactionMode, enabled: boolean, hasOpenAiKey: boolean } | null };

export type UpdateAiSettingsMutationVariables = Exact<{
  input: UpdateAiSettingsInput;
}>;


export type UpdateAiSettingsMutation = { __typename?: 'Mutation', updateAiSettings: { __typename?: 'AiSettings', redactionMode: AiRedactionMode, enabled: boolean, hasOpenAiKey: boolean } };

export type SaveOpenAiKeyMutationVariables = Exact<{
  apiKey: Scalars['String']['input'];
}>;


export type SaveOpenAiKeyMutation = { __typename?: 'Mutation', saveOpenAiKey: { __typename?: 'AiSettings', hasOpenAiKey: boolean, redactionMode: AiRedactionMode, enabled: boolean } };

export type CacheStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type CacheStatusQuery = { __typename?: 'Query', cacheStatus: { __typename?: 'CacheStatus', enabled: boolean, connected: boolean } };

export type SaveNotifyWebhookMutationVariables = Exact<{
  url: Scalars['String']['input'];
}>;


export type SaveNotifyWebhookMutation = { __typename?: 'Mutation', saveNotifyWebhook: boolean };

export type GlobalSearchQueryVariables = Exact<{
  q: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GlobalSearchQuery = { __typename?: 'Query', search: Array<{ __typename?: 'SearchResult', kind: SearchResultKind, id: string, title: string, subtitle?: string | null, href: string, score: number }> };

export type AiSettingsForExecuteQueryVariables = Exact<{ [key: string]: never; }>;


export type AiSettingsForExecuteQuery = { __typename?: 'Query', aiSettings?: { __typename?: 'AiSettings', redactionMode: AiRedactionMode, enabled: boolean, hasOpenAiKey: boolean } | null };

export type ExplainOperationMutationVariables = Exact<{
  input: ExplainOperationInput;
}>;


export type ExplainOperationMutation = { __typename?: 'Mutation', explainOperation: { __typename?: 'AiExplanation', markdown: string, citations: Array<{ __typename?: 'SchemaCitation', typeName: string, fieldName?: string | null }> } };

export type GenerateOperationMutationVariables = Exact<{
  input: GenerateOperationInput;
}>;


export type GenerateOperationMutation = { __typename?: 'Mutation', generateOperation: { __typename?: 'AiGeneratedOperation', document: string, warnings: Array<string> } };

export type ProjectSchemasQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type ProjectSchemasQuery = { __typename?: 'Query', schemas: Array<{ __typename?: 'Schema', id: string }> };

export type SchemaVersionsBySchemaQueryVariables = Exact<{
  schemaId: Scalars['ID']['input'];
}>;


export type SchemaVersionsBySchemaQuery = { __typename?: 'Query', schemaVersions: Array<{ __typename?: 'SchemaVersion', id: string }> };

export type EnvironmentsForExecuteQueryVariables = Exact<{ [key: string]: never; }>;


export type EnvironmentsForExecuteQuery = { __typename?: 'Query', environments: Array<{ __typename?: 'Environment', id: string, name: string, headers: any }> };

export type OperationForRunQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type OperationForRunQuery = { __typename?: 'Query', operation?: { __typename?: 'OperationDocument', id: string, name?: string | null, content: string, projectId: string } | null, environments: Array<{ __typename?: 'Environment', id: string, name: string, headers: any }> };

export type CollectionItemForExecuteQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type CollectionItemForExecuteQuery = { __typename?: 'Query', collectionItem?: { __typename?: 'CollectionItem', id: string, name: string, queryContent: string, variablesJson: string, operationId?: string | null, collectionId: string } | null, environments: Array<{ __typename?: 'Environment', id: string, name: string, headers: any }> };

export type ExecuteMutationVariables = Exact<{
  input: ExecuteOperationInput;
}>;


export type ExecuteMutation = { __typename?: 'Mutation', executeOperation: { __typename?: 'ExecutionPayload', responseBody: string, execution: { __typename?: 'Execution', id: string, status: ExecutionStatus, durationMs: number, httpStatus?: number | null } } };

export type CollectionsForSaveQueryVariables = Exact<{ [key: string]: never; }>;


export type CollectionsForSaveQuery = { __typename?: 'Query', collections: Array<{ __typename?: 'Collection', id: string, name: string }> };

export type CreateCollectionForSaveMutationVariables = Exact<{
  name: Scalars['String']['input'];
}>;


export type CreateCollectionForSaveMutation = { __typename?: 'Mutation', createCollection: { __typename?: 'Collection', id: string, name: string } };

export type SaveToCollectionMutationVariables = Exact<{
  input: SaveToCollectionInput;
}>;


export type SaveToCollectionMutation = { __typename?: 'Mutation', saveToCollection: { __typename?: 'CollectionItem', id: string, name: string } };


export const AnalyticsDashboardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AnalyticsDashboard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeWorkspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"workspaceDashboard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"operationCount"}},{"kind":"Field","name":{"kind":"Name","value":"openHighFindings"}},{"kind":"Field","name":{"kind":"Name","value":"checksFailed7d"}},{"kind":"Field","name":{"kind":"Name","value":"execP50Ms"}},{"kind":"Field","name":{"kind":"Name","value":"execP95Ms"}}]}},{"kind":"Field","name":{"kind":"Name","value":"operationsForWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"operationType"}},{"kind":"Field","name":{"kind":"Name","value":"projectName"}}]}}]}}]} as unknown as DocumentNode<AnalyticsDashboardQuery, AnalyticsDashboardQueryVariables>;
export const ActiveWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ActiveWorkspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeWorkspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ActiveWorkspaceQuery, ActiveWorkspaceQueryVariables>;
export const CollectionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Collections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"collections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"operationId"}},{"kind":"Field","name":{"kind":"Name","value":"queryContent"}}]}}]}}]}}]} as unknown as DocumentNode<CollectionsQuery, CollectionsQueryVariables>;
export const CreateCollectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCollection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateCollectionMutation, CreateCollectionMutationVariables>;
export const RenameCollectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RenameCollection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"renameCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<RenameCollectionMutation, RenameCollectionMutationVariables>;
export const DeleteCollectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteCollection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteCollectionMutation, DeleteCollectionMutationVariables>;
export const DeleteCollectionItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteCollectionItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCollectionItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteCollectionItemMutation, DeleteCollectionItemMutationVariables>;
export const EnvironmentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Environments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"environments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"endpointUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isProduction"}},{"kind":"Field","name":{"kind":"Name","value":"headers"}}]}}]}}]} as unknown as DocumentNode<EnvironmentsQuery, EnvironmentsQueryVariables>;
export const SecretsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Secrets"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"secrets"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"environmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"environmentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"lastFour"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<SecretsQuery, SecretsQueryVariables>;
export const CreateEnvDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEnv"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEnvironmentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEnvironment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateEnvMutation, CreateEnvMutationVariables>;
export const UpdateEnvDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateEnv"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateEnvironmentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEnvironment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateEnvMutation, UpdateEnvMutationVariables>;
export const UpsertSecretDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertSecret"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertSecretInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertSecret"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpsertSecretMutation, UpsertSecretMutationVariables>;
export const TestConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ExecuteOperationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"executeOperation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"execution"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]} as unknown as DocumentNode<TestConnectionMutation, TestConnectionMutationVariables>;
export const HistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"History"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"executions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"50"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"durationMs"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"httpStatus"}},{"kind":"Field","name":{"kind":"Name","value":"operationId"}},{"kind":"Field","name":{"kind":"Name","value":"responsePreview"}}]}}]}}]} as unknown as DocumentNode<HistoryQuery, HistoryQueryVariables>;
export const JobsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Jobs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"50"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobType"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"attempts"}},{"kind":"Field","name":{"kind":"Name","value":"lastError"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}}]}}]}}]} as unknown as DocumentNode<JobsQuery, JobsQueryVariables>;
export const RetryJobDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RetryJob"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"retryJob"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<RetryJobMutation, RetryJobMutationVariables>;
export const OperationDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OperationDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"operation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"operationType"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"confidence"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"projectName"}},{"kind":"Field","name":{"kind":"Name","value":"locations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"startLine"}},{"kind":"Field","name":{"kind":"Name","value":"endLine"}},{"kind":"Field","name":{"kind":"Name","value":"githubUrl"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"projects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"aiSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"redactionMode"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"hasOpenAiKey"}}]}}]}}]} as unknown as DocumentNode<OperationDetailQuery, OperationDetailQueryVariables>;
export const ProjectSchemasForOpDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectSchemasForOp"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schemas"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ProjectSchemasForOpQuery, ProjectSchemasForOpQueryVariables>;
export const SchemaVersionsForOpDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SchemaVersionsForOp"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schemaId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schemaVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schemaId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schemaId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<SchemaVersionsForOpQuery, SchemaVersionsForOpQueryVariables>;
export const OperationFindingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OperationFindings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"operationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"operationFindings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"operationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"operationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"ruleId"}},{"kind":"Field","name":{"kind":"Name","value":"severity"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"path"}}]}}]}}]} as unknown as DocumentNode<OperationFindingsQuery, OperationFindingsQueryVariables>;
export const ExplainOperationDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ExplainOperationDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ExplainOperationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"explainOperation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markdown"}},{"kind":"Field","name":{"kind":"Name","value":"citations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"typeName"}},{"kind":"Field","name":{"kind":"Name","value":"fieldName"}}]}}]}}]}}]} as unknown as DocumentNode<ExplainOperationDetailMutation, ExplainOperationDetailMutationVariables>;
export const GenerateOperationDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GenerateOperationDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GenerateOperationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateOperation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"document"}},{"kind":"Field","name":{"kind":"Name","value":"warnings"}}]}}]}}]} as unknown as DocumentNode<GenerateOperationDetailMutation, GenerateOperationDetailMutationVariables>;
export const OperationsBrowserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OperationsBrowser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OperationsFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"operationsForWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"operationType"}},{"kind":"Field","name":{"kind":"Name","value":"confidence"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"projectName"}}]}}]}}]} as unknown as DocumentNode<OperationsBrowserQuery, OperationsBrowserQueryVariables>;
export const DashboardHomeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DashboardHome"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"health"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ok"}},{"kind":"Field","name":{"kind":"Name","value":"version"}}]}},{"kind":"Field","name":{"kind":"Name","value":"onboardingStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasProject"}},{"kind":"Field","name":{"kind":"Name","value":"hasRepository"}},{"kind":"Field","name":{"kind":"Name","value":"hasPublishedSchema"}},{"kind":"Field","name":{"kind":"Name","value":"hasEnvironment"}},{"kind":"Field","name":{"kind":"Name","value":"hasExecution"}},{"kind":"Field","name":{"kind":"Name","value":"nextStep"}},{"kind":"Field","name":{"kind":"Name","value":"projectCount"}},{"kind":"Field","name":{"kind":"Name","value":"environmentCount"}},{"kind":"Field","name":{"kind":"Name","value":"operationCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastExecutionAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"executions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"8"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"durationMs"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"operationId"}}]}}]}}]} as unknown as DocumentNode<DashboardHomeQuery, DashboardHomeQueryVariables>;
export const QuickStartBootstrapDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"QuickStartBootstrap"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BootstrapWorkspaceInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bootstrapWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onboardingStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nextStep"}},{"kind":"Field","name":{"kind":"Name","value":"projectCount"}},{"kind":"Field","name":{"kind":"Name","value":"environmentCount"}}]}}]}}]}}]} as unknown as DocumentNode<QuickStartBootstrapMutation, QuickStartBootstrapMutationVariables>;
export const ProjectDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}},{"kind":"Field","name":{"kind":"Name","value":"schemas"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"repositoryLinks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"localPath"}},{"kind":"Field","name":{"kind":"Name","value":"githubRepo"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"operations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"operationType"}},{"kind":"Field","name":{"kind":"Name","value":"confidence"}}]}}]}}]} as unknown as DocumentNode<ProjectDetailQuery, ProjectDetailQueryVariables>;
export const ProjectCompositionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectComposition"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceComposition"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ok"}},{"kind":"Field","name":{"kind":"Name","value":"errors"}},{"kind":"Field","name":{"kind":"Name","value":"schemaCount"}}]}}]}}]} as unknown as DocumentNode<ProjectCompositionQuery, ProjectCompositionQueryVariables>;
export const PublishSchemaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PublishSchema"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PublishSchemaInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishSchema"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<PublishSchemaMutation, PublishSchemaMutationVariables>;
export const EnableRepoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EnableRepo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EnableRepositoryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enableRepository"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<EnableRepoMutation, EnableRepoMutationVariables>;
export const ReindexDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Reindex"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reindexRepository"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ReindexMutation, ReindexMutationVariables>;
export const SchemaDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SchemaDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schemaId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"schema"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schemaId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"schemaVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schemaId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schemaId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contentHash"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"sdl"}},{"kind":"Field","name":{"kind":"Name","value":"checks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"result"}}]}}]}}]}}]} as unknown as DocumentNode<SchemaDetailQuery, SchemaDetailQueryVariables>;
export const RunCheckDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RunCheck"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schemaVersionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"previousVersionId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runSchemaCheck"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schemaVersionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schemaVersionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"previousVersionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"previousVersionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<RunCheckMutation, RunCheckMutationVariables>;
export const ProjectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Projects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]} as unknown as DocumentNode<ProjectsQuery, ProjectsQueryVariables>;
export const CreateProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateProjectInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateProjectMutation, CreateProjectMutationVariables>;
export const ProjectsForVoyagerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectsForVoyager"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ProjectsForVoyagerQuery, ProjectsForVoyagerQueryVariables>;
export const SchemasForVoyagerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SchemasForVoyager"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schemas"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<SchemasForVoyagerQuery, SchemasForVoyagerQueryVariables>;
export const SchemaVersionsForVoyagerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SchemaVersionsForVoyager"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schemaId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schemaVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schemaId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schemaId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sdl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<SchemaVersionsForVoyagerQuery, SchemaVersionsForVoyagerQueryVariables>;
export const SearchPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"q"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"q"},"value":{"kind":"Variable","name":{"kind":"Name","value":"q"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"subtitle"}},{"kind":"Field","name":{"kind":"Name","value":"href"}},{"kind":"Field","name":{"kind":"Name","value":"score"}}]}}]}}]} as unknown as DocumentNode<SearchPageQuery, SearchPageQueryVariables>;
export const StartDeviceFlowDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StartDeviceFlow"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"githubDeviceFlowStart"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceCode"}},{"kind":"Field","name":{"kind":"Name","value":"userCode"}},{"kind":"Field","name":{"kind":"Name","value":"verificationUri"}},{"kind":"Field","name":{"kind":"Name","value":"expiresIn"}},{"kind":"Field","name":{"kind":"Name","value":"interval"}}]}}]}}]} as unknown as DocumentNode<StartDeviceFlowMutation, StartDeviceFlowMutationVariables>;
export const PollDeviceFlowDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PollDeviceFlow"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"githubDeviceFlowPoll"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sessionToken"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activeWorkspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"onboardingStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nextStep"}}]}}]}}]}}]} as unknown as DocumentNode<PollDeviceFlowMutation, PollDeviceFlowMutationVariables>;
export const SignInLocalDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SignInLocal"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LocalSignInInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"signInLocal"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sessionToken"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activeWorkspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"onboardingStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nextStep"}}]}}]}}]}}]} as unknown as DocumentNode<SignInLocalMutation, SignInLocalMutationVariables>;
export const BootstrapWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BootstrapWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BootstrapWorkspaceInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bootstrapWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"onboardingStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nextStep"}}]}}]}}]}}]} as unknown as DocumentNode<BootstrapWorkspaceMutation, BootstrapWorkspaceMutationVariables>;
export const MeLoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MeLogin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<MeLoginQuery, MeLoginQueryVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activeWorkspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}},{"kind":"Field","name":{"kind":"Name","value":"workspaces"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}},{"kind":"Field","name":{"kind":"Name","value":"environments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const SwitchWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SwitchWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"switchWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]} as unknown as DocumentNode<SwitchWorkspaceMutation, SwitchWorkspaceMutationVariables>;
export const CreateWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateWorkspaceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]} as unknown as DocumentNode<CreateWorkspaceMutation, CreateWorkspaceMutationVariables>;
export const LogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"}}]}}]} as unknown as DocumentNode<LogoutMutation, LogoutMutationVariables>;
export const SaveGithubPatDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SaveGithubPat"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveGithubPat"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}]}]}}]} as unknown as DocumentNode<SaveGithubPatMutation, SaveGithubPatMutationVariables>;
export const AiSettingsForLayoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AiSettingsForLayout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aiSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"redactionMode"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"hasOpenAiKey"}}]}}]}}]} as unknown as DocumentNode<AiSettingsForLayoutQuery, AiSettingsForLayoutQueryVariables>;
export const UpdateAiSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAiSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAiSettingsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAiSettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"redactionMode"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"hasOpenAiKey"}}]}}]}}]} as unknown as DocumentNode<UpdateAiSettingsMutation, UpdateAiSettingsMutationVariables>;
export const SaveOpenAiKeyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SaveOpenAiKey"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"apiKey"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveOpenAiKey"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"apiKey"},"value":{"kind":"Variable","name":{"kind":"Name","value":"apiKey"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasOpenAiKey"}},{"kind":"Field","name":{"kind":"Name","value":"redactionMode"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}}]}}]} as unknown as DocumentNode<SaveOpenAiKeyMutation, SaveOpenAiKeyMutationVariables>;
export const CacheStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CacheStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cacheStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"connected"}}]}}]}}]} as unknown as DocumentNode<CacheStatusQuery, CacheStatusQueryVariables>;
export const SaveNotifyWebhookDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SaveNotifyWebhook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"url"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveNotifyWebhook"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"url"},"value":{"kind":"Variable","name":{"kind":"Name","value":"url"}}}]}]}}]} as unknown as DocumentNode<SaveNotifyWebhookMutation, SaveNotifyWebhookMutationVariables>;
export const GlobalSearchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GlobalSearch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"q"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"q"},"value":{"kind":"Variable","name":{"kind":"Name","value":"q"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"subtitle"}},{"kind":"Field","name":{"kind":"Name","value":"href"}},{"kind":"Field","name":{"kind":"Name","value":"score"}}]}}]}}]} as unknown as DocumentNode<GlobalSearchQuery, GlobalSearchQueryVariables>;
export const AiSettingsForExecuteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AiSettingsForExecute"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aiSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"redactionMode"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"hasOpenAiKey"}}]}}]}}]} as unknown as DocumentNode<AiSettingsForExecuteQuery, AiSettingsForExecuteQueryVariables>;
export const ExplainOperationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ExplainOperation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ExplainOperationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"explainOperation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markdown"}},{"kind":"Field","name":{"kind":"Name","value":"citations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"typeName"}},{"kind":"Field","name":{"kind":"Name","value":"fieldName"}}]}}]}}]}}]} as unknown as DocumentNode<ExplainOperationMutation, ExplainOperationMutationVariables>;
export const GenerateOperationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GenerateOperation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GenerateOperationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateOperation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"document"}},{"kind":"Field","name":{"kind":"Name","value":"warnings"}}]}}]}}]} as unknown as DocumentNode<GenerateOperationMutation, GenerateOperationMutationVariables>;
export const ProjectSchemasDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProjectSchemas"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schemas"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ProjectSchemasQuery, ProjectSchemasQueryVariables>;
export const SchemaVersionsBySchemaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SchemaVersionsBySchema"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schemaId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schemaVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schemaId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schemaId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<SchemaVersionsBySchemaQuery, SchemaVersionsBySchemaQueryVariables>;
export const EnvironmentsForExecuteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EnvironmentsForExecute"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"environments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"headers"}}]}}]}}]} as unknown as DocumentNode<EnvironmentsForExecuteQuery, EnvironmentsForExecuteQueryVariables>;
export const OperationForRunDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OperationForRun"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"operation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"environments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"headers"}}]}}]}}]} as unknown as DocumentNode<OperationForRunQuery, OperationForRunQueryVariables>;
export const CollectionItemForExecuteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CollectionItemForExecute"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"collectionItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"queryContent"}},{"kind":"Field","name":{"kind":"Name","value":"variablesJson"}},{"kind":"Field","name":{"kind":"Name","value":"operationId"}},{"kind":"Field","name":{"kind":"Name","value":"collectionId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"environments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"headers"}}]}}]}}]} as unknown as DocumentNode<CollectionItemForExecuteQuery, CollectionItemForExecuteQueryVariables>;
export const ExecuteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Execute"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ExecuteOperationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"executeOperation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"responseBody"}},{"kind":"Field","name":{"kind":"Name","value":"execution"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"durationMs"}},{"kind":"Field","name":{"kind":"Name","value":"httpStatus"}}]}}]}}]}}]} as unknown as DocumentNode<ExecuteMutation, ExecuteMutationVariables>;
export const CollectionsForSaveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CollectionsForSave"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"collections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CollectionsForSaveQuery, CollectionsForSaveQueryVariables>;
export const CreateCollectionForSaveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCollectionForSave"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CreateCollectionForSaveMutation, CreateCollectionForSaveMutationVariables>;
export const SaveToCollectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SaveToCollection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SaveToCollectionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveToCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<SaveToCollectionMutation, SaveToCollectionMutationVariables>;