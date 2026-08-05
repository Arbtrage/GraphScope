"use client";

import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, from } from "@apollo/client";

const API_URL = process.env.NEXT_PUBLIC_GRAPHSCOPE_API_URL ?? "http://127.0.0.1:47321/graphql";

const SESSION_KEY = "graphscope_session_token";

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(SESSION_KEY, token);
  else localStorage.removeItem(SESSION_KEY);
}

const authLink = new ApolloLink((operation, forward) => {
  const token = getSessionToken();
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  }));
  return forward(operation);
});

const httpLink = new HttpLink({ uri: API_URL, credentials: "include" });

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: "cache-and-network" },
  },
});
