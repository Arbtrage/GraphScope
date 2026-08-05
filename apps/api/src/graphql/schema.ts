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
  }

  input CreateWorkspaceInput {
    name: String!
    slug: String!
  }

  input LocalSignInInput {
    displayName: String!
  }

  type Query {
    health: Health!
    me: User
    workspaces: [Workspace!]!
    workspace(id: ID!): Workspace
  }

  type Mutation {
    createWorkspace(input: CreateWorkspaceInput!): Workspace!
    switchWorkspace(id: ID!): Workspace!
    githubDeviceFlowStart: DeviceFlowPayload!
    githubDeviceFlowPoll(deviceCode: String!): AuthPayload
    signInLocal(input: LocalSignInInput!): AuthPayload!
    logout: Boolean!
  }
`;
