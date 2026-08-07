"use client";

import { useMutation, type MutationHookOptions, type DocumentNode, type OperationVariables } from "@apollo/client";
import { toastMutationError, toastMutationSuccess } from "@/lib/apollo-error";

export function useGraphMutation<TData = unknown, TVariables extends OperationVariables = OperationVariables>(
  mutation: DocumentNode,
  options?: MutationHookOptions<TData, TVariables> & { successMessage?: string },
) {
  const { successMessage, onCompleted, onError, ...rest } = options ?? {};
  return useMutation<TData, TVariables>(mutation, {
    ...rest,
    onCompleted: (data, clientOptions) => {
      if (successMessage) toastMutationSuccess(successMessage);
      onCompleted?.(data, clientOptions);
    },
    onError: (error, clientOptions) => {
      toastMutationError(error);
      onError?.(error, clientOptions);
    },
  });
}
