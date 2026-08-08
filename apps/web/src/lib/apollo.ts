"use client";

import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, from } from "@apollo/client";

const API_URL = process.env.NEXT_PUBLIC_GRAPHSCOPE_API_URL ?? "http://127.0.0.1:47321/graphql";
const SESSION_KEY = "graphscope_session_token";

function hasDesktopBridge(): boolean {
  return typeof window !== "undefined" && !!window.graphscope?.keychain;
}

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export async function hydrateSessionFromKeychain(): Promise<string | null> {
  if (!hasDesktopBridge()) return getSessionToken();
  try {
    const fromChain = await window.graphscope!.keychain.get(SESSION_KEY);
    if (fromChain) {
      localStorage.setItem(SESSION_KEY, fromChain);
      return fromChain;
    }
  } catch {
    /* fall through */
  }
  return getSessionToken();
}

export function setSessionToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(SESSION_KEY, token);
    if (hasDesktopBridge()) {
      void window.graphscope!.keychain.set(SESSION_KEY, token).catch(() => undefined);
    }
  } else {
    localStorage.removeItem(SESSION_KEY);
    if (hasDesktopBridge()) {
      void window.graphscope!.keychain.delete(SESSION_KEY).catch(() => undefined);
    }
  }
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
