"use client";

import { ApolloProvider, gql, useMutation, useQuery } from "@apollo/client";
import {
  AppShell,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EnvPicker,
  Input,
  type NavGroup,
  WorkspaceSwitcher,
  AiSettingsForm,
} from "@graphscope/ui";
import {
  BarChart3,
  BookMarked,
  FolderKanban,
  History,
  Home,
  Layers,
  ListTodo,
  Moon,
  Play,
  Search,
  Settings,
  Sun,
  Zap,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { apolloClient, getSessionToken, setSessionToken } from "@/lib/apollo";
import { useGraphMutation } from "@/hooks/use-graph-mutation";
import { NavLink } from "@/components/nav-link";
import { HoneycombLoader } from "@/components/honeycomb-loader";
import { NavigationContent, useAppRouter } from "@/components/navigation-provider";
import { CommandPalette } from "@/components/command-palette";

const ME_QUERY = gql`
  query Me {
    me {
      id
      githubLogin
      name
    }
    activeWorkspace {
      id
      name
      slug
    }
    workspaces {
      id
      name
      slug
    }
    environments {
      id
      name
    }
  }
`;

const SWITCH_WORKSPACE = gql`
  mutation SwitchWorkspace($id: ID!) {
    switchWorkspace(id: $id) {
      id
      name
      slug
    }
  }
`;

const CREATE_WORKSPACE = gql`
  mutation CreateWorkspace($input: CreateWorkspaceInput!) {
    createWorkspace(input: $input) {
      id
      name
      slug
    }
  }
`;

const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

const SAVE_PAT = gql`
  mutation SaveGithubPat($token: String!) {
    saveGithubPat(token: $token)
  }
`;

const AI_SETTINGS = gql`
  query AiSettingsForLayout {
    aiSettings {
      redactionMode
      enabled
      hasOpenAiKey
    }
  }
`;

const UPDATE_AI_SETTINGS = gql`
  mutation UpdateAiSettings($input: UpdateAiSettingsInput!) {
    updateAiSettings(input: $input) {
      redactionMode
      enabled
      hasOpenAiKey
    }
  }
`;

const SAVE_OPENAI_KEY = gql`
  mutation SaveOpenAiKey($apiKey: String!) {
    saveOpenAiKey(apiKey: $apiKey) {
      hasOpenAiKey
      redactionMode
      enabled
    }
  }
`;

const CACHE_STATUS = gql`
  query CacheStatus {
    cacheStatus {
      enabled
      connected
    }
  }
`;

const SAVE_NOTIFY_WEBHOOK = gql`
  mutation SaveNotifyWebhook($url: String!) {
    saveNotifyWebhook(url: $url)
  }
`;

const ENV_STORAGE_KEY = "graphscope-active-env";

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Home", href: "/app", icon: <Home className="h-4 w-4" /> },
      { label: "Projects", href: "/app/projects", icon: <FolderKanban className="h-4 w-4" /> },
      { label: "Schema Explorer", href: "/app/schema/explore", icon: <Layers className="h-4 w-4" /> },
    ],
  },
  {
    label: "Run",
    items: [
      { label: "Execute", href: "/app/execute", icon: <Play className="h-4 w-4" /> },
      { label: "Environments", href: "/app/environments", icon: <Zap className="h-4 w-4" /> },
      { label: "History", href: "/app/history", icon: <History className="h-4 w-4" /> },
    ],
  },
  {
    label: "Organize",
    items: [
      { label: "Collections", href: "/app/collections", icon: <BookMarked className="h-4 w-4" /> },
      { label: "Operations", href: "/app/operations", icon: <Search className="h-4 w-4" /> },
      { label: "Analytics", href: "/app/analytics", icon: <BarChart3 className="h-4 w-4" /> },
      { label: "Jobs", href: "/app/jobs", icon: <ListTodo className="h-4 w-4" /> },
    ],
  },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
      Toggle theme
    </DropdownMenuItem>
  );
}

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const appRouter = useAppRouter();
  const pathname = usePathname();
  const { data, loading, refetch } = useQuery(ME_QUERY);
  const [switchWorkspaceMut] = useGraphMutation(SWITCH_WORKSPACE);
  const [createWorkspaceMut] = useGraphMutation(CREATE_WORKSPACE, { successMessage: "Workspace created" });
  const [logout] = useMutation(LOGOUT);
  const [savePat] = useGraphMutation(SAVE_PAT, { successMessage: "GitHub PAT saved" });
  const { data: aiSettingsData, refetch: refetchAiSettings } = useQuery(AI_SETTINGS);
  const { data: cacheData } = useQuery(CACHE_STATUS);
  const [updateAiSettings] = useGraphMutation(UPDATE_AI_SETTINGS, { onCompleted: () => refetchAiSettings() });
  const [saveOpenAiKey] = useGraphMutation(SAVE_OPENAI_KEY, { successMessage: "OpenAI key saved", onCompleted: () => refetchAiSettings() });
  const [saveNotifyWebhook] = useGraphMutation(SAVE_NOTIFY_WEBHOOK, { successMessage: "Webhook saved" });
  const [commandOpen, setCommandOpen] = useState(false);
  const [patInput, setPatInput] = useState("");
  const [webhookInput, setWebhookInput] = useState("");
  const [activeEnvId, setActiveEnvId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !data?.me) router.replace("/login");
  }, [loading, data, router]);

  useEffect(() => {
    const stored = localStorage.getItem(ENV_STORAGE_KEY);
    if (stored) setActiveEnvId(stored);
  }, []);

  useEffect(() => {
    const envs = data?.environments ?? [];
    if (envs.length && !activeEnvId) {
      setActiveEnvId(envs[0].id);
      localStorage.setItem(ENV_STORAGE_KEY, envs[0].id);
    }
  }, [data?.environments, activeEnvId]);

  const handleEnvChange = useCallback((id: string) => {
    setActiveEnvId(id);
    localStorage.setItem(ENV_STORAGE_KEY, id);
  }, []);

  const refreshWorkspaceContext = useCallback(async () => {
    await apolloClient.refetchQueries({ include: "active" });
    await refetch();
  }, [refetch]);

  const handleSwitchWorkspace = useCallback(
    async (id: string) => {
      if (id === data?.activeWorkspace?.id) return;
      await switchWorkspaceMut({ variables: { id } });
      await refreshWorkspaceContext();
      if (pathname !== "/app") {
        router.push("/app");
      } else {
        router.refresh();
      }
    },
    [data?.activeWorkspace?.id, pathname, refreshWorkspaceContext, router, switchWorkspaceMut],
  );

  const handleCreateWorkspace = useCallback(
    async (input: { name: string; slug: string }) => {
      await createWorkspaceMut({ variables: { input } });
      await refreshWorkspaceContext();
      router.push("/app");
    },
    [createWorkspaceMut, refreshWorkspaceContext, router],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <HoneycombLoader />
      </div>
    );
  }
  if (!data?.me) return null;

  const navGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      active:
        item.href === "/app"
          ? pathname === "/app"
          : pathname === item.href || pathname.startsWith(item.href + "/"),
    })),
  }));

  return (
    <>
      <AppShell
        navGroups={navGroups}
        renderLink={({ href, children: linkChildren }) => (
          <NavLink href={href} className="block">
            {linkChildren}
          </NavLink>
        )}
        workspaceSwitcher={
          <WorkspaceSwitcher
            workspaces={data.workspaces ?? []}
            activeWorkspaceId={data.activeWorkspace?.id ?? null}
            onSwitch={handleSwitchWorkspace}
            onCreate={handleCreateWorkspace}
          />
        }
        topBarActions={
          <>
            <EnvPicker
              environments={data.environments ?? []}
              activeId={activeEnvId}
              onChange={handleEnvChange}
            />
            <Button variant="outline" size="sm" onClick={() => setCommandOpen(true)}>
              <Search className="mr-1 h-4 w-4" />
              ⌘K
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="mr-1 h-4 w-4" />
                  Settings
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{data.me.githubLogin ?? data.me.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ThemeToggle />
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">GitHub PAT</DropdownMenuLabel>
                <div className="px-2 pb-2">
                  <Input
                    type="password"
                    placeholder="ghp_…"
                    value={patInput}
                    onChange={(e) => setPatInput(e.target.value)}
                    className="h-8"
                  />
                  <Button
                    size="sm"
                    className="mt-2 w-full"
                    variant="secondary"
                    onClick={() => patInput && savePat({ variables: { token: patInput } })}
                  >
                    Save PAT
                  </Button>
                </div>
                {aiSettingsData?.aiSettings && (
                  <div className="px-2 pb-2">
                    <AiSettingsForm
                      redactionMode={aiSettingsData.aiSettings.redactionMode}
                      enabled={aiSettingsData.aiSettings.enabled}
                      hasOpenAiKey={aiSettingsData.aiSettings.hasOpenAiKey}
                      onSaveKey={async (key) => { await saveOpenAiKey({ variables: { apiKey: key } }); }}
                      onUpdateSettings={async (patch) => { await updateAiSettings({ variables: { input: patch } }); }}
                    />
                  </div>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Redis cache: {cacheData?.cacheStatus?.connected ? "connected" : cacheData?.cacheStatus?.enabled ? "unavailable" : "disabled"}
                </DropdownMenuLabel>
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Notify webhook (Slack)</DropdownMenuLabel>
                <div className="px-2 pb-2">
                  <Input
                    placeholder="https://hooks.slack.com/…"
                    value={webhookInput}
                    onChange={(e) => setWebhookInput(e.target.value)}
                    className="h-8"
                  />
                  <Button
                    size="sm"
                    className="mt-2 w-full"
                    variant="secondary"
                    onClick={() => webhookInput && saveNotifyWebhook({ variables: { url: webhookInput } })}
                  >
                    Save webhook
                  </Button>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await logout();
                    setSessionToken(null);
                    appRouter.replace("/login");
                  }}
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      >
        <NavigationContent key={data.activeWorkspace?.id ?? "none"}>{children}</NavigationContent>
      </AppShell>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    if (!getSessionToken()) router.replace("/login");
  }, [router]);
  if (!getSessionToken()) return null;
  return (
    <ApolloProvider client={apolloClient}>
      <AppLayoutInner>{children}</AppLayoutInner>
    </ApolloProvider>
  );
}

export function getActiveEnvironmentId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ENV_STORAGE_KEY);
}
