import { CodeBlock } from "@/components/CodeBlock";
import type { GraphQLType } from "@/data/types";
import { useExplorer } from "@/store/explorer-store";

const ROOTS = ["Query", "Mutation", "Subscription"];

export function SchemaView() {
  const catalog = useExplorer((s) => s.catalog);
  const schemaTypeId = useExplorer((s) => s.schemaTypeId);
  const setSchemaType = useExplorer((s) => s.setSchemaType);
  const setView = useExplorer((s) => s.setView);
  const type = catalog.typesById[schemaTypeId] ?? catalog.types[0];
  const pulled = catalog.types.some((item) => item.source === "introspected");
  const env = catalog.endpoints.find((item) => item.schemaPulled) ?? catalog.endpoints[0];

  const roots = ROOTS.map((name) => catalog.types.find((item) => item.name === name)).filter(Boolean) as GraphQLType[];
  const groups: Array<{ label: string; items: GraphQLType[] }> = [
    { label: "Objects", items: catalog.types.filter((item) => item.kind === "OBJECT" && !ROOTS.includes(item.name)) },
    { label: "Inputs", items: catalog.types.filter((item) => item.kind === "INPUT") },
    { label: "Enums", items: catalog.types.filter((item) => item.kind === "ENUM") },
    { label: "Interfaces", items: catalog.types.filter((item) => item.kind === "INTERFACE") },
    { label: "Connections", items: catalog.types.filter((item) => item.kind === "CONNECTION") },
  ];

  return (
    <div className="flex h-full min-w-0">
      <div className="w-[220px] shrink-0 overflow-y-auto border-r border-line px-2 py-3 scrollbar-thin">
        <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-faint">Schema</p>
        {roots.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSchemaType(item.id)}
            className={`flex h-7 w-full items-center rounded-[6px] px-2 font-mono text-[12px] ${
              item.id === type?.id ? "bg-active text-ink" : "text-mute hover:bg-hover hover:text-ink"
            }`}
          >
            {item.name}
          </button>
        ))}
        {groups.map((group) =>
          group.items.length === 0 ? null : (
            <div key={group.label}>
              <p className="mt-3 px-2 pb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-faint">{group.label}</p>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSchemaType(item.id)}
                  className={`flex h-7 w-full items-center rounded-[6px] px-2 font-mono text-[12px] ${
                    item.id === type?.id ? "bg-active text-ink" : "text-mute hover:bg-hover hover:text-ink"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          ),
        )}
      </div>
      <div className="min-w-0 flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
        {!type ? (
          <p className="text-[13px] text-mute">No types yet. Scan a repo or pull a schema from an environment.</p>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-2">
              <h1 className="text-[18px] font-semibold tracking-tight">{type.name}</h1>
              <span className="rounded-[4px] bg-elevated px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-mute">
                {type.source === "introspected" ? "From endpoint" : "Inferred"}
              </span>
            </div>
            <p className="mb-3 text-[12px] text-mute">
              {pulled
                ? `Schema from ${env?.name ?? "environment"}. Inferred types stay labeled.`
                : "Inferred from operations in the repo. Pull a schema on Environments to see the live API."}
              {!pulled ? (
                <button type="button" onClick={() => setView("endpoints")} className="ml-2 text-accent-text hover:underline">
                  Environments
                </button>
              ) : null}
            </p>
            <p className="mb-3 text-[12px] text-mute">{type.kind}</p>
            <CodeBlock code={type.sdl} language="graphql" />
          </>
        )}
      </div>
    </div>
  );
}
