---
description: Brainstorm a feature with me, then synthesize the conversation into a PRD file at docs/prds/<slug>.md
---

You are about to help the user draft a Product Requirements Document.

Workflow:
1. First, run the **superpowers:brainstorming** skill to elicit the feature definition through clarifying questions.
2. Once you have enough context (purpose, user stories, acceptance criteria, scope, constraints), run the **to-prd** skill to synthesize the conversation into a PRD file.
3. The output goes to `docs/prds/<YYYY-MM-DD>-<slug>.md`.

Remember: this repo is for **product**, not technical. Refuse any tech questions and redirect them to the app repo's `/design-doc`.

User input: $ARGUMENTS
