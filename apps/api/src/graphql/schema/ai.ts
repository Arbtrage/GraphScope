export const typeDefs = /* GraphQL */ `
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
`;
