"use client";

import { ApolloProvider, gql, useMutation, useQuery } from "@apollo/client";
import { Button, Input, Label, Skeleton } from "@graphscope/ui";
import { Copy, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useAppRouter } from "@/components/navigation-provider";
import { useCallback, useEffect, useState } from "react";
import { apolloClient, getSessionToken, hydrateSessionFromKeychain, setSessionToken } from "@/lib/apollo";
import { toastMutationError, toastMutationSuccess } from "@/lib/apollo-error";

const START_DEVICE_FLOW = gql`
  mutation StartDeviceFlow {
    githubDeviceFlowStart {
      deviceCode
      userCode
      verificationUri
      expiresIn
      interval
    }
  }
`;

const POLL_DEVICE_FLOW = gql`
  mutation PollDeviceFlow($deviceCode: String!) {
    githubDeviceFlowPoll(deviceCode: $deviceCode) {
      sessionToken
      user {
        id
        githubLogin
        name
      }
      activeWorkspace {
        id
        name
      }
      onboardingStatus {
        nextStep
      }
    }
  }
`;

const SIGN_IN_LOCAL = gql`
  mutation SignInLocal($input: LocalSignInInput!) {
    signInLocal(input: $input) {
      sessionToken
      user {
        id
        name
        githubLogin
      }
      activeWorkspace {
        id
        name
      }
      onboardingStatus {
        nextStep
      }
    }
  }
`;

const BOOTSTRAP = gql`
  mutation BootstrapWorkspace($input: BootstrapWorkspaceInput) {
    bootstrapWorkspace(input: $input) {
      workspace {
        id
        name
      }
      onboardingStatus {
        nextStep
      }
    }
  }
`;

const ME = gql`
  query MeLogin {
    me {
      id
    }
  }
`;

function LoginThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="absolute right-4 top-4 h-9 w-9"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function LoginForm() {
  const router = useAppRouter();
  const { data: meData } = useQuery(ME, { skip: !getSessionToken() });
  const [startFlow, { loading: starting }] = useMutation(START_DEVICE_FLOW);
  const [pollFlow] = useMutation(POLL_DEVICE_FLOW);
  const [signInLocal, { loading: localLoading }] = useMutation(SIGN_IN_LOCAL);
  const [bootstrapWorkspace] = useMutation(BOOTSTRAP);
  const [displayName, setDisplayName] = useState("");
  const [userCode, setUserCode] = useState<string | null>(null);
  const [verificationUri, setVerificationUri] = useState<string | null>(null);
  const [deviceCode, setDeviceCode] = useState<string | null>(null);
  const [interval, setIntervalMs] = useState(5000);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    void hydrateSessionFromKeychain();
  }, []);

  useEffect(() => {
    if (meData?.me) router.replace("/app");
  }, [meData, router]);

  const finishSignIn = async (
    sessionToken: string,
    onboarding?: { nextStep?: string } | null,
  ) => {
    setSessionToken(sessionToken);
    if (onboarding?.nextStep && onboarding.nextStep !== "DONE") {
      try {
        await bootstrapWorkspace({
          variables: {
            input: {
              projectName: "My project",
              createDefaultEnvironment: true,
            },
          },
        });
      } catch {
        /* non-blocking */
      }
    }
    router.replace("/app");
  };

  const beginLogin = async () => {
    setError(null);
    try {
      const { data } = await startFlow();
      const payload = data.githubDeviceFlowStart;
      setUserCode(payload.userCode);
      setVerificationUri(payload.verificationUri);
      setDeviceCode(payload.deviceCode);
      setIntervalMs((payload.interval ?? 5) * 1000);
      setPolling(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start GitHub login");
    }
  };

  const continueLocally = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { data } = await signInLocal({
        variables: { input: { displayName: displayName.trim() } },
      });
      setSessionToken(data.signInLocal.sessionToken);
      toastMutationSuccess("Signed in locally");
      await finishSignIn(data.signInLocal.sessionToken, data.signInLocal.onboardingStatus);
    } catch (err) {
      toastMutationError(err);
      setError(err instanceof Error ? err.message : "Local sign-in failed");
    }
  };

  const poll = useCallback(async () => {
    if (!deviceCode) return;
    try {
      const { data } = await pollFlow({ variables: { deviceCode } });
      if (data.githubDeviceFlowPoll) {
        setSessionToken(data.githubDeviceFlowPoll.sessionToken);
        setPolling(false);
        toastMutationSuccess("Signed in with GitHub");
        await finishSignIn(
          data.githubDeviceFlowPoll.sessionToken,
          data.githubDeviceFlowPoll.onboardingStatus,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "GitHub authorization failed");
      setPolling(false);
    }
  }, [deviceCode, pollFlow, bootstrapWorkspace, router]);

  useEffect(() => {
    if (!polling || !deviceCode) return;
    const id = window.setInterval(poll, interval);
    return () => window.clearInterval(id);
  }, [polling, deviceCode, interval, poll]);

  const copyCode = () => {
    if (userCode) {
      navigator.clipboard.writeText(userCode);
      toastMutationSuccess("Code copied");
    }
  };

  return (
    <div className="relative grid min-h-dvh lg:grid-cols-2">
      <a
        href="#login-form"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:inline-flex focus:h-auto focus:w-auto focus:overflow-visible focus:whitespace-nowrap focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-tinted-md focus:outline-none"
      >
        Skip to sign in
      </a>
      <LoginThemeToggle />
      <aside className="relative hidden overflow-hidden border-r border-border bg-sidebar lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 mesh-ethereal opacity-80" />
        <div className="relative space-y-3">
          <span className="inline-flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="M12 2.5 19.5 7v10L12 21.5 4.5 17V7L12 2.5Zm0 2.3L6.5 8.1v7.8L12 19.2l5.5-3.3V8.1L12 4.8Z" />
                <path d="M12 8.2 15.2 10v4L12 15.8 8.8 14v-4L12 8.2Z" opacity="0.7" />
              </svg>
            </span>
            <span className="text-2xl font-semibold tracking-tight">GraphScope</span>
          </span>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Local-first GraphQL workspace. Discover operations, publish schemas, and run queries on your machine.
          </p>
        </div>
        <ol className="relative space-y-4 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="font-tabular text-foreground">01</span>
            Create a project and connect repos
          </li>
          <li className="flex gap-3">
            <span className="font-tabular text-foreground">02</span>
            Add an environment endpoint
          </li>
          <li className="flex gap-3">
            <span className="font-tabular text-foreground">03</span>
            Execute and keep history locally
          </li>
        </ol>
      </aside>

      <main id="login-form" className="relative flex flex-col justify-center px-6 py-16 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <div className="bezel-outer">
            <div className="bezel-inner space-y-10 p-6 sm:p-8">
          <div className="space-y-2 lg:hidden">
            <h1 className="text-2xl font-semibold tracking-tight">GraphScope</h1>
            <p className="text-sm text-muted-foreground">Sign in to your local workspace</p>
          </div>

          <section className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight">Sign in with GitHub</h2>
              <p className="text-sm text-muted-foreground">
                Recommended when you want repository indexing and device auth.
              </p>
            </div>
            {!userCode ? (
              <Button className="w-full" onClick={beginLogin} disabled={starting}>
                {starting ? "Starting…" : "Continue with GitHub"}
              </Button>
            ) : (
              <div className="space-y-4 rounded-lg border border-border/60 bg-card p-4 shadow-tinted-sm">
                <div className="space-y-2">
                  <Label>Device code</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={userCode}
                      className="text-center font-mono text-lg tracking-widest"
                    />
                    <Button type="button" variant="outline" size="icon" onClick={copyCode} aria-label="Copy code">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <a href={verificationUri ?? "#"} target="_blank" rel="noreferrer">
                    Open GitHub to authorize
                  </a>
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  {polling ? "Waiting for authorization…" : "Enter the code on GitHub"}
                </p>
                {polling && <Skeleton className="h-2 w-full" />}
              </div>
            )}
          </section>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wide">
              <span className="bg-background px-3 text-muted-foreground">Or continue locally</span>
            </div>
          </div>

          <section className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Local sign-in keeps everything on your Mac. GitHub stays optional for repo features.
            </p>
            <form onSubmit={continueLocally} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Maya Chen"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={64}
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                className="w-full"
                disabled={localLoading || displayName.trim().length < 2}
              >
                {localLoading ? "Signing in…" : "Continue locally"}
              </Button>
            </form>
          </section>

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <ApolloProvider client={apolloClient}>
      <LoginForm />
    </ApolloProvider>
  );
}
