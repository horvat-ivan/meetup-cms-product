# meetup-cms-product

The **product** repo in the Meetup CMS multirepo workflow.

This is where:
- Product Requirements Documents (PRDs) are written.
- The feature glossary lives.
- Cross-repo dispatch & status sync GitHub Actions are defined.

## Quickstart for PMs

1. Clone this repo.
2. Open in Claude Code.
3. Run `/draft-prd` to start a new feature.
4. Push the resulting PRD to `main` — it auto-creates issues in `meetup-cms-design` and `meetup-cms-app`.

## Spec

See `docs/architecture/2026-04-27-meetup-cms-multirepo-design.md` for the full workflow design.

## Companion repos

- `meetup-cms-design` — designer's repo (Pencil/Figma + UX exploration)
- `meetup-cms-app` — engineering repo (TanStack + NestJS + Postgres)
