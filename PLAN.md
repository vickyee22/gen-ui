# GenUI Metrics & Observability — Enhancement Plan
> Review each item and mark: ✅ Build | ❌ Skip | 🔄 Modify

---

## Current Metrics Panel (Already Built)

| Metric | Status |
|--------|--------|
| Intent name | ✅ Live |
| Components rendered | ✅ Live |
| Confidence % | ✅ Live |
| Intent time (ms) | ✅ Live |
| Orchestration time (ms) | ✅ Live |
| Hydration time (ms) | ✅ Live |
| Total time (ms) | ✅ Live |
| Cache item count | ✅ Live |

---

## A) Planning Metrics

> *"LLM proposes → Orchestrator validates"* — makes it look like real AI infrastructure, not a chatbot.

| Item | Description | Decision |
|------|-------------|----------|
| **Plan steps count** | e.g. "Steps: 4" — number of logical steps the orchestrator executed | |
| **Tools executed** | e.g. "Tools: 2" — number of data calls / hydrators invoked | |
| **Validation status** | "Valid ✓" or "Fallback ⚠" — did Gemini succeed or did keyword fallback run? | |
| **Replan attempts** | e.g. "Replans: 0" — how many times the plan had to be retried | |

**Implementation note:** Most of these can be simulated/derived from existing data:
- Steps = components.length + 2 (classify + orchestrate)
- Tools = components.length (one hydration call each)
- Validation status = intentTime > 50ms ? "AI" : "Fallback"
- Replans = always 0 (or randomised to 0–1 for demo)

---

## B) Governance Metrics

> Separates this from hype demos — makes it look enterprise-grade and safe.

| Item | Description | Decision |
|------|-------------|----------|
| **Policy checks executed** | e.g. "3" — number of guardrail checks run against the intent | |
| **Guardrails triggered** | e.g. "0" — how many checks flagged something | |
| **Unsafe actions rejected** | Running counter of blocked actions this session | |
| **HIL required?** | "No" — Human-in-the-loop flag | |

**Implementation note:** All simulated. Derive from intent: certain intents (DynamicForm) = 3 checks, others = 2. Always 0 triggered in happy path.

---

## C) Session / State Metrics

> The cross-channel continuity proof. Switching Web → App and showing the *same session ID* is the mic-drop moment.

| Item | Description | Decision |
|------|-------------|----------|
| **Session ID** | e.g. "S-7F3A" — persistent across channel switches | |
| **State size (KB)** | e.g. "2.4 KB" — payload size of current session state | |
| **Completed steps** | e.g. "2 / 4" — how many interaction steps done this session | |
| **Channel continuity animation** | When switching Web → App: briefly show "Resuming session S-7F3A… Loaded 2 completed steps" | |

**Implementation note:** Session ID generated once in App.jsx on mount (`S-` + 4 random hex chars). State size = JSON.stringify(payload).length / 1024. Steps tracked across interactions.

---

## D) Confidence Breakdown

> Shows sophistication — instead of one confidence number, break it into layers.

| Item | Description | Decision |
|------|-------------|----------|
| **Intent confidence** | Already shown — keep as-is | |
| **Entity extraction confidence** | e.g. "88%" — how confident AI was about extracted params (amount, planType etc.) | |
| **Plan confidence** | e.g. "91%" — overall orchestration confidence | |

**Implementation note:** Entity confidence = derived from how many `prefilled` fields were extracted (more = higher). Plan confidence = intent confidence ± small offset.

---

## E) Trace View (Tab inside metrics panel)

> Observability for AI orchestration. Architects love this.

| Item | Description | Decision |
|------|-------------|----------|
| **Step-by-step trace** | Numbered list with timestamps: `1. Intent Classified (2ms)` → `2. Plan Generated (12ms)` → `3. Validated (3ms)` → `4. eligibility_check (28ms)` → `5. Hydration (70ms)` | |
| **Tab toggle in panel** | "Metrics" tab and "Trace" tab inside the same floating panel | |

**Implementation note:** Build the trace array in App.jsx as each stage completes. Steps are real (we already have the timings), tool names are named after hydration calls.

---

## F) UX / Panel Upgrades

| Item | Description | Decision |
|------|-------------|----------|
| **Collapsible panel** | Toggle button: "Show Orchestration" / "Hide" — panel slides in/out | |
| **Panel style: Enterprise observability** | Slightly more structured layout — section headers (PLAN, GOVERNANCE, STATE), monospaced values | |
| **Status line at top of app** | Small bar under channel selector: `Mode: Intent-Orchestrated │ Deterministic Execution │ Policy-Enforced` | |
| **Channel switch animation** | When switching channels, briefly flash session resume message before rendering | |

---

## What We're NOT Building

These were explicitly flagged as noise:

- ❌ Token usage numbers (too LLM-vendor-specific)
- ❌ Raw prompt logs
- ❌ JSON dumps in UI
- ❌ Backend endpoint names
- ❌ Vendor identifiers (no "Gemini" in metrics panel)

---

## Suggested Priority Order (if you approve all)

1. **Validation status** (Fallback vs AI) — highest value, already have the data
2. **Session ID + channel animation** — the mic-drop moment
3. **Trace view** — architects love it, data is already available
4. **Governance metrics** — enterprise credibility, purely simulated
5. **Planning metrics** — fills out the panel nicely
6. **Confidence breakdown** — lowest effort, good polish
7. **Status line** — pure CSS, 10 min job
8. **Collapsible panel** — UX improvement, do last

---

*Comment on each row above and I'll build only what you approve.*
