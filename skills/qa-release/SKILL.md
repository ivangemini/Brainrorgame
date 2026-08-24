# Skill: QA & Release

## Use when
Preparing a milestone, release candidate, portal submission, production deployment or regression pass.

## Required references
Read `docs/QUALITY_GATES.md`, `docs/IP_POLICY.md`, and `docs/PLATFORM_ARCHITECTURE.md`.

## Release checklist
- Run `npm run verify`.
- Play first-session flow from clean storage.
- Test reload during/after progression changes.
- Test low/no network where applicable.
- Test ad interruption and return.
- Test mobile portrait and supported desktop layout.
- Review screenshots for clipping, low-res art, placeholders and debug UI.
- Audit production asset provenance.
- Verify no secret/test endpoints/debug flags ship.
- Verify portal-specific requirements and metadata.
- Confirm analytics events required for launch metrics fire once and with correct semantics.

A release candidate with a known visual placeholder is not a release candidate.
