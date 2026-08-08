import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "src/graphql/schema.graphql",
  documents: [
    "src/graphql/**/*.{ts,tsx}",
    "src/features/**/*.{ts,tsx}",
    "src/app/**/*.{ts,tsx}",
    "src/components/**/*.{ts,tsx}",
  ],
  ignoreNoDocuments: true,
  generates: {
    "./src/graphql/generated/": {
      preset: "client",
      plugins: [],
      presetConfig: {
        gqlTagName: "gql",
        fragmentMasking: false,
      },
    },
  },
};

export default config;
