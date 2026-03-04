# Unified Generative UI: Intent-Driven Adaptive Interfaces
**CAIS 2026 | 30-Minute Keynote Script | Vicky**

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

> "Every business I know has built the same thing three times. A web flow. An app flow. A chat flow. Same customer. Same intent. Three different implementations that diverge over time and break in different ways."

> "And this isn't a telecom problem. It's a retailer problem. A bank problem. A healthcare problem. Any business that serves customers across digital channels has this problem."

**The real problem isn't channels. It's the abstraction.**

Today's architecture assumes:
- The customer arrives with a clear, single intent
- The right channel is known upfront
- Personalization means ranking offers — not orchestrating journeys
- Chatbots handle conversation but don't compose UI or persist state

**The customer moment that breaks everything:**

> "Show me wireless headphones under $100 — and also, where is my order? Actually, if those headphones are better than what I bought, I might just return mine."

One sentence. Three intents. A product search, an order lookup, and a return request — simultaneously. Your system requires the customer to navigate to three separate flows and repeat themselves every time.

**That mismatch is the architectural problem this work addresses.**

---

## 2. The Shift (4 min)

**From:**
```
Channel → Flow → Offer → Render
(channel defines what's possible)
```

**To:**
```
Intent → Plan → Orchestrator → Components → Channel Renderer
(intent defines what's needed; channel is just rendering config)
```

**The thesis, one line:**
> "LLM proposes. The system governs. Execution remains deterministic."

The AI is not the executor. It's the planner.
The orchestrator controls what runs. Not the LLM.

**What's actually different from legacy intent-to-flow mapping:**

| Dimension | Previous Approach | GenUI |
|-----------|------------------|-------|
| Decision unit | Which flow? | Which components, with what data? |
| Confidence handling | Commit at 51% | Confidence gates what happens next |
| Multi-intent | Pick one, discard rest | Compose two simultaneously |
| Entity extraction | Route only | Extract + pre-fill structured fields |
| New capability | New flow + new routing rule | Register one component |
| Channels | 3 codebases | 1 definition, 3 rendering configs |
| Industry | Single vertical | Same engine, any domain |

**That's not a chatbot upgrade. That's a different abstraction entirely.**

---

## 3. Live Demo (12 min)

### Domain 1 — FutureTel (Telecom)

---

#### Demo 1: Natural Language → Parameterised Component (2 min)

**Type:** `"Compare 5G plans with roaming"`

> "Notice what happened. I typed natural language. The system classified the intent, selected the right component, configured it with the right parameters — 5G and Roaming — and rendered it. No flow definition. No hardcoded routing rule. Just intent, and a component that knows how to respond."

**Point to the metrics panel:**
- Intent confidence: ~92%
- Entities extracted: planTypes → ["5G", "Roaming"]
- Total time: ~150ms

---

#### Demo 2: Entity Extraction → Pre-filled Form (3 min)

**Type:** `"I was overcharged $45 for roaming last month"`

> "This is where it gets interesting. I didn't navigate to a form. I didn't fill in the amount, the period, or the issue type. The AI extracted all of that from my sentence and the form arrived pre-configured. In a traditional system, I would have landed on a blank form and re-typed everything I just said."

**Point to pre-filled fields:**
- Amount: $45 ← extracted
- Issue type: Roaming ← extracted
- Period: Jan 2026 ← extracted

> "This is the gap rules-based routing cannot fill. Classification is easy. Entity extraction into structured form data — that's the new layer."

---

#### Demo 3: Cross-Channel Continuity (2 min)

> "Now watch what happens when we switch channels."

**Switch Web → App → Chat**

> "Same session ID. Same context. Same orchestration layer — just rendered differently for each channel. App is compact. Chat is linear. One intent definition. Three renderers."

**Point to metrics:**
- Session ID stays the same across all three
- Completed steps carry over
- Resume toast appears on switch

---

### Domain 2 — FutureCommerce (Ecommerce)

> "Now I want to show you something that proves this isn't a telecom solution. Click Domains. We're switching to FutureCommerce — a completely different industry, a completely different data model. Same engine."

---

#### Demo 4: Product Discovery (2 min)

**Type:** `"Show me wireless headphones under $100"`

> "Budget extracted. Category extracted. Keywords extracted. The ProductRecommendations component renders a filtered, parameterised product grid. No search engine configuration. No filter UI wired manually. The AI understood the query and the component did the rest."

**Point to metrics:**
- Category: headphones
- Budget: $100
- Keywords: ["wireless"]

---

#### Demo 5: Order Tracking (1 min)

**Type:** `"Where is my order ORD-789?"`

> "Order ID extracted directly from natural language. The OrderTracker component renders a live status timeline. Different component, different data layer — same pipeline."

---

#### Demo 6: Cache Hit (2 min)

**Repeat any previous query**

> "12 milliseconds. Same result. The orchestrator cached the intent and the component payload. First request: ~150ms. Second request: 12ms. At scale, your top 20 queries cover 70% of volume. Those cache aggressively. You only pay AI cost for genuinely ambiguous queries."

---

## 4. Architecture Deep Dive (5 min)

**The pipeline:**

```
User Query
    ↓
Intent Classifier       ← Gemini 2.5 Flash (AI proposes a plan)
    ↓
Component Registry      ← Whitelist (system governs what can run)
    ↓
Orchestrator            ← Validates plan, does NOT let AI execute directly
    ↓
Data Hydration          ← Parallel, composable, domain-specific
    ↓
Channel Renderer        ← Web / App / Chat rendering config
```

**Three things that make this not a chatbot:**

**1. The AI never executes.**
It outputs a JSON plan. The orchestrator decides what runs. Gemini cannot call an arbitrary tool — it can only select from a whitelisted component registry. Unknown components are silently ignored. The AI cannot invent UI.

**2. State lives in the orchestrator, not the LLM.**
Session context, completed steps, channel state — all centralised. The LLM has no memory between calls. The session ID is the continuity mechanism, not the model.

**3. Confidence is a first-class signal.**
Not a debug metric. High confidence → render immediately. Low confidence → fallback or clarify. Multi-intent → compose multiple components simultaneously. The system acts on certainty, not just intent.

**On cost:**
> "The concern is: every render calls an AI. But with tiered classification — keyword match for common queries, AI only for ambiguous ones — plus server-side caching shared across users, you're paying AI cost on maybe 20–30% of requests. And Gemini Flash costs less than $0.001 per call. The cost argument dissolves quickly."

**On domains:**
> "Adding a new domain is a configuration change, not an architecture change. You define a component registry for that domain, wire up a data hydration layer, and the intent classifier scopes itself automatically. We went from telecom to ecommerce in one session. That's the point."

---

## 5. What This Is (and Isn't) (2 min)

**This PoC is:**
- A reference implementation of intent-first orchestration
- A working demonstration across two domains — telecom and ecommerce
- A pattern applicable to any industry that serves customers across channels
- Production-shaped architecture — not theoretical

**This PoC is not:**
- A production deployment
- A replacement for your workflow engine or personalisation stack
- A fully solved AI governance or policy framework
- A claim that generative UI is always the right answer

> "I'm not saying we've solved AI for enterprise. I'm saying we've articulated a pattern that most organisations are stumbling toward without a clear model. This is that model — running, live, across two domains."

---

## 6. Close (2 min)

**The one thing to take away:**

> "Customers don't think in flows. They think in intent. The next phase of AI in digital experience is not smarter chatbots — it is unified intent orchestration with adaptive, deterministic rendering."

**The shift in a single sentence:**

> "Stop asking which flow. Start asking which components, with what data, at what confidence, for which channel, in which domain."

**Invite:**
> "If you're building this, thinking about building this, or if you think I'm wrong — I'd love to talk. This is a PoC. The pattern is the point."

---

## Demo Cheat Sheet (Quick Reference)

### FutureTel — Telecom
| Query | What it shows |
|-------|--------------|
| `"Compare 5G plans with roaming"` | Intent → ComparisonTable, entity parameters |
| `"I was overcharged $45 for roaming last month"` | Entity extraction → pre-filled DynamicForm |
| `"Why is my bill so high this month?"` | BillShockChart, single-intent render |
| Switch Web → App → Chat | Cross-channel continuity, same session ID |

### FutureCommerce — Ecommerce
| Query | What it shows |
|-------|--------------|
| `"Show me wireless headphones under $100"` | ProductRecommendations, budget + category extracted |
| `"Where is my order ORD-789?"` | OrderTracker, order ID extracted, timeline rendered |
| `"I want to return my Sony headphones"` | DynamicForm (return_request), pre-filled |
| Repeat any query | Cache hit: ~12ms, 💾 badge, no AI call |

---

## Q&A Prep — The Questions You'll Get

**"Isn't this just a chatbot?"**
> No. A chatbot interprets and responds in text. This orchestrates structured UI, composes components, extracts entities into form fields, persists state across channels, and never lets the LLM execute directly. Different layer entirely.

**"What about cost?"**
> Tiered classification: keyword for common queries, AI only for ambiguous ones. Plus server-side shared cache. Realistically 20–30% of queries hit AI. Gemini Flash is under $0.001 per call. Not a cost problem.

**"Why not just use a workflow engine?"**
> Workflow engines scale deterministic execution. They don't scale ambiguous intent mapping or multi-intent composition. You'd need a predefined flow for every possible query variation. The LLM is the intent-to-component compiler — it selects what to render, not what step to execute.

**"What about hallucinations?"**
> The component registry is the safeguard. Gemini can only select from registered components. Unknown component names are silently ignored. Governance is structural, not prompt-based.

**"Is this production-ready?"**
> This is a PoC — a reference implementation. The architecture is production-shaped. What's missing: server-side classification cache, user-scoped caching, hard policy enforcement, KYC on high-risk forms. The architecture tells you exactly where to add them.

**"Why two domains?"**
> To prove the engine is domain-agnostic. Same intent classification → orchestration → hydration pipeline. Only the component registry and data layer change per domain. Adding a third domain is a config change, not an architecture rebuild.

**"Can this replace our chatbot?"**
> No — and it shouldn't. Chatbots handle freeform conversation. This handles structured intent with UI output. They're complementary. The chatbot is the front door; this is what happens when intent is clear enough to render something.

---

*CAIS 2026 — Unified Generative UI: Intent-Driven Adaptive Interfaces*
