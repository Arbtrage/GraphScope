export const typeDefs = /* GraphQL */ `
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
`;
