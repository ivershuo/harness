# Architecture

Document the system shape that agents and humans must preserve.

## Purpose

Explain what the system is responsible for, what it deliberately does not own,
and which external systems it integrates with.

## Boundaries

- Define the major modules, services, packages, or layers.
- State allowed dependency directions.
- List forbidden shortcuts, such as UI code importing database internals or
  workers bypassing domain services.

## Public Interfaces

Track stable APIs, schemas, events, CLI commands, config files, and extension
points. Include compatibility expectations and migration rules.

## Data Flow

Describe the critical request, job, event, or state transitions that must stay
coherent. Prefer diagrams or concise flow lists over file-by-file tours.

## Change Rules

- New public interfaces need tests and docs.
- Shared abstractions need at least two real callers or a clear ownership reason.
- Large central files should not grow without a documented staging plan.
- Architecture exceptions must be recorded in `docs/agent/decisions/`.
