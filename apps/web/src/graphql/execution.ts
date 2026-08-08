import { gql } from "@apollo/client";

export const ENVIRONMENTS_FOR_EXECUTE = gql`
  query EnvironmentsForExecute {
    environments {
      id
      name
      headers
    }
  }
`;

export const OPERATION_FOR_RUN = gql`
  query OperationForRun($id: ID!) {
    operation(id: $id) {
      id
      name
      content
      projectId
    }
    environments {
      id
      name
      headers
    }
  }
`;

export const COLLECTION_ITEM_FOR_EXECUTE = gql`
  query CollectionItemForExecute($id: ID!) {
    collectionItem(id: $id) {
      id
      name
      queryContent
      variablesJson
      operationId
      collectionId
    }
    environments {
      id
      name
      headers
    }
  }
`;

export const EXECUTE_OPERATION = gql`
  mutation Execute($input: ExecuteOperationInput!) {
    executeOperation(input: $input) {
      responseBody
      execution {
        id
        status
        durationMs
        httpStatus
      }
    }
  }
`;

export const COLLECTIONS_FOR_SAVE = gql`
  query CollectionsForSave {
    collections {
      id
      name
    }
  }
`;

export const CREATE_COLLECTION_FOR_SAVE = gql`
  mutation CreateCollectionForSave($name: String!) {
    createCollection(name: $name) {
      id
      name
    }
  }
`;

export const SAVE_TO_COLLECTION = gql`
  mutation SaveToCollection($input: SaveToCollectionInput!) {
    saveToCollection(input: $input) {
      id
      name
    }
  }
`;
