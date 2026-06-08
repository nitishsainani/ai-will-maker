# DECISIONS.md

Five choices that shaped the system. Each: **what we picked**, **what we didn't**, **why**.

---

## 1. Contract-driven interview (full `willDraft` JSON per turn)

**Choice:** Every AI turn returns one JSON object: `assistantMessage` + complete merged `willDraft`. We validate with Zod, normalize mistakes (`normalize-ai-response.ts`), and persist to `will.metadata.interviewDraft`.

**Alternatives:**
- **Per-fact extraction** — model emits `MemoryFact` key/value pairs; mapper applies to aggregate.
- **Tool/function calls** — structured updates via provider tools.
- **Relational writes per turn** — hydrate DB on every message.

**Why:** One source of truth. No drift between “what chat remembers” and “what the will contains.” Parse failure keeps the prior draft. Tradeoff: large output every turn (latency + cost) and the model must reliably merge, not delta.

**Code:** `ai-text-contract.constants.ts`, `interview-draft.service.ts`, `packages/will-contract/`

---

## 2. Hybrid memory — summarize dialogue, never summarize the draft

**Choice:** `HybridMemoryStrategy` — full message history until 12 turns, then rolling summary + last 6 messages. **Full `willDraft` JSON is always in the system prompt** regardless of strategy.

**Alternatives:**
- **Full context always** — best recall, unbounded cost.
- **Summarize everything** — cheap, loses structured data.
- **RAG over messages** — more infra, harder to debug.

**Why:** “Forgetting” is usually lost *dialogue*, not lost *draft fields* — if beneficiary name is in `willDraft`, it survives summary compression. Tradeoff: summary refresh is a second model call; long threads still pay for a growing draft blob in every prompt.

**Code:** `hybrid-memory.strategy.ts`, `rolling-summary.service.ts`, `memory-config.ts`

---

## 3. Draft in JSON metadata, relational on submit

**Choice:** During `DRAFT`, interview state lives in `will.metadata.interviewDraft`. Relational tables populate on `submitForReview` / `finalize` via `DraftHydrationService`. API reads draft for UI; domain rules run on hydrated entities.

**Alternatives:**
- **Relational only** — many partial rows, awkward interview UX.
- **JSON only** — weak querying, no FK integrity until late.
- **Separate interview table** — cleaner boundary, more sync logic.

**Why:** Fast iteration in chat without orphan beneficiary rows. Validation and documents use the normalized model when it matters. Tradeoff: two representations until hydration; validation endpoint must hydrate or it lies.

**Code:** `draft-hydration.service.ts`, `will.mapper.ts`, `schema.prisma`

---

## 4. Validation as specifications with three severities

**Choice:** `ValidationEngine` runs pluggable specs. Issues bucket into `completion` (unfinished), `error` (blocking), `warning` (advisory). Profiles: `review` blocks on errors only; `finalize` blocks on errors + completion.

**Alternatives:**
- **One flat validator** — simple early, unmaintainable later.
- **JSON Schema on draft** — good for shape, weak for cross-field rules (guardian for minor, allocation sums).
- **AI-as-validator** — non-deterministic, not auditable.

**Why:** Product can show “still needed” vs “legally wrong” vs “worth checking.” New rule = new spec class. Tradeoff: specs run on aggregate, not raw draft JSON — hydration must happen first.

**Code:** `validation-engine.ts`, `default-validation-specifications.ts`, `validation-panel.tsx`

---

## 5. SSE + incremental JSON parse for “typing” UX

**Choice:** Interview streams via SSE. Model returns JSON; `AssistantMessageStreamExtractor` incrementally pulls `assistantMessage` from the token stream so the UI can type ahead of parse completion. Full response is validated only at end.

**Alternatives:**
- **Plain-text stream** — natural typing, no structured draft without a second pass.
- **Wait for full JSON** — simple, feels frozen until 12s response completes.
- **WebSockets** — bidirectional, heavier ops story.

**Why:** Users need to *see* replies while the model also emits a large `willDraft`. Tradeoff: fragile — if the model wraps JSON badly or puts `assistantMessage` late in the payload, typing stalls or shows garbage. We accept parser complexity to avoid double round-trips.

**Code:** `assistant-message-stream.extractor.ts`, `ai-interview.service.ts`, `use-interview-chat.ts`

---

## 6. Monorepo + ports for swappable adapters

**Choice:** `will-domain` has zero framework imports. API wires `IAIProvider`, `MemoryManager`, `WillRepository`, `DocumentGenerator` via Nest tokens. OpenAI/Claude and PDF/HTML are infrastructure adapters.

**Alternatives:**
- **Single Nest app, fat services** — faster to ship, rules leak to controllers.
- **Microservices** — premature for assessment scope.

**Why:** Legal rules and validation survive vendor changes. Interview is the highest-churn boundary — ports contain it. Tradeoff: boilerplate (mappers, DTOs, tokens).

**Code:** `packages/will-domain/`, `infrastructure/ai/`, `infrastructure/interview/memory/`
