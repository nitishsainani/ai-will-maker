# INCIDENT.md

**Alert:** Users report the AI “forgets” answers from ~10 minutes ago. Reply latency is **12s** (was ~3s).

You are on call. Below: triage → likely causes in *this* design → fixes.

---

## 1. Triage (first 15 minutes)

| Check | Where | What good looks like |
|-------|--------|----------------------|
| Latency breakdown | APM / logs around `AiInterviewService.processMessage` | AI time vs DB `save()` vs summary call |
| Memory mode | `GET .../interview/status` → `memory.buildMode`, `estimatedTokens` | `full` early; `summary`/`hybrid` after threshold |
| Draft intact? | `will.metadata.interviewDraft` vs user complaint | Field present in DB but missing from reply = dialogue loss, not draft loss |
| Parse errors | Logs `PARSE_ERROR`, `needsClarification` spikes | Silent draft rollback |
| Message count | `conversation_messages` count for affected will | >12 triggers hybrid compression |

**Hypothesis split:**
- **“Forgot”** → context compression or model returned a partial `willDraft` merge.
- **12s slow** → large JSON completion + optional summary refresh + fat `save()`.

---

## 2. Root cause A — Contract problem (forgetting)

**Design:** We do not store facts in `conversation_memories`. The model must return the **full merged** `willDraft` every turn (`ai-text-contract.constants.ts`). Authoritative state is `metadata.interviewDraft`.

**Failure modes:**

1. **Model returns a delta** — drops fields not mentioned this turn. User said executor name 10 min ago; model omits it from `willDraft`. We persist the shrink-wrapped draft. *Looks like amnesia; it's a contract violation.*

2. **Parse/normalize failure** — `AiResponseParser` fails Zod; we keep old draft but assistant may claim something new. User sees contradiction.

3. **Dialogue summarized away** — after 12 messages, `HybridMemoryStrategy` drops old messages from context. Draft should still hold facts; if they were never written to `willDraft` (only mentioned in chat), they're gone.

**Fix (this codebase):**

| Action | Rationale |
|--------|-----------|
| Log `willDraft` field count / hash before & after each turn | Detect shrink merges quickly |
| Strengthen prompt: “NEVER drop existing willDraft fields” | Cheap guardrail |
| On parse success, diff draft keys vs previous; alert on deletion | Catch delta behavior |
| Ensure `getStatus()` exposes real `willDraft` to UI | User can verify backend state |
| Long term: server-side merge (apply user utterance to prior draft in code, model proposes patch only) | Remove merge burden from LLM |

**Not the fix:** Turning `MEMORY_STRATEGY=full` alone — helps dialogue recall, doesn't fix bad merges, **worsens latency/cost**.

---

## 3. Root cause B — Cost/latency (12s replies)

**Design:** Each turn sends **full `willDraft` JSON** in the system prompt plus dialogue (or summary). Hybrid may add a **second** `RollingSummaryService.complete()` call. Response must be **large JSON** (`assistantMessage` + entire draft). Then `PrismaWillRepository.save()` rewrites the will subgraph.

**Why 12s:**

```
prompt tokens ↑  (draft + summary + recent messages)
+ max output tokens ↑  (full willDraft JSON)
+ summary refresh (extra round trip every N turns after threshold)
+ DB save (delete-many + upserts per collection)
```

**Fix:**

| Action | Rationale |
|--------|-----------|
| Confirm `MEMORY_SUMMARY_REFRESH_INTERVAL` not too aggressive | Extra model call per turn |
| Cap draft size in prompt (send diff snapshot for model, full draft server-side only) | Cuts input tokens |
| Don't switch to agentic multi-step loops for interview | Each tool/agent hop = another 3–8s + multiplies cost (see below) |
| Persist messages incrementally; defer full `save()` until turn complete | Cuts DB time in critical path |
| Rate-limit + monitor `estimatedTokens` from status API | `INCIDENT` spend guard |

**Agent trap:** A “fix” that spawns sub-agents (extract → validate → merge → respond) improves accuracy but **triples cost and latency**. Our contract-driven single-shot turn is intentional. If we add agents, they belong offline (hydration/validation), not in the SSE hot path.

---

## 4. Root cause C — JSON streaming / typing UX

**Design:** SSE streams raw model tokens. The UI can't display plain text — the model emits JSON. `AssistantMessageStreamExtractor` scans for `"assistantMessage":"..."` and streams decoded characters early.

**Failure modes:**

1. **Model puts `assistantMessage` last** — user sees blank chat for 10s, then text bursts. Feels like 12s latency even if network is fine.

2. **Invalid JSON mid-stream** — extractor stalls; frontend shows nothing or partial garbage.

3. **Huge `willDraft` before `assistantMessage`** — tokens arrive but extractor is still in `seeking` phase.

**Fix:**

| Action | Rationale |
|--------|-----------|
| Prompt: `assistantMessage` MUST be first JSON key | Reduces time-to-first-token in UI |
| Fallback: show “Thinking…” until first extractor output | Honest UX |
| On stream end, always emit parsed `assistantMessage` even if extractor got nothing | Safety net |
| Consider dual-channel response (stream text + structured draft via non-streaming side channel) | Bigger change; best UX |

**Code:** `assistant-message-stream.extractor.ts`, `chat-presentation.tsx`, SSE `token` events in `ai-interview.service.ts`

---

## 5. On-call runbook (ordered)

1. Pull affected `willId`. Inspect `interviewDraft` in DB — is the “forgotten” field actually missing?
2. Check `interview/status`: `memory.strategy`, `buildMode`, `estimatedTokens`, message count.
3. Grep logs for parse failures and draft size on that will.
4. **If draft missing field:** contract/merge issue → hotfix prompt + merge guard; comms: “data in draft is source of truth, we're fixing merge.”
5. **If draft has field but AI denied it:** summary/context issue → temporarily raise `MEMORY_FULL_CONTEXT_THRESHOLD` for affected users; plan prompt/token reduction.
6. **If 12s is AI-bound:** reduce output (smaller draft in response schema for display-only fields), disable summary refresh interval, check provider latency.
7. **If 12s is DB-bound:** profile `save()`; consider message-only write path.
8. Post-incident: add draft diff metric, p95 turn latency dashboard, alert on `estimatedTokens` > threshold.

---

## 6. What we explicitly deferred (don't reach for these under fire)

- **Per-fact `conversation_memories`** — dormant; re-enabling mid-incident adds a second truth source.
- **Agentic interview loop** — fixes forgetting, blows cost/latency budget.
- **`MEMORY_STRATEGY=full` in prod** — masks summary bugs, burns budget.

---

## 7. Prevention

| Gap today | Hardening |
|-----------|-----------|
| No draft diff on save | Reject turns that delete populated fields without `userCorrection` flag |
| `getStatus()` progress stubbed | Wire `missingFields` from draft completeness |
| No rate limits | Per-user message cap + token budget |
| Validation API skips hydration | Hydrate before specs so UI matches legal checks |

**Owner:** Interview subsystem (`AiInterviewService`, memory strategies, contract package).  
**Severity:** P1 — trust + latency. Not data loss if Postgres draft is intact but UX is broken.
