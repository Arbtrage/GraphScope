export const typeDefs = /* GraphQL */ `
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
    onboardingStatus: OnboardingStatus
  }

  enum OnboardingNextStep {
    CREATE_PROJECT
    CONNECT_REPO
    PUBLISH_SCHEMA
    ADD_ENVIRONMENT
    RUN_QUERY
    DONE
  }

  type OnboardingStatus {
    hasProject: Boolean!
    hasRepository: Boolean!
    hasPublishedSchema: Boolean!
    hasEnvironment: Boolean!
    hasExecution: Boolean!
    nextStep: OnboardingNextStep!
    projectCount: Int!
    environmentCount: Int!
    operationCount: Int!
    lastExecutionAt: String
  }

  input BootstrapWorkspaceInput {
    workspaceName: String
    projectName: String
    createDefaultEnvironment: Boolean
  }

  type BootstrapWorkspacePayload {
    workspace: Workspace!
    project: Project
    onboardingStatus: OnboardingStatus!
  }

  input CreateWorkspaceInput {
    name: String!
    slug: String!
  }

  input LocalSignInInput {
    displayName: String!
  }


  type WorkspaceStats {
    projectCount: Int!
    operationCount: Int!
    environmentCount: Int!
    lastExecutionAt: String
  }
`;
