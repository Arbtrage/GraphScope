const ENV_STORAGE_KEY = "graphscope-active-env";

export function getActiveEnvironmentId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ENV_STORAGE_KEY);
}

export function setActiveEnvironmentId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ENV_STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent("graphscope:active-env", { detail: id }));
}

export function subscribeActiveEnvironment(cb: (id: string) => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = (event: Event) => {
    const id = (event as CustomEvent<string>).detail;
    if (id) cb(id);
  };
  window.addEventListener("graphscope:active-env", handler);
  return () => window.removeEventListener("graphscope:active-env", handler);
}

export { ENV_STORAGE_KEY };
