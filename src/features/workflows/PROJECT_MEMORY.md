# Workflow Project Memory

## Current Status (2026-07-21)

The workflow frontend now has a real four-node minimum closed loop:

`Start -> HTTP -> LLM -> End`

Execution is not mocked. The page uses real authentication, a real agent ID, real persistence APIs, and the real SSE run API. Success, failure, cancellation, and rerun behavior have been accepted in the browser against the existing backend.

Phase conclusion: the four-node MVP, single-agent lifecycle, and extensible node architecture are closed. The main path now shifts from completing infrastructure to adding real business nodes in product-priority order.

Confirmed capabilities:

- The agent ID comes only from the route. A route without an ID represents a new workflow.
- A new workflow starts with Start and End only. After its first successful save, the real backend ID is written to the route.
- A route with an ID loads `agentSetting` and restores nodes, edges, configuration, and viewport.
- TanStack Query handles model-list, read, save, and delete requests.
- `/gpt/base/workflows/run` executes the real SSE workflow.
- lodash-es compares persistent payloads. Unsaved changes disable Run, while reverting to the saved configuration restores it automatically.
- Start, HTTP, LLM, and End each own their node module, panel, protocol conversion, validation, and execution details.
- Nodes support `idle / running / success / error / cancelled / skipped` states.
- The run debugger shows node inputs, outputs, logs, duration, and errors, with copy support.
- While running, the debugger's bottom-right send button becomes a red Stop button. Cancellation marks the active node cancelled, downstream nodes skipped, and allows a rerun.
- Node configuration and debug execution share one right-side Dock. The modes are mutually exclusive, do not cover the canvas, and closing debug restores node configuration.
- Closing and reopening debug preserves messages and node results. Results reset only after a successful workflow save, a manual reset, or an agent switch.
- Node and full-flow backend JSON can be viewed, formatted, copied, and remains read-only so it cannot bypass node contracts or validation.
- HTTP supports independent success and exception branches. Its `catchError`, error output, handles, serialization, and edge validation are complete.
- HTTP debug data recursively redacts Authorization, tokens, secrets, passwords, and cookies.

## Reference Policy

Reference project:

`/Users/jiehao/Desktop/aiflow/agent-open-cloud-protal/src/features/workflow`

Migration boundary:

- The reference frontend defines the feature fields and interaction semantics to migrate; reuse its protocol, serialization, and variable-reference behavior.
- The current backend is used for integration, runtime verification, and discrepancy attribution. A missing backend implementation does not justify removing a reference-frontend capability; discrepancies are tracked in `NODE_MIGRATION_PLAN.zh-CN.md`.
- Preserve AI-flow-admin's React, TanStack Query, shadcn, Tailwind token, and light/dark theme systems.
- Do not migrate mocks, experimental fields, abandoned UI, or speculative features without backend contracts.
- When the reference has a defect, confirm the difference first and apply a focused fix instead of replacing real protocol behavior with guesses.

## Core Contracts

Frontend canvas:

- React Flow nodes, edges, and viewport.
- Node configuration and independent execution state.
- Variable references use `{{nodeId.outputKey}}`.

Backend execution:

- `modules`.
- `edges`.
- `chatConfig.variables`.
- `flowNodeType`.
- Module inputs and outputs.

Variables must reference real upstream outputs. Missing nodes or fields fail validation; the application never guesses or rewrites a node ID.

## Phase Status

### Phase 1: Execution Experience

Completed the node state machine, active-edge feedback, run progress, success/failure/cancel/skip settlement, final result, and node execution details.

### Phase 2: Complete Agent Lifecycle

Completed route-based agent IDs, loading, first creation, update, deletion, dirty comparison, saved-baseline updates, refresh restoration, and the single policy that unsaved workflows cannot run.

The agent list is outside the `workflows` module boundary. It only needs to provide a real agent ID entry later.

### Phase 3: Stabilized Node Contracts

Start, LLM, and End defaults, inputs/outputs, serialization, parsing, and validation are split into independent contracts.

### Phase 4: Extensible Architecture

Completed `WorkflowNodeModule` and `NODE_MODULE_REGISTRY`. The library, creation, panels, connection rules, serialization, parsing, validation, and execution details dispatch through the registry instead of growing shared node-type switches.

### Phase 5: Complete HTTP Node Migration

Completed backend type `httpRequest468`, dynamic inputs, Params, Body, Headers, secrets, dynamic outputs, variable references, bidirectional conversion, and the shadcn configuration panel.

### Phase 6: Real SSE State Machine

Backend events now settle node completion, node failure, workflow completion, workflow failure, and user cancellation. A normally closed SSE connection is no longer treated as business success by itself.

### Phase 7: Real Backend Browser Acceptance

Verified against the real backend:

- Start -> HTTP -> LLM -> End completes successfully.
- LLM can be stopped while running; it becomes cancelled and downstream nodes become skipped.
- A failed or cancelled run can be started again.
- HTTP and LLM expose real inputs, outputs, and duration.
- HTTP Authorization is displayed as `***` in debug details.
- Benign normalization of legacy backend data does not create a false dirty state; genuinely dropped unsupported nodes or edges still require a migration save.

### Phase 8: Compatibility Cleanup and Documentation

Confirmed removal of the old mock execution fields and legacy run-store APIs. The execution context is now the single source of truth for runtime state. Configuration and debug now share one Dock, run results follow the save lifecycle, read-only node and flow backend JSON views are available, and HTTP exception handling is aligned across UI, protocol, and validation. Chinese and English project memory now describe the same real four-node implementation.

### Phase 9: Phase-Two Node Migration

- Fixed reply (`answerNode`) passed real-backend save, refresh restoration, and runtime acceptance.
- Text concat (`textEditor`) passed real-backend save, refresh restoration, and runtime acceptance.
- Condition (`ifElseNode`) has completed frontend implementation and TypeScript validation, including the reference frontend's non-empty and six length operators. Base comparisons and IF / ELSE IF / ELSE passed real-backend acceptance on 2026-08-04; unsupported backend operators are recorded in the discrepancy ledger.
- Variable update (`variableUpdate`) has completed its independent registry module, configuration panel, protocol conversion, variable references, data-type selection, and validation. Fixed and referenced assignments passed real-backend acceptance on 2026-08-04; the backend's unused `valueType` field is recorded in the discrepancy ledger.
- Intent classification (`classifyQuestion`) has completed its independent registry module, model and input configuration, dynamic categories, fixed `other` fallback branch, protocol conversion, variable references, connection validation, runtime state, and debug details. Real-backend save, refresh restoration, custom-category, and fallback-branch acceptance passed on 2026-08-10.
- File parsing (`readFiles`) now has its independent registry module, attachment variable, smart OCR, success/error branches, protocol conversion, variables, validation, runtime state, and debug details. The current backend implements `smartParse`, so the reference UI's stale "under development" blocker was intentionally excluded. Real upload, save, refresh restoration, and execution paths have passed. PDF/Word/Excel may currently return binary mojibake because the backend `RemoteFileService#getAttachmentById` path does not match the file service's actual `getFileById` endpoint, causing the extension to fall back to `txt`; the frontend intentionally does not mask this backend defect, and it does not block completion of the frontend node migration.
- Knowledge-base search (`datasetSearchNode`) now has independent registry integration, multi-dataset selection, fixed/reference query input, a dedicated search-parameter dialog, semantic/full-text/hybrid modes, similarity and result limits, Rerank model and weight controls, protocol conversion, variables, validation, success/error branches, runtime state, and debug details. Node creation and the configuration panel were accepted on 2026-08-17. The backend currently has no usable dataset or indexed document, so real save, refresh restoration, and retrieval runtime acceptance are deferred; the unused rerank-weight field remains recorded in the discrepancy ledger.
- Code execution (`code`) now follows the reference frontend with independent registry integration, JavaScript/Python script configuration, dynamic inputs and outputs, fixed system outputs, protocol conversion, variables, validation, success/error branches, runtime state, and debug details. Save, refresh restoration, JavaScript success-path, and error-branch acceptance passed on 2026-08-24. The current backend sends Python-configured scripts to its JavaScript engine, and this discrepancy is recorded in the migration ledger.
- Database (`databaseQuery`) now follows the reference frontend with independent registry integration, MySQL/Oracle/Kingbase connection settings, fixed/referenced SQL, protocol conversion, variables, validation, success/error branches, runtime state, debug details, and password redaction. TypeScript validation, a real MySQL connection, a successful `SELECT 1 AS ok` query, and the missing-table error branch passed acceptance on 2026-08-24.
- Base chart (`chartVisual`) now follows the reference frontend with independent registry integration, line/bar/pie modes, fixed or referenced title and axis data, output control, protocol conversion, variables, validation, runtime state, and debug details. TypeScript validation, real save, refresh restoration, all three chart modes, and referenced-title runtime acceptance passed on 2026-08-24. The backend currently comments out image rendering so `chartBase64` is always empty, and disabling `outputChart` also clears `chartData`; both gaps are recorded in the discrepancy ledger.
- The reference UI's `isNotEmpty` and length-comparison operators were intentionally excluded because the current `IfElseNodeExecutor` does not implement them.
- The canvas keeps exactly one Start and now allows one or more End nodes. End is available in the node library and is deletable; reachability is evaluated against all terminal nodes, and completely disconnected nodes cannot be saved.

## Known Limits

- The backend mainly supplies complete inputs and outputs with node-completion events. It does not provide a stable node-start event carrying inputs. A node can therefore be shown accurately as running, while its complete I/O normally appears after completion.
- Stop is intentionally centralized in the run debugger instead of duplicated in the toolbar.
- The HTTP node can call third-party endpoints. Third-party API tokens must come from the business user and must not reuse this application's login token.
- Multimodal capability detection, dynamic attachment-button visibility, and attachment-binding validation are deferred until product requirements are explicit. They do not block acceptance of the current four-node loop.
- Vitest or another automated test dependency has not been introduced. Acceptance currently uses the real backend in the browser plus lightweight static checks, as agreed.
- A React Router future-flag warning remains, but it is unrelated to workflow execution.

## Next Step

The publish entry, real agent list, and formal chat are integrated. The workflow run conversation and Agent Assistant now share one content admission policy, message model, and message-body renderer. Plain text, base charts, and knowledge citations use the unified durable path; reasoning and suggested questions use the unified transient path. Database tables and other final results without persistence contracts remain withheld from both conversation entry points.

The dual-lifecycle conversation foundation is complete. Question guide is now a registered `transient` interaction using the shared SSE parser, card renderer, and click-to-ask behavior; it is excluded from formal message persistence and history restoration. The editor still does not migrate the reference project's hidden `userGuide.questionGuide.open` setting, so only agents whose backend configuration already enables it will emit the event.

Knowledge citations now cover the reference frontend's AgentSearchData / sources / quoteQA compatibility, recalled-image gallery, chunk details, original-document preview, Office-to-PDF preview, and download behavior. Live and historical messages continue to use the same persisted `reference` data and renderer. Real retrieval and media acceptance remain deferred because the current backend environment has no usable dataset or indexed document.

The loop frontend implementation and TypeScript check are complete. `loopRun` is independently registered as a parent container and automatically creates protected `loopRunStart` / `loopRunBreak` children. It supports moving business nodes into and out of the container, parent-relative canvas coordinates with absolute backend positions, `parentNodeId` and child-list round trips, scoped inner variables, dynamic loop outputs, cross-boundary connection validation, runtime status, and debug details. Runtime acceptance corrected `currentItem` to dynamic `any` and now allows an ordinary leaf child with no outgoing edge to end the current iteration naturally. Only the backend's array mode is exposed; conditional mode remains a placeholder, and the backend condition executor still throws when ELSE has no edge, so conditional early-break semantics are not closed. Next, verify plain array traversal plus save and refresh restoration.

### Formal chat rich-content release boundary (2026-08-24)

- `src/features/message-render/CHAT_CONTENT_CAPABILITY.zh-CN.md` is the authoritative ledger for reference-frontend support, backend runtime and persistence contracts, migrated state, exclusions, and admission rules.
- Formal chat only renders final response content that supports live rendering, persistence, and history restoration together.
- Currently allowed: plain text, base charts (`echarts`), and knowledge citations (`reference`).
- Question guide is an explicit transient interaction: both entry points render it live, but it is excluded from `answer` / `contents` and is not restored after refresh.
- Database tables may appear in node-specific debug details, but are withheld from both conversation entry points because the backend `contents` contract has no table type.
- Reasoning is an explicit transient block shared by both conversation entries: it is live-only, excluded from `answer` / `contents`, removed before the next question, and never downgraded into durable Markdown when no formal answer is returned.
- Node status, duration, inputs, outputs, and branch details belong to the node-debugging system and are not conversation content.

Every node must deliver its module, configuration panel, protocol conversion, variable contract, connection and business validation, execution state, debug details, and real-backend acceptance. A visual node alone is not complete.

## Reporting Note

The AI-flow-admin workflow frontend has completed a real backend loop across Start, HTTP, LLM, and End, including agent creation/read/save/delete, refresh restoration, variable flow, SSE execution state, node debugging, cancellation, and rerun. The node registry, independent contracts, unified right-side Dock, retained run results, backend JSON views, and HTTP exception branch are complete. The MVP is ready for stable demonstration and integration. Future work formally shifts from closing the minimum loop to expanding node capabilities in an explicitly prioritized product order.
