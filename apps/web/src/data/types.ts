export type OperationKind = 'query' | 'mutation' | 'subscription'
export type EntityKind = 'operation' | 'fragment' | 'type' | 'field' | 'file' | 'endpoint'
export type TypeKind = 'OBJECT' | 'INPUT' | 'ENUM' | 'INTERFACE' | 'CONNECTION'
export type FileKind = 'graphql' | 'tsx' | 'ts' | 'test'
export type UsageKind = 'component' | 'page' | 'test' | 'hook'
export type ViewId =
  | 'operations'
  | 'graph'
  | 'schema'
  | 'files'
  | 'endpoints'
  | 'search'
  | 'history'

export type TypeSource = 'inferred' | 'introspected'

export interface Repository {
  id: string
  name: string
  branch: string
  scannedAtLabel: string
  localPath?: string | null
  status?: string
  lastError?: string | null
  operationCount?: number
}

export interface RepoStats {
  operations: number
  queries: number
  mutations: number
  subscriptions: number
  fragments: number
  types: number
  endpoints: number
  files: number
}

export interface SourceLocation {
  fileId: string
  path: string
  line: number
}

export interface Operation {
  id: string
  name: string
  kind: OperationKind
  description: string
  source: SourceLocation
  document: string
  variables: Record<string, unknown>
  fragmentIds: string[]
  typeIds: string[]
  usageIds: string[]
  endpointId: string
  unused: boolean
  lastChanged: string
}

export interface Fragment {
  id: string
  name: string
  source: SourceLocation
  document: string
  typeIds: string[]
  operationIds: string[]
  fileIds: string[]
  duplicateOf?: string
}

export interface GraphQLType {
  id: string
  name: string
  kind: TypeKind
  sdl: string
  source: TypeSource
  fieldIds: string[]
  operationIds: string[]
  fragmentIds: string[]
  fileIds: string[]
}

export interface Field {
  id: string
  name: string
  typeId: string
  typeName: string
  returnType: string
  deprecated?: boolean
  deprecationReason?: string
}

export interface SourceFile {
  id: string
  path: string
  kind: FileKind
  operationIds: string[]
  fragmentIds: string[]
  referenceCount: number
}

export interface Endpoint {
  id: string
  name: string
  url: string
  environment: string
  operationCount: number
  schemaDate: string
  latency: string
  headers: Record<string, string>
  schemaPulled?: boolean
  schemaPulledAt?: string | null
}

export interface HeaderPair {
  id: string
  key: string
  value: string
}

export interface UsageReference {
  id: string
  fileId: string
  path: string
  line: number
  kind: UsageKind
}

export type ExecutionKind =
  | 'SUCCESS'
  | 'GRAPHQL_ERROR'
  | 'TRANSPORT_ERROR'
  | 'TIMEOUT'
  | 'BLOCKED'
  | 'API_ERROR'

export interface ExecutionResult {
  status: number
  statusText: string
  kind: ExecutionKind
  title?: string
  detail?: string
  durationMs: number
  body: unknown
  headers: Record<string, string>
  errors: unknown[]
  timing: { dns: number; connect: number; ttfb: number; total: number }
}

export interface HistoryEntry {
  id: string
  operationId: string
  operationName: string
  kind: OperationKind
  at: string
  day: 'today' | 'yesterday' | 'older'
}

export interface AttentionItem {
  id: string
  label: string
  count: number
  severity: 'warning' | 'info'
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  relation: 'uses' | 'spreads' | 'has' | 'defined-in' | 'used-by' | 'executes'
}

export interface SelectedEntity {
  kind: EntityKind
  id: string
}

export interface ImpactSummary {
  operations: number
  files: number
  components: number
  screens: number
  tests: number
}

export interface IndexedCatalog {
  repository: Repository
  stats: RepoStats
  operations: Operation[]
  fragments: Fragment[]
  types: GraphQLType[]
  fields: Field[]
  files: SourceFile[]
  endpoints: Endpoint[]
  usages: UsageReference[]
  history: HistoryEntry[]
  attention: AttentionItem[]
  recentOperationIds: string[]
  operationsById: Record<string, Operation>
  fragmentsById: Record<string, Fragment>
  typesById: Record<string, GraphQLType>
  fieldsById: Record<string, Field>
  filesById: Record<string, SourceFile>
  endpointsById: Record<string, Endpoint>
  usagesById: Record<string, UsageReference>
  graphEdges: GraphEdge[]
  surfaceNodeIds: string[]
}
