# Gamma.app Deck — Unified Generative UI
**CAIS 2026 | 30 Minutes | 12 Cards**

> Paste each card's content directly into Gamma. Use "Classic" theme.
> Cards marked [DEMO] are transition slides — minimal text, the demo is live.

---

## Card Count Recommendation

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
> Orchestrating Intent Across App, Web, and Chat

**Bottom line**:
> Vicky · CAIS 2026

**Visual**: Dark background. Clean. No extra graphics.

**Notes**: Say nothing. Let it sit for 3 seconds. Then start.

---

## Card 2 — The Problem

**Type**: Statement card

**Headline**:
> Every telco has built the same thing three times.

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
> "My bill is high, I'm travelling next month, and I think I want to upgrade."

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

**Notes**: Read only the row labels. The audience reads the table.

---

## Card 7 — [DEMO] Live Demo

**Type**: Demo transition card

**Headline**:
> Let me show you.

**Sub-text** (bullet list on card, acts as your cheat sheet):
> 1. `"Compare 5G plans with roaming"` — intent → component, entities, 145ms
> 2. `"I was overcharged $45 for roaming last month"` — form arrives pre-filled
> 3. `"Why is my bill so high?"` — BillShockChart, single component
> 4. Switch Web → App → Chat — same session ID, cross-channel continuity
> 5. Repeat query 1 — cache hit: 12ms, 💾 badge

**Notes**: Switch to browser now. Stay there for the full 12 minutes. Come back to deck for Architecture.

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

**Notes**: Three points. One sentence each. Don't elaborate — the architecture diagram is in the appendix if needed.

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
> In a real telco, 60–70% of queries hit cache or keyword tier. AI cost is for the hard cases only — and those are exactly where rules would get it wrong.

**Notes**: "The cost argument dissolves when you see the tiered model."

---

## Card 10 — What This Is (and Isn't)

**Type**: Two-column card

**Headline**:
> Let me be precise about scope.

**Left — This is:**
> A reference implementation
> A working demonstration
> A pattern for intent-first architecture
> Practical, not theoretical

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
| "Isn't this a chatbot?" | Chatbots respond. This orchestrates, composes UI, persists state, governs execution. |
| "What about cost?" | Tiered classification + server-side cache = AI cost on ~20-30% of queries. |
| "Why not workflow engine?" | Workflow engines scale execution. They don't scale ambiguous intent mapping. |
| "What about hallucinations?" | Component registry is the safeguard. Unknown components are ignored. Gemini can't invoke arbitrary tools. |
| "Is this production-ready?" | It's a PoC. Architecture is production-shaped. Missing: server-side cache, policy enforcement, KYC. |
| "How is this different from what we do?" | If you have binary intent-to-flow: you have Tier 1. This adds confidence routing, entity extraction, cross-channel from one definition. |

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

Paste this as a single prompt into Gamma "Generate":

> Create an 11-card presentation titled "Unified Generative UI" for CAIS 2026. The talk is 30 minutes including a live demo. Structure: Cover → The Problem (3 cards) → The Shift (2 cards) → Demo transition (1 card) → Architecture (2 cards) → Cost (1 card) → Scope (1 card) → Close (1 card). Audience: senior technology and AI conference. Tone: direct, systems thinking, no hype. Include speaker notes on each card. Use the Classic theme, dark background for title and close cards.

Then manually edit each card using the content above.
