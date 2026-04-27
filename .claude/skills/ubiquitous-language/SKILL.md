---
name: ubiquitous-language
description: Extract domain terms from the current conversation or active PRD and append them to docs/glossary.md. Maintains a shared vocabulary across product, design, and dev. Use when user says "/glossary" or "extract the terms".
disable-model-invocation: true
---

# Ubiquitous Language Glossary

Extract domain terms used in the active PRD (or the current conversation) and add them to `docs/glossary.md`.

## What's a "domain term"?

A term that:
- Has a specific meaning in this product (not generic English).
- Could be misinterpreted if used loosely (e.g., "scheduled" vs "drafted" vs "queued" vs "published").
- Will be referenced by designers and devs downstream.

Skip generic words like "user", "page", "click" — only capture terms with **product-specific weight**.

## Output

Append to `docs/glossary.md`. Use the existing table format:

```markdown
| Term | Definition |
|---|---|
| Scheduled article | An article with a future publish timestamp; not visible to readers until that timestamp passes. |
| ... | ... |
```

If a term already exists in the glossary, **update** the definition only if the new context refines it. Do not duplicate rows.

## Process

1. Read the active PRD (find latest `docs/prds/*.md`).
2. List candidate terms (5-15 max).
3. Show the user the candidates with proposed definitions.
4. User accepts/edits/removes.
5. Append accepted rows to `docs/glossary.md`.
6. Confirm path and row count to the user.
