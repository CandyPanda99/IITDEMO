<!--
Sync Impact Report
Version change: unversioned template -> 1.0.0
Modified principles:
- [PRINCIPLE_1_NAME] -> I. Next.js App Router Is The Product Boundary
- [PRINCIPLE_2_NAME] -> II. Server Components Default, Client Components By Exception
- [PRINCIPLE_3_NAME] -> III. Strict Types And Validated Data Contracts
- [PRINCIPLE_4_NAME] -> IV. Canonical Data Flow And Persistence
- [PRINCIPLE_5_NAME] -> V. Minimal Dependencies And Clean Separation
Added sections:
- Stack Constraints
- Delivery Workflow & Quality Gates
Removed sections:
- None
Templates requiring updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
- ✅ .specify/templates/commands/*.md (no command template files present)
Follow-up TODOs:
- None
-->
# IITDemo Constitution

## Core Principles

### I. Next.js App Router Is The Product Boundary
All application delivery MUST stay within a single Next.js codebase using the App Router.
Frontend routes, layouts, server-rendered pages, and backend HTTP endpoints MUST be
implemented through App Router conventions and Route Handlers. Introducing a separate
frontend, a separate API service, or Pages Router code is prohibited unless this
constitution is amended first. Rationale: one runtime model reduces integration drift,
keeps deployment simple, and makes feature ownership unambiguous.

### II. Server Components Default, Client Components By Exception
React Server Components MUST be the default for pages, layouts, and data-backed views.
The `use client` directive MAY be used only at leaf components that require browser APIs,
event handlers, local interactivity, or React client hooks. Initial data loading MUST run
on the server whenever SEO, security, or first-render performance benefits from it.
Rationale: this preserves smaller client bundles, reduces unnecessary hydration, and keeps
data access closer to trusted server boundaries.

### III. Strict Types And Validated Data Contracts
TypeScript strict mode MUST remain enabled, and code that weakens static safety through
unchecked `any`, broad type assertions, or untyped external inputs MUST be rejected.
Zod schemas MUST validate all user input, route payloads, query parameters, and any
financially significant data before business logic runs. Forms MUST use React Hook Form
with Zod-backed validation. Rationale: the project handles data that requires predictable
shape guarantees, and runtime validation is mandatory at every trust boundary.

### IV. Canonical Data Flow And Persistence
Prisma schema and migrations MUST be the only source of truth for persisted data, and the
application database MUST be local SQLite unless a later amendment approves a different
store. TanStack Query MUST own asynchronous server-state caching, syncing, and invalidation.
Zustand MUST be limited to lightweight client-side UI or workflow state and MUST NOT become
an alternate source of truth for server data. Rationale: one persistence path and one
clear separation between server state and UI state reduce corruption, duplication, and
cache incoherence.

### V. Minimal Dependencies And Clean Separation
Every new dependency MUST have a clear, documented justification that the platform,
framework, or approved stack cannot satisfy with less complexity. UI components MUST stay
presentational where practical; reusable business logic MUST live in server modules,
validation modules, or custom hooks with clear responsibilities. Tailwind CSS and shadcn/ui
MUST be the primary styling and component foundation. DRY and SOLID principles MUST guide
refactoring, but abstractions MAY only be introduced when they remove real duplication or
reduce coupling. Rationale: small dependency surfaces and disciplined boundaries improve
maintainability without turning the codebase into premature architecture.

## Stack Constraints

- Framework: Next.js with App Router only, including Route Handlers for backend HTTP APIs.
- Language: TypeScript with strict mode enabled across application and test code.
- Styling: Tailwind CSS with shadcn/ui for accessible, reusable UI primitives.
- Persistence: Prisma ORM backed by a local SQLite database.
- Client state: Zustand for lightweight UI-only global state.
- Server state: TanStack Query for fetching, caching, synchronization, and invalidation.
- Forms: React Hook Form with Zod as the required validation path.
- Validation: No financial or persistence-bound input may bypass schema validation.
- Dependency policy: Prefer built-in Next.js, React, Prisma, and browser capabilities before
	adding third-party packages.

## Delivery Workflow & Quality Gates

- Every implementation plan MUST document server versus client component boundaries,
	validation boundaries, data ownership, and any Prisma schema or migration impact.
- Every specification MUST identify which data is server state, which state is UI-only,
	and where Zod validation is enforced.
- Every task list MUST include explicit tasks for schema changes, validation, Route Handler
	changes, query invalidation, and UI state work whenever those concerns are present.
- Changes to financial calculations, Prisma schema, Route Handler contracts, or shared Zod
	schemas MUST include automated tests covering the changed behavior.
- Code review MUST reject work that introduces `use client` above the leaf level without a
	documented need, duplicates server data into Zustand, adds unjustified dependencies, or
	bypasses Prisma and Zod at data boundaries.

## Governance

This constitution overrides local habits and template defaults when they conflict. Any
amendment MUST update this file, include a Sync Impact Report, and propagate required changes
to affected templates before implementation proceeds.

Versioning policy follows semantic versioning for governance documents:
- MAJOR: removes or materially redefines a principle or governance rule.
- MINOR: adds a new principle, section, or materially stronger mandatory guidance.
- PATCH: clarifies wording, fixes errors, or improves precision without changing intent.

Compliance review is mandatory at plan creation, task generation, code review, and before
merging constitution-affecting work. Reviewers MUST verify that implementation artifacts,
dependencies, and architectural boundaries remain consistent with this document.

**Version**: 1.0.0 | **Ratified**: 2026-03-25 | **Last Amended**: 2026-03-25
