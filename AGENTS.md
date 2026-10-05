# Peek

An icon library in the spirit of Boring Avatars: a string in, a deterministic
SVG out. A Doan Labs project.

Turborepo on bun workspaces. `apps/web` is the site: TanStack Start (React 19),
Router file routes, StyleX, Vite 8, Biome.

`AGENTS.md` is canonical and `CLAUDE.md` is a symlink to it, the same way
`.claude/skills` is a symlink to `.agents/skills`. Never replace either with a
real file.

## How to use this file

- **Rules only.** An entry here is an instruction an agent can follow or
  break. If a line does not change a decision, it does not belong.
- **No fluff.** No history, no rationale essays, no changelog. Rationale goes
  in the file's own header comment or the commit message.
- **Do not update this file unless asked**, or unless a change you just made
  turns a line here into a lie.

## Where it is

`/` is the coming soon page, the teaser's last frame made live. The library
is `packages/peek` (`@doanlabs/peek`, unpublished); `docs/variants.md` is its
model. `/docs` is sidebar docs from one source, `apps/web/src/lib/docs.ts`, which
also builds `/llms.txt`, `/llms-full.txt` and each page's copy prompt. Edit
content there, never in the components. `/studio` is the full
playground, held back until release: never list it in the prerender pages
or link to it. The creature rig in `apps/web/src/lib/rig.ts` is transcribed
from the Avatar Studio sketch (v1.1); "Avatar Studio" was a mockup name, the
product is **Peek**.
Deploys to Cloudflare Workers as static assets: only the pages listed in
`vite.config.ts` prerender and ship, and the root `wrangler.jsonc` serves
`apps/web/dist/client`.
`../avatars-poc/engine.js` is the prior sketch of the idea: string hash,
seeded rng, palettes, pure SVG.

## Motion

`motion` (`motion/react`) for page choreography, the rig's own springs for
the creatures. Load the `motion` skill before new animation.

- **Beats live in `BEAT`** in `lib/motion.ts`. Curves and springs come from
  the same file; never an inline easing.
- **Reduced motion cuts the duration to `NONE`, never the `initial` pose.**
  `useReducedMotion()` is null on the server.
- **Anything read every frame is a mutable object or a DOM write**, never
  React state. Rigs step from one shared loop in `creatures.tsx`.
- Rig tables (`SHAPES`, `STATES`, `CHOREO`) are transcribed. Tune them, do
  not redraw them by eye.

## Rules

- **The library is deterministic.** The same input renders the same SVG, on
  the server and the client. The page's creatures may be random in what they
  do, never in what they are.
- **Pure SVG, no runtime deps** in anything that ships as the library.
- **Always "Doan Labs", never "Doan" alone**, in copy and in comments.
- **Never an em dash**, in copy or in comments. Comma, colon, period or a
  middle dot.
- Brand rules travel: `../doan-labs.com/AGENTS.md` applies to anything this
  says. No services language, no category claim, never invent facts.
- **Commit only when Thanh asks**, never with AI attribution.

## Working here

```
bun install
bun run dev            # turbo, apps/web on :5173
bun run build
bun run check-types
bun run lint
```

Everything runs from the root through `turbo run`. A new workspace goes in
`apps/*` or `packages/*`. `apps/web/src/routeTree.gen.ts` is generated on dev
and build, never edited.

## Code style

`biome.json` is the source of truth: 2-space indent, single quotes (JSX too),
semicolons as needed, trailing commas, 80 columns.

- **Filenames** are kebab-case. Imports use the `@/` alias.
- **Styles are `stylex.create` in the component.** Tokens live in
  `apps/web/src/lib/tokens.stylex.ts`; never a hex in a component. Rules in
  [`docs/stylex-conventions.md`](docs/stylex-conventions.md).
- Route files export only `Route`. Route components are PascalCase with a
  role suffix (`HomePage`).
- React 19: no `useMemo`, `useCallback` or `memo` without a measured reason.

A PostToolUse hook runs `biome check --write` on every file written through
Edit or Write. A file written from the shell needs
`bunx biome check --write <file>`.

## Skills

Project skills live in `.agents/skills/` (symlinked as `.claude/skills/`):

| Skill | Use for |
| --- | --- |
| `tanstack-start` | Routes, server functions, SSR, env, deploy. Read `SKILL.md`, then the one rule file it names. |
| `svg-animations` | Anything drawn: the icons, their motion. |
| `motion` | Easing and animation audits. |

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
