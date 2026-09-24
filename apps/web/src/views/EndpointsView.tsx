import { HeaderEditor, pairsFromRecord, recordFromPairs } from "@/components/HeaderEditor";
import { Button, Field, Input } from "@/components/ui";
import type { HeaderPair } from "@/data/types";
import {
  deleteEnvironmentSecret,
  fetchEnvironmentSecrets,
  upsertEnvironmentSecret,
  type SecretRecord,
} from "@/lib/explorer-api";
import { useExplorer } from "@/store/explorer-store";
import { useEffect, useState } from "react";

type FormState = {
  id: string | null;
  name: string;
  url: string;
  isProduction: boolean;
  headers: HeaderPair[];
};

const emptyForm = (): FormState => ({
  id: null,
  name: "",
  url: "",
  isProduction: false,
  headers: pairsFromRecord({}),
});

export function EndpointsView() {
  const catalog = useExplorer((s) => s.catalog);
  const endpointId = useExplorer((s) => s.endpointId);
  const environmentId = useExplorer((s) => s.environmentId);
  const setEndpoint = useExplorer((s) => s.setEndpoint);
  const saveEnvironment = useExplorer((s) => s.saveEnvironment);
  const removeEnvironment = useExplorer((s) => s.removeEnvironment);
  const setEnvironment = useExplorer((s) => s.setEnvironment);
  const pullEnvironmentSchema = useExplorer((s) => s.pullEnvironmentSchema);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const endpoint = creating ? null : catalog.endpointsById[endpointId] ?? catalog.endpoints[0] ?? null;

  useEffect(() => {
    if (creating) return;
    if (!endpoint) {
      setForm(emptyForm());
      return;
    }
    setForm({
      id: endpoint.id,
      name: endpoint.name,
      url: endpoint.url,
      isProduction: endpoint.environment === "production",
      headers: pairsFromRecord(endpoint.headers),
    });
  }, [creating, endpoint]);

  const beginCreate = () => {
    setCreating(true);
    setForm(emptyForm());
  };

  const onSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const id = await saveEnvironment({
      id: creating ? null : form.id,
      name: form.name.trim(),
      endpointUrl: form.url.trim(),
      isProduction: form.isProduction,
      headers: recordFromPairs(form.headers),
    });
    setSaving(false);
    if (id) setCreating(false);
  };

  const onDelete = async () => {
    if (!form.id) return;
    if (!window.confirm(`Delete ${form.name || "this environment"}?`)) return;
    await removeEnvironment(form.id);
    setCreating(false);
  };

  return (
    <div className="flex h-full min-h-0 min-w-0">
      <div className="flex w-[280px] shrink-0 flex-col overflow-y-auto border-r border-line py-3 scrollbar-thin">
        <div className="mb-2 flex items-center justify-between px-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-faint">Environments</p>
          <Button variant="quiet" size="sm" onClick={beginCreate}>
            New
          </Button>
        </div>
        {catalog.endpoints.length === 0 && !creating ? (
          <p className="px-3 text-[12px] text-mute">No environments yet. Add one to run operations.</p>
        ) : null}
        {catalog.endpoints.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setCreating(false);
              setEndpoint(item.id);
            }}
            className={`flex w-full flex-col items-start rounded-[8px] px-3 py-2 text-left ${
              !creating && item.id === endpoint?.id ? "bg-active" : "hover:bg-hover"
            }`}
          >
            <span className="flex items-center gap-2 text-[13px] text-ink">
              {item.name}
              {item.id === environmentId ? <span className="text-[10px] uppercase tracking-[0.12em] text-accent-text">Active</span> : null}
            </span>
            <span className="font-mono text-[11px] text-faint">{item.url || "No URL"}</span>
          </button>
        ))}
        {creating ? (
          <div className="rounded-[8px] bg-active px-3 py-2">
            <p className="text-[13px] text-ink">New environment</p>
            <p className="text-[11px] text-faint">Not saved</p>
          </div>
        ) : null}
      </div>
      <div className="min-w-0 flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
        {!endpoint && !creating ? (
          <div>
            <h1 className="text-[18px] font-semibold tracking-tight">Environments</h1>
            <p className="mt-1 text-[13px] text-mute">
              Environments hold the GraphQL URLs, default headers, and which server a run hits.
            </p>
            <Button variant="primary" className="mt-4" onClick={beginCreate}>
              Add environment
            </Button>
          </div>
        ) : (
          <div className="max-w-[520px]">
            <h1 className="text-[18px] font-semibold tracking-tight">{creating ? "New environment" : form.name || "Environment"}</h1>
            <p className="mt-1 text-[13px] text-mute">
              Used when you run a query. Request headers in the run workbench override these.
            </p>
            <Field label="Name" className="mt-5">
              <Input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Local"
                className="bg-elevated text-[13px]"
              />
            </Field>
            <Field label="Endpoint URL" className="mt-3">
              <Input
                mono
                value={form.url}
                onChange={(event) => setForm({ ...form, url: event.target.value })}
                placeholder="http://127.0.0.1:4000/graphql"
                className="bg-elevated"
              />
            </Field>
            <label className="mt-3 flex items-center gap-2 text-[13px] text-ink">
              <input
                type="checkbox"
                checked={form.isProduction}
                onChange={(event) => setForm({ ...form, isProduction: event.target.checked })}
              />
              Production
            </label>
            <div className="mt-5">
              <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-faint">Default headers</p>
              <p className="mb-2 text-[11px] text-mute">Use {"{{SECRET_NAME}}"} in the URL or a header value.</p>
              <HeaderEditor pairs={form.headers} onChange={(headers) => setForm({ ...form, headers })} />
            </div>
            {!creating && form.id ? <SecretsPanel environmentId={form.id} /> : null}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                loading={saving}
                disabled={saving || !form.name.trim()}
                onClick={() => void onSave()}
              >
                {saving ? "Saving…" : creating ? "Create" : "Save"}
              </Button>
              {!creating && form.id ? (
                <>
                  <Button variant="ghost" onClick={() => setEnvironment(form.id!)}>
                    Use for runs
                  </Button>
                  <Button
                    variant="ghost"
                    loading={pulling}
                    disabled={pulling || !form.url.trim()}
                    onClick={async () => {
                      setPulling(true);
                      await pullEnvironmentSchema(form.id!);
                      setPulling(false);
                    }}
                  >
                    {pulling ? "Pulling…" : endpoint?.schemaPulled ? "Refresh schema" : "Pull schema from this URL"}
                  </Button>
                  <Button variant="quiet" className="text-danger hover:text-danger" onClick={() => void onDelete()}>
                    Delete
                  </Button>
                </>
              ) : null}
            </div>
            {!creating && endpoint ? (
              <p className="mt-6 text-[12px] text-mute">
                {endpoint.operationCount} operations can execute against this environment.
                {endpoint.schemaPulled ? " Schema pulled from this URL." : ""}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function SecretsPanel({ environmentId }: { environmentId: string }) {
  const [secrets, setSecrets] = useState<SecretRecord[]>([]);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    try {
      setSecrets(await fetchEnvironmentSecrets(environmentId));
    } catch {
      setSecrets([]);
    }
  };

  useEffect(() => {
    void reload();
  }, [environmentId]);

  const onAdd = async () => {
    if (!name.trim() || !value.trim()) return;
    setBusy(true);
    try {
      await upsertEnvironmentSecret(environmentId, name.trim(), value);
      setName("");
      setValue("");
      await reload();
    } catch {
      /* toast comes from graphql throw in caller if needed */
    }
    setBusy(false);
  };

  return (
    <div className="mt-5">
      <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-faint">Secrets</p>
      {secrets.length === 0 ? <p className="mb-2 text-[12px] text-mute">None yet. Stored in the local keychain.</p> : null}
      <ul className="mb-2 flex flex-col gap-1">
        {secrets.map((secret) => (
          <li key={secret.id} className="flex items-center justify-between gap-2 text-[12px]">
            <span className="font-mono text-ink">
              {secret.name} <span className="text-faint">••••{secret.lastFour}</span>
            </span>
            <Button
              variant="quiet"
              size="sm"
              onClick={async () => {
                await deleteEnvironmentSecret(secret.id);
                await reload();
              }}
              className="text-danger hover:text-danger"
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5">
        <Input mono value={name} onChange={(event) => setName(event.target.value)} placeholder="TOKEN" />
        <Input
          mono
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="value"
          type="password"
        />
        <Button
          variant="ghost"
          disabled={busy || !name.trim() || !value.trim()}
          onClick={() => void onAdd()}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
