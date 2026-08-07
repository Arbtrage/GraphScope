import { ApolloError } from "@apollo/client";
import { toast } from "sonner";

export function getGraphQLErrorMessage(error: unknown): string {
  if (error instanceof ApolloError) {
    if (error.graphQLErrors.length > 0) {
      return error.graphQLErrors.map((e) => e.message).join("; ");
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

export function toastMutationError(error: unknown): void {
  toast.error(getGraphQLErrorMessage(error));
}

export function toastMutationSuccess(message: string): void {
  toast.success(message);
}
