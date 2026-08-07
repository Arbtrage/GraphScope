import type { ValidationContext, ASTVisitor } from "graphql";
import { GraphQLError } from "graphql";

const DEFAULT_MAX_COMPLEXITY = 1000;

/** Rough field-count complexity estimator for platform API queries. */
export function complexityLimitRule(max = DEFAULT_MAX_COMPLEXITY) {
  return function complexityLimitValidationRule(context: ValidationContext): ASTVisitor {
    let complexity = 0;
    return {
      Field: {
        enter() {
          complexity += 1;
          if (complexity > max) {
            context.reportError(
              new GraphQLError(`Query complexity ${complexity} exceeds limit ${max}`, {
                extensions: { code: "QUERY_COMPLEXITY_LIMIT" },
              }),
            );
          }
        },
      },
    };
  };
}
