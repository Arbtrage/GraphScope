"use client";

import { ApolloProvider, gql, useMutation } from "@apollo/client";
import { Button, Input, Label } from "@graphscope/ui";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apolloClient, setSessionToken } from "@/lib/apollo";

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

function LoginForm() {
  const router = useRouter();
  const [startFlow] = useMutation(START_DEVICE_FLOW);
  const [pollFlow] = useMutation(POLL_DEVICE_FLOW);
  const [signInLocal, { loading: localLoading }] = useMutation(SIGN_IN_LOCAL);
  const [displayName, setDisplayName] = useState("");
  const [userCode, setUserCode] = useState<string | null>(null);
  const [verificationUri, setVerificationUri] = useState<string | null>(null);
  const [deviceCode, setDeviceCode] = useState<string | null>(null);
  const [interval, setIntervalMs] = useState(5000);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

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
      router.replace("/app");
    } catch (err) {
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
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
          <Button type="submit" className="w-full" variant="accent" disabled={localLoading || displayName.trim().length < 2}>
            {localLoading ? "Signing in…" : "Continue locally"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        {!userCode ? (
          <Button className="w-full" variant="outline" onClick={beginLogin}>
            Sign in with GitHub
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>GitHub code</Label>
              <Input readOnly value={userCode} className="text-center font-mono text-lg tracking-widest" />
            </div>
            <Button variant="outline" className="w-full" asChild>
              <a href={verificationUri ?? "#"} target="_blank" rel="noreferrer">
                Open GitHub to authorize
              </a>
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {polling ? "Waiting for authorization…" : "Enter the code on GitHub"}
            </p>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <p className="text-xs text-muted-foreground">
          Local sign-in keeps everything on your Mac. GitHub is optional for repo features later.
        </p>
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
