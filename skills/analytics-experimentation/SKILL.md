# Skill: Analytics & Experimentation

## Use when

Adding or changing telemetry, funnels, KPIs, retention measurements, experiment exposure, A/B tests or balance-observation events.

## Required reading

- `AGENTS.md`
- `docs/ANALYTICS.md`
- `docs/IP_POLICY.md`

## Rules

1. Start from the product question the event should answer. Do not track data merely because it is available.
2. Reuse the typed event vocabulary when semantics match. Never silently repurpose an existing event.
3. Keep payloads bounded and aggregate. No PII, free-form text, fingerprinting or raw save payloads.
4. Avoid high-frequency events such as individual shots/hits when a lower-volume outcome event answers the question.
5. Telemetry is best-effort and must never block gameplay, saves or rewards.
6. Platform/vendor analytics calls remain behind adapters.
7. Add deterministic tests for timing/once-only funnel behavior when practical.
8. When introducing an experiment, record exposure before interpreting outcome metrics and document the hypothesis.

## Definition of done

The event has a documented purpose, typed schema, privacy review, stable semantics and a test or validation path. The intended dashboard/funnel can be derived from the emitted events without relying on undocumented client state.
