# ADR-0003 — SSRF-Safe GraphQL Execution Proxy

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-08-05 |
| Deciders | GraphScope architecture |

## Context

The execution workspace must call customer-controlled GraphQL HTTP endpoints. This is a classic SSRF risk (cloud metadata, internal networks).

## Options

1. **Browser-direct execution** — avoids server SSRF; breaks secrets, CORS, audit
2. **Naive server proxy** — simple; unsafe
3. **Hardened server proxy** with DNS/IP policy, timeouts, size caps, allowlists

## Decision

Implement a **server-side hardened proxy** in `execution-service` with:

- HTTPS/HTTP only; redirects disabled
- DNS resolution with private/link-local/metadata IP denial (default)
- Optional hostname allowlists for production environments
- Timeouts and response body caps
- Secrets injected server-side; never echoed
- Explicit opt-in `EXEC_ALLOW_PRIVATE_NETWORKS` for self-host lab only

## Rationale

- Secrets and audit require server-side execution
- SSRF is a portfolio-visible security control
- Browser-direct cannot meet enterprise requirements

## Consequences

- Some legitimate private-network endpoints blocked in cloud SaaS (by design)
- Must maintain an evolving blocklist/allowlist and security tests as a release gate

## Follow-ups

- DNS rebinding mitigations (connect to resolved IP + TLS SNI/Host)
- Egress proxy / dedicated network namespace in prod
