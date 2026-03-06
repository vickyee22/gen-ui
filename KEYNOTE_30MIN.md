# Unified Generative UI — 30-Minute Keynote
**CAIS 2026 | Vicky**

---

## Structure Overview

| Segment | Duration | Type |
|---------|----------|------|
| Opening — The Problem | 5 min | Talk |
| The Shift | 4 min | Talk |
| Live Demo | 12 min | Demo |
| Architecture Deep Dive | 5 min | Talk |
| What This Is (and Isn't) | 2 min | Talk |
| Close | 2 min | Talk |

---

## 1. Opening — The Problem (5 min)

**Open with this:**

> "Every telco I know has built the same thing three times. A web flow. An app flow. A chat flow. Same customer. Same intent. Three different implementations that diverge over time and break in different ways."

**The real problem isn't channels. It's the abstraction.**

Today's architecture:
- Channels evolved independently
- Personalization engines rank offers — they don't orchestrate journeys
- Workflow engines execute flows — but customers don't arrive with a workflow ID
- Chatbots understand intent — but don't compose UI or persist state across channels

**The customer moment:**
> "My bill is high, I'm travelling next month, and I'm thinking of upgrading."

One sentence. Three intents. Your system requires the customer to navigate to three separate flows — and repeat themselves every time.

**That mismatch is the architectural problem we're solving.**

---

## 2. The Shift (4 min)

**From:**
```
Channel → Flow → Offer → Render
```

**To:**
```
Intent → Plan → Orchestrator → Components → Channel Renderer
```

**The thesis, one line:**
> "LLM proposes. The system governs. Execution remains deterministic."

The AI is not the executor. It's the planner.
The orchestrator controls what runs. Not the LLM.

**Why this matters — the Singtel comparison:**

We already built deterministic intent-to-flow mapping. What we didn't have:

| Old System | GenUI |
|-----------|-------|
| Which flow? | Which components, with what data, at what confidence? |
| Binary: Flow A or B | Composition: Component A + B simultaneously |
| Classifier commits at 51% confidence | Confidence gates what happens next |
| New intent = new flow + new routing rule | New intent = register one component |
| 3 channels = 3 codebases | 3 channels = 1 definition, 3 configs |

**That's not a chatbot upgrade. That's a different abstraction entirely.**

---

## 3. Live Demo (12 min)

### Demo 1: Natural Language → Parameterised Component (2 min)

**Type:** `"Compare 5G plans with roaming"`

> "Notice what happened. I typed natural language. The system classified the intent, selected the right component, configured it with the right parameters — 5G and Roaming — and rendered it. No flow definition. No hardcoded routing rule."

**Show the metrics panel:**
- Intent confidence: 92%
- Entities extracted: planTypes
- Total time: ~145ms

---

### Demo 2: Entity Extraction → Pre-filled Form (3 min)

**Type:** `"I was overcharged $45 for roaming last month"`

> "This is where it gets interesting. I didn't navigate to a form. I didn't fill in the amount, the period, or the issue type. The AI extracted all of that from my sentence and the form arrived pre-configured. In a traditional system, I would have landed on a blank form and re-typed everything I just said."

**Point to pre-filled fields:**
- Amount: $45 ← extracted
- Issue type: Roaming ← extracted
- Period: Jan 2026 ← extracted

> "This is the gap rules-based routing cannot fill. Classification is easy. Entity extraction into structured form data — that's the new layer."

---

### Demo 3: Composition — Two Components, One Intent (2 min)

**Type:** `"Why is my bill so high this month?"`

Show BillShockChart.

> "Now imagine the customer says they also want to compare plans. In the old world, that's a navigation decision. Here, the orchestrator can return two components simultaneously — one for the bill breakdown, one for the comparison. No new flow. No new routing rule."

*(Optional: If time permits, show a multi-component query)*

---

### Demo 4: Cross-Channel Continuity (3 min)

> "Now watch what happens when we switch channels."

**Switch Web → App**

> "Same session ID. S-7F3A. The orchestration layer doesn't care which channel you're on. The same intent classification, the same state, the same components — just rendered differently for the App context."

**Switch App → Chat**

> "Same session. Different layout. Compact, linear, no animation — because Chat has different constraints. One definition. Three renderers."

**Point to metrics:**
- Session ID stays the same
- Completed steps carry over
- Resume toast on switch

> "This is cross-channel continuity without channel-specific state. One orchestration layer. The channel is just a rendering config."

---

### Demo 5: Cache Performance (2 min)

**Type the same query again:** `"Compare 5G plans with roaming"`

> "12 milliseconds. Same result. The orchestrator cached the intent and the component payload. First request: 145ms. Second request: 12ms. At scale, your top 20 queries cover 70% of volume. Those cache aggressively. You only pay AI cost for genuinely ambiguous queries."

---

## 4. Architecture Deep Dive (5 min)

**The pipeline:**

```
User Query
    ↓
Intent Classifier       ← Gemini 2.5 Flash (AI proposes)
    ↓
Component Registry      ← Whitelist (system governs)
    ↓
Orchestrator            ← Validates, does NOT let AI execute directly
    ↓
Data Hydration          ← Parallel, composable
    ↓
Channel Renderer        ← Web / App / Chat config
```

**Three things that make this not a chatbot:**

1. **The AI never executes.** It outputs a JSON plan. The orchestrator decides what runs. Gemini cannot call an arbitrary tool — it can only select from a whitelisted component registry.

2. **State lives in the orchestrator, not the LLM.** Session context, completed steps, channel state — all centralized. The LLM has no memory between calls.

3. **Confidence is a first-class signal.** Not a debug metric. High confidence → render immediately. Low confidence → ask a clarifying question. Multi-intent → compose multiple components. The system acts on certainty, not just intent.

**On cost:**
> "The common concern is: every render calls an AI. That's expensive. But with tiered classification — keyword match for common queries, AI only for ambiguous ones — plus server-side caching shared across users, you're paying AI cost for maybe 20-30% of requests. And Gemini Flash costs less than $0.001 per call. The cost argument dissolves quickly."

**On governance:**
> "The component registry is the governance layer. There is no way for a user to trigger a component that isn't registered. No way for the AI to invoke arbitrary tools. The orchestrator is the control plane. In production, you'd add policy checks, PII detection, rate limiting — all as middleware in the orchestration pipeline."

---

## 5. What This Is (and Isn't) (2 min)

**This PoC is:**
- A reference implementation of intent-first orchestration
- A working demonstration of parameterised component composition
- A pattern for how enterprise channels evolve from flow-driven to intent-driven
- Practical, not theoretical — it runs, the forms pre-fill, the session persists

**This PoC is not:**
- A production claim
- A replacement for your workflow engine or personalization stack
- A fully solved AI governance framework

> "I'm not saying we've solved AI for enterprise. I'm saying we've articulated a pattern that most organisations are stumbling toward without a clear model. This is that model."

---

## 6. Close (2 min)

**The one thing to take away:**

> "Customers don't think in flows. They think in intent. The next phase of AI in enterprise commerce is not smarter chatbots — it is unified intent orchestration with deterministic execution."

**The shift in a single sentence:**

> "Stop asking which flow. Start asking which components, with what data, at what confidence, for which channel."

**Invite:**
> "If you're building this or thinking about building this — or if you think I'm wrong — I'd love to talk. This is a PoC. The pattern is the point."

---

## Demo Cheat Sheet (Quick Reference)

| Query to type | What it shows |
|--------------|---------------|
| `"Compare 5G plans with roaming"` | Intent → component, entity parameters |
| `"I was overcharged $45 for roaming last month"` | Entity extraction → pre-filled form |
| `"Why is my bill so high this month?"` | BillShockChart, single-intent component |
| Switch Web → App → Chat | Cross-channel continuity, same session ID |
| `"Compare 5G plans with roaming"` (again) | Cache hit: 12ms, 💾 badge |

---

## Q&A Prep — The Questions You'll Get

**"Isn't this just a chatbot?"**
> No. A chatbot interprets and responds. This orchestrates. It composes UI, extracts structured data, persists state across channels, and never lets the LLM execute directly.

**"What about cost?"**
> Tiered classification: keyword for common queries, AI only for ambiguous ones. Plus server-side shared cache. Realistically 20-30% of queries hit AI. Gemini Flash is under $0.001 per call. Not a cost problem.

**"Why not just use a workflow engine?"**
> Workflow engines scale execution. They don't scale intent mapping. You'd need a predefined flow for every possible query variation. The combinatorial explosion kills maintainability. The LLM is the intent-to-workflow compiler — it selects which workflow to run, not which step to execute.

**"What about hallucinations?"**
> The component registry is the safeguard. Gemini can only select from registered components. It cannot invoke arbitrary tools. If it returns an unknown component name, the renderer ignores it. Governance is structural, not prompt-based.

**"Is this production-ready?"**
> This is a PoC — a reference implementation. The pattern is production-shaped. What's missing: server-side classification, user-scoped caching, real policy enforcement, KYC on high-risk forms. The architecture tells you exactly where to add them.

**"How is this different from what we already do?"**
> If you're doing binary intent-to-flow mapping: you're doing Tier 1 of this. What this adds — confidence-gated routing, entity extraction into pre-filled UI, cross-channel from one definition — is the next layer.

---

*CAIS 2026 — Unified Generative UI: Orchestrating Intent Across App, Web, and Chat*
