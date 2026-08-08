export const typeDefs = /* GraphQL */ `
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
`;
