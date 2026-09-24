const DEFAULT_API_URL = "http://127.0.0.1:47321/graphql";
const SESSION_KEY = "graphscope_session_token";

let cachedGraphqlUrl: string | null = null;
let resolvePromise: Promise<string> | null = null;

async function resolveGraphqlUrl(): Promise<string> {
  if (cachedGraphqlUrl) return cachedGraphqlUrl;
  if (resolvePromise) return resolvePromise;

  resolvePromise = (async () => {
    try {
      const runtime = await window.graphscope?.getRuntime?.();
      if (runtime?.apiUrl) {
        cachedGraphqlUrl = `${runtime.apiUrl.replace(/\/$/, "")}/graphql`;
        return cachedGraphqlUrl;
      }
    } catch {
      /* fall through */
    }
    const fromEnv = import.meta.env.VITE_GRAPHSCOPE_API_URL;
    cachedGraphqlUrl = typeof fromEnv === "string" && fromEnv.length > 0 ? fromEnv : DEFAULT_API_URL;
    return cachedGraphqlUrl;
  })();

  try {
    return await resolvePromise;
  } finally {
    resolvePromise = null;
  }
}

export function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionToken(token: string | null) {
  if (token) localStorage.setItem(SESSION_KEY, token);
  else localStorage.removeItem(SESSION_KEY);
  if (window.graphscope?.keychain) {
    if (token) void window.graphscope.keychain.set(SESSION_KEY, token);
    else void window.graphscope.keychain.delete(SESSION_KEY);
  }
}

export async function hydrateSessionFromKeychain(): Promise<string | null> {
  if (!window.graphscope?.keychain) return getSessionToken();
  try {
    const fromChain = await window.graphscope.keychain.get(SESSION_KEY);
    if (fromChain) {
      setSessionToken(fromChain);
      return fromChain;
    }
  } catch {
    /* ignore */
  }
  return getSessionToken();
}

export async function graphqlRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const token = getSessionToken();
  const apiUrl = await resolveGraphqlUrl();
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) {
    throw new Error(json.errors.map((err) => err.message).join("; "));
  }
  if (!json.data) throw new Error("Empty GraphQL response");
  return json.data;
}
