# Gamma.app Deck — Unified Generative UI: Intent-Driven Adaptive Interfaces
**CAIS 2026 | 30 Minutes | 12 Cards**

> Paste each card's content directly into Gamma. Use "Classic" theme.
> Cards marked [DEMO] are transition slides — the demo runs live in browser.

---

## Card Count

| Purpose | Cards |
|---------|-------|
| Opening + Problem | 3 |
| The Shift | 2 |
| Demo | 1 |
| Architecture | 2 |
| What it is / isn't | 2 |
| Close | 1 |
| Appendix (hidden) | 1 |
| **Total** | **12** |

---

## Card 1 — Cover

**Type**: Title card

**Headline**:
> Unified Generative UI

**Subheadline**:
> Intent-Driven Adaptive Interfaces

**Bottom line**:
> Vicky · CAIS 2026

**Visual**: Dark background. Clean. No extra graphics.

**Notes**: Say nothing. Let it sit for 3 seconds. Then start.

---

## Card 2 — The Problem

**Type**: Statement card

**Headline**:
> Every business has built the same thing three times.

**Body** (2 lines max):
> A web flow. An app flow. A chat flow.
> Same customer. Same intent. Three codebases that diverge over time.

**Visual**: None. Text only. Big, stark.

**Notes**: Pause after the headline. Let it land.

---

## Card 3 — The Mismatch

**Type**: Two-column card

**Headline**:
> The customer doesn't think in workflows.

**Left column — Customer says:**
> "Show me wireless headphones under $100, and I also want to track my order."

**Right column — System requires:**
> Clear intent
> Clear flow entry
> Clear branch selection

**Notes**: Point to the right column. "This is the architectural gap."

---

## Card 4 — The Shift

**Type**: Diagram / flow card

**Headline**:
> From channel-first to intent-first.

**Content** (two flows, stacked):

```
BEFORE   Channel → Flow → Offer → Render

AFTER    Intent → Orchestrator → Components → Channel
```

**Notes**: Walk through the AFTER flow slowly. "The channel becomes the last step, not the first."

---

## Card 5 — The Thesis

**Type**: Quote / statement card

**Single line, large:**
> "LLM proposes. The system governs. Execution remains deterministic."

**Small text below:**
> The AI is the planner. The orchestrator is the control plane. Not the other way around.

**Visual**: Dark background. Single line centred. Maximum impact.

**Notes**: Say this once. Don't repeat it. Move on.

---

## Card 6 — Old vs New

**Type**: Comparison table card

**Headline**:
> We already had intent-to-flow mapping. Here's what's different.

**Table**:

| | Previous System | GenUI |
|---|---|---|
| Decision | Which flow? | Which components, with what data? |
| Confidence | Commit at 51% | Confidence gates what happens next |
| Multi-intent | Pick one | Compose two simultaneously |
| New capability | Define new flow + routing rule | Register one component |
| Channels | 3 codebases | 1 definition, 3 configs |
| Domains | One vertical | Same engine, any industry |

**Notes**: Read only the row labels. The audience reads the table.

---

## Card 7 — [DEMO] Live Demo

**Type**: Demo transition card

**Headline**:
> Let me show you.

**Sub-text** (bullet list on card, acts as your cheat sheet):
> **FutureTel (Telecom)**
> 1. `"Compare 5G plans with roaming"` — intent → component, entities, ~150ms
> 2. `"I was overcharged $45 for roaming last month"` — form arrives pre-filled
> 3. Switch Web → App → Chat — same session, cross-channel continuity
>
> **FutureCommerce (Ecommerce)**
> 4. `"Show me wireless headphones under $100"` — ProductRecommendations, budget + category extracted
> 5. `"Where is my order ORD-789?"` — OrderTracker, timeline with status
> 6. Repeat query — cache hit, ~12ms

**Notes**: Switch to browser. Start with FutureTel domain, then switch to FutureCommerce to show domain-agnostic engine. Stay in browser for 12 minutes.

---

## Card 8 — The Architecture

**Type**: Diagram card

**Headline**:
> Three things that make this not a chatbot.

**Content** (numbered list, large):

**1. The AI never executes.**
Gemini outputs a JSON plan. The orchestrator decides what runs.

**2. State lives in the orchestrator, not the LLM.**
Session context is centralised. The LLM has no memory between calls.

**3. Confidence is a first-class signal.**
Not a debug metric. It gates what the system does next.

**Notes**: Three points. One sentence each. Don't elaborate.

---

## Card 9 — On Cost

**Type**: Flow / tier card

**Headline**:
> You only pay for AI when you need it.

**Content** (tiered flow):

```
Query arrives
    ↓
Exact cache hit?      → Return cached    (0ms, free)
    ↓
Keyword match?        → Return result    (1ms, free)
    ↓
Ambiguous query?      → Call Gemini      (150ms, ~$0.001)
```

**Small text below:**
> 60–70% of queries hit cache or keyword tier. AI cost is for the hard cases only — and those are exactly where rules would get it wrong.

**Notes**: "The cost argument dissolves when you see the tiered model."

---

## Card 10 — What This Is (and Isn't)

**Type**: Two-column card

**Headline**:
> Let me be precise about scope.

**Left — This is:**
> A reference implementation
> A working demonstration across two domains
> A pattern for intent-first architecture
> Domain-agnostic by design

**Right — This is not:**
> A production claim
> A replacement for your workflow engine
> A fully solved governance framework

**Notes**: "I'm not claiming to have solved AI for enterprise. I'm articulating a pattern."

---

## Card 11 — Close

**Type**: Statement card

**Single line, large:**
> Stop asking which flow.

**Second line:**
> Start asking which components, with what data, at what confidence, for which channel.

**Small text:**
> That's the shift. That's the PoC. That's what I'd like to talk about.

**Notes**: Let it sit. Don't add anything. Open the floor.

---

## Card 12 — Appendix: Q&A Reference (Hidden in Presentation)

**Type**: Table card (keep hidden, reveal only if needed)

**Headline**: Anticipated Questions

| Question | Answer (one line) |
|----------|------------------|
| "Isn't this a chatbot?" | Chatbots respond in text. This orchestrates structured UI, composes components, persists state, governs execution. |
| "What about cost?" | Tiered classification + cache = AI cost on ~20-30% of queries. |
| "Why not workflow engine?" | Workflow engines scale execution. They don't scale ambiguous intent mapping. |
| "What about hallucinations?" | Component registry is the safeguard. Unknown components are ignored. The AI can't invent UI. |
| "Is this production-ready?" | It's a PoC. Architecture is production-shaped. Missing: server-side cache, policy enforcement, KYC. |
| "Why two domains?" | To prove the engine is domain-agnostic. Same pipeline — telecom or ecommerce — only the component registry and data layer change. |

---

## Gamma Settings

| Setting | Value |
|---------|-------|
| **Cards** | 11 visible + 1 hidden appendix |
| **Theme** | Classic |
| **Font** | Default (Inter) |
| **Background** | Dark for cards 1, 5, 11 — Light for everything else |
| **Language** | English (US) |
| **Presenter notes** | Add the "Notes" from each card above |

---

## Paste Order for Gamma

> Create an 11-card presentation titled "Unified Generative UI: Intent-Driven Adaptive Interfaces" for CAIS 2026. The talk is 30 minutes including a live demo. Structure: Cover → The Problem (2 cards) → The Shift (2 cards) → Demo transition (1 card) → Architecture (2 cards) → Scope (1 card) → Close (1 card). Audience: senior technology and AI conference. Tone: direct, systems thinking, no hype. Include speaker notes on each card. Use the Classic theme, dark background for title and close cards.

Then manually edit each card using the content above.
