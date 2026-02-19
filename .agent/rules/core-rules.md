---
trigger: always_on
---

# Nobre Hub — Core Agent Rules

## Project Identity

- **App**: Nobre Hub — Modular ERP/CRM for a marketing agency
- **Stack**: Vite + React 18 + TypeScript + Zustand + Supabase + Vercel Functions
- **Design System**: `src/design-system/` — custom components + CSS tokens (see `design-system.md`)
- **Database**: Supabase (PostgreSQL) with RLS policies
- **API**: `api/` folder — Vercel Serverless Functions (plain JS)
- **Language**: Code in English, UI strings and comments in Portuguese (pt-BR)

## 1. Context Awareness (MANDATORY)

### Before ANY code change:
- READ the file being modified — understand its purpose and existing patterns
- CHECK if a similar pattern already exists in the codebase before creating new code
- RESPECT existing code style, naming conventions, and architecture
- NEVER rewrite an entire file when only a few lines need changing

### Project structure:
- Components: `src/features/{feature}/components/ComponentName/` (PascalCase folder + `.tsx` + `.module.css`)
- Services: `src/features/{feature}/services/`
- Stores: `src/features/{feature}/stores/` (Zustand)
- API routes: `api/` (Vercel Functions, plain JS with ES modules)
- Design system: `src/design-system/components/` + `src/design-system/tokens/`
- Imports: Use `@/` alias, import directly — no barrel files except design-system index

## 2. Workflow Rules

### Plan First
- Enter plan mode for ANY non-trivial task (3+ steps or architectural changes)
- If something goes sideways, STOP and re-plan — don't keep pushing
- Write detailed specs upfront to reduce ambiguity

### Verification Before Done
- NEVER mark a task complete without proving it works
- Run `npm run build` to verify TypeScript compiles without errors
- Ask yourself: "Would a staff engineer approve this change?"
- For UI changes: describe what to test visually or use browser tools

### Simplicity by Default
- Make every change as simple as possible with minimal code impact
- Find root causes — no temporary or hacky fixes
- Changes should only touch what's necessary — avoid cascading rewrites
- Only pursue "elegant" solutions when the simple approach has clear technical debt

## 3. Defensive Rules (CRITICAL)

### ❌ NEVER:
- Rewrite entire files when only a few lines need changing
- Remove existing code "to simplify" without asking the user
- Create new files or folders without clear justification
- Use hardcoded colors, spacing, or font sizes (use design system tokens)
- Leave `console.log` in code (use only temporarily during debug, then remove)
- Assume you understood ambiguous requirements — when in doubt, ASK
- Use native HTML elements (`<select>`, `<input>`, `<button>`) instead of design system components
- Install new dependencies without asking first
- Modify unrelated files as part of a fix

### ✅ ALWAYS:
- Read existing code before modifying it
- Use design system tokens (`var(--color-*)`, `var(--spacing-*)`) and components (`Button`, `Input`, `Modal`, etc.)
- Test hover, focus, and disabled states for UI components
- Keep changes minimal, focused, and reversible
- Explain non-obvious decisions with brief comments
- Verify the build passes after making changes

## 4. Autonomous Bug Fixing
- When given a bug report: investigate → fix → verify. Don't ask for hand-holding.
- Check logs, errors, and failing tests — then resolve them
- Zero context switching required from the user
- If the bug is ambiguous, ask ONE clarifying question, not a list of 10

## 5. Communication
- Be direct and concise — no filler or excessive praise
- Acknowledge mistakes openly when backtracking
- Respond in the same language the user writes (pt-BR or EN)
- Never say "You're absolutely right!" — verify before implementing feedback
- When uncertain, ask one specific question rather than a wall of options

## 6. Git Conventions
- Commit format: `<type>(<scope>): <subject>`
- Types: `feat` / `fix` / `refactor` / `chore` / `docs` / `perf` / `test`
- Always check current branch before committing
- Never push directly to main without confirmation
