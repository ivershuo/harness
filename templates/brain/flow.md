# Flow Memory

Non-trivial work follows this loop:

```mermaid
flowchart LR
  Explore --> Plan
  Plan --> Implement
  Implement --> Evaluate
  Evaluate -->|failures| Implement
  Evaluate -->|accepted| Record
```

Document other durable product or operational flows here.
