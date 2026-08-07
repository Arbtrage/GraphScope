"use client";

import { ApolloProvider, gql, useMutation, useQuery } from "@apollo/client";
import { Button, Card, CardContent, Input, Label, Skeleton } from "@graphscope/ui";
import { Copy } from "lucide-react";
import { useAppRouter } from "@/components/navigation-provider";
import { useCallback, useEffect, useState } from "react";
import { apolloClient, getSessionToken, setSessionToken } from "@/lib/apollo";
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

function LoginForm() {
  const router = useAppRouter();
  const { data: meData } = useQuery(ME, { skip: !getSessionToken() });
  const [startFlow, { loading: starting }] = useMutation(START_DEVICE_FLOW);
  const [pollFlow] = useMutation(POLL_DEVICE_FLOW);
  const [signInLocal, { loading: localLoading }] = useMutation(SIGN_IN_LOCAL);
  const [displayName, setDisplayName] = useState("");
  const [userCode, setUserCode] = useState<string | null>(null);
  const [verificationUri, setVerificationUri] = useState<string | null>(null);
  const [deviceCode, setDeviceCode] = useState<string | null>(null);
  const [interval, setIntervalMs] = useState(5000);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (meData?.me) router.replace("/app");
  }, [meData, router]);

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
      setError(e instanceof Error ? e.message : "Failed to start GitHub login");
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
      router.replace("/app");
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
        router.replace("/app");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
      setPolling(false);
    }
  }, [deviceCode, pollFlow, router]);

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
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-6 p-8">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-primary">GraphScope</h1>
              <p className="text-sm text-muted-foreground">Sign in to your local workspace</p>
            </div>
            <form onSubmit={continueLocally} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={64}
                />
              </div>
              <Button type="submit" className="w-full bg-execute text-execute-foreground hover:bg-execute/90" disabled={localLoading || displayName.trim().length < 2}>
                {localLoading ? "Signing in…" : "Continue locally"}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">
              Local sign-in keeps everything on your Mac. GitHub is optional for repo features.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-6 p-8">
            <div className="space-y-2">
              <h2 className="text-lg font-medium">GitHub sign-in</h2>
              <p className="text-sm text-muted-foreground">Optional — for GitHub repository indexing.</p>
            </div>
            {!userCode ? (
              <Button className="w-full" variant="outline" onClick={beginLogin} disabled={starting}>
                {starting ? "Starting…" : "Sign in with GitHub"}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>GitHub code</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={userCode} className="text-center font-mono text-lg tracking-widest" />
                    <Button type="button" variant="outline" size="icon" onClick={copyCode}>
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
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      </div>
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
