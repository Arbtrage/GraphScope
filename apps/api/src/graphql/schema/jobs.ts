export const typeDefs = /* GraphQL */ `
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
`;
