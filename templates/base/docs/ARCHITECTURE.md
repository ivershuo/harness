# Architecture

Document the system shape that contributors must preserve.

## Purpose

Explain what the system owns, what it does not own, and its external systems.

## Boundaries

- Define major modules, services, packages, or layers.
- State allowed dependency directions.
- List forbidden shortcuts across boundaries.

## Public Interfaces

Track stable APIs, schemas, events, CLI commands, configuration, and extension
points. Include compatibility expectations and migration rules.

## Data Flow

Describe critical request, job, event, and state transitions.

## Change Rules

- New public interfaces need tests and documentation.
- Shared abstractions need real callers or a clear ownership reason.
- Architecture exceptions belong in `docs/agent/decisions/`.
