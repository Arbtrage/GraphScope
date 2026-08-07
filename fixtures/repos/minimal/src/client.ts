import gql from "graphql-tag";

export const LIST_ITEMS = gql`
  query ListItems {
    items {
      id
      title
    }
  }
`;

export const CREATE_ITEM = gql`
  mutation CreateItem($title: String!) {
    createItem(title: $title) {
      id
      title
    }
  }
`;
