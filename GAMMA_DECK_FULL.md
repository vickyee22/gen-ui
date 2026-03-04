# Gamma.app Deck — Unified Generative UI (Full)
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
> Orchestrating Intent Across App, Web, and Chat

**Bottom line**:
> Vicky · CAIS 2026

**Visual**: Dark background. Clean. No extra graphics.

**Notes**: Say nothing. Let it sit for 3 seconds. Then: "I want to show you something we built. And I want to be honest about what it is and what it isn't."

---

## Card 2 — The Problem

**Type**: Statement card

**Headline**:
> Every telco has built the same thing three times.

**Body**:
> A web flow. An app flow. A chat flow.
> Same customer. Same intent. Three codebases that diverge over time.
> Every new capability gets built three times. Every bug gets fixed three times. Every channel gets out of sync — slowly, invisibly.

**Visual**: None. Text only. Big, stark.

**Notes**: Pause after the headline. Let it land. Then: "This isn't a technology problem. It's an architectural assumption. The assumption that the channel comes first."

---

## Card 3 — The Mismatch

**Type**: Two-column card

**Headline**:
> The customer doesn't think in workflows.

**Left column — Customer says:**
> "My bill is high, I'm travelling next month, and I think I want to upgrade — but only if it makes sense with roaming."

**Right column — System requires:**
> Clear intent
> Clear flow entry
> Clear branch selection
> One thing at a time

**Small text below**:
> Four requirements. One sentence. The system loses before the conversation starts.

**Notes**: Point to the right column. "This is the architectural gap. Not a UX gap. Not a product gap. The architecture assumes intent is clean. Real customers don't give you clean intent."

---

## Card 4 — The Shift

**Type**: Diagram / flow card

**Headline**:
> From channel-first to intent-first.

**Content** (two flows, stacked):

```
BEFORE   Channel → Flow → Offer → Render
         (channel defines what's possible)

AFTER    Intent → Orchestrator → Components → Channel
         (intent defines what's needed; channel is just rendering config)
```

**Small text below**:
> Same customer. Same intent. The difference is where the decision is made.

**Notes**: Walk through the AFTER flow slowly. "The channel becomes the last step, not the first. That one inversion changes everything downstream — maintenance, extensibility, cross-channel consistency."

---

## Card 5 — The Thesis

**Type**: Quote / statement card

**Single line, large:**
> "LLM proposes. The system governs. Execution remains deterministic."

**Second line:**
> The AI is the planner. The orchestrator is the control plane. Not the other way around.

**Small text below**:
> The LLM never executes. It never has memory between calls. It never touches customer data. It writes a plan — and the orchestrator decides whether to run it.

**Visual**: Dark background. Centred. Maximum impact.

**Notes**: Say this once. Don't repeat it. "This is the architecture principle we built on. Everything you're about to see comes back to this." Move on.

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
| Entity extraction | Route only | Extract + pre-fill fields |
| New capability | Define new flow + routing rule | Register one component |
| Channels | 3 codebases | 1 definition, 3 rendering configs |

**Small text below**:
> The gap isn't intelligence. It's granularity. Binary routing vs parameterised composition.

**Notes**: Read only the row labels. The audience reads the table. Then: "The last row is the business case. One definition, three channels. That's maintenance velocity."

---

## Card 7 — [DEMO] Live Demo

**Type**: Demo transition card

**Headline**:
> Let me show you.

**Sub-text** (bullet list on card — your cheat sheet, visible to audience):
> 1. `"Compare 5G plans with roaming"` — intent → component, entities extracted, 145ms
> 2. `"I was overcharged $45 for roaming last month"` — form arrives pre-filled, no typing needed
> 3. `"Why is my bill so high?"` — single component, BillShockChart, direct render
> 4. Switch Web → App → Chat — same session ID, same context, cross-channel continuity
> 5. Repeat query 1 — cache hit: 12ms, 💾 badge appears, AI not called

**Notes**: Switch to browser now. Stay there for the full 12 minutes. The audience can read the cheat sheet — that's intentional, it sets expectations. Come back to Card 8 (Architecture) when done.

---

## Card 8 — The Architecture

**Type**: Numbered list card

**Headline**:
> Three things that make this not a chatbot.

**Content**:

**1. The AI never executes.**
Gemini outputs a JSON execution plan. The orchestrator validates it against a component registry and decides what runs. Unknown components are ignored. The AI cannot invoke arbitrary tools.

**2. State lives in the orchestrator, not the LLM.**
Session context — channel, history, confidence trace — is managed centrally. The LLM has no memory between calls. The session ID is the continuity mechanism, not the model.

**3. Confidence is a first-class signal.**
Not a debug metric. It gates what the system does next. Low confidence triggers fallback behaviour. High confidence on a cached query means Gemini isn't called at all.

**Notes**: Three points. Two sentences each. "If you remember one thing from the architecture: the AI is advisory. The orchestrator is authoritative."

---

## Card 9 — On Cost

**Type**: Flow / tier card

**Headline**:
> You only pay for AI when you need it.

**Content** (tiered flow):

```
Query arrives
    ↓
Exact cache hit?      → Return cached plan     (0ms, $0.00)
    ↓
Keyword match?        → Return result           (1ms, $0.00)
    ↓
Ambiguous query?      → Call Gemini             (150ms, ~$0.001)
```

**Small text below**:
> In production, 60–70% of queries hit cache or keyword tier.
> AI cost applies only to the hard cases — and those are exactly the cases where rules-based routing would get it wrong anyway.
> You're not paying for AI on every render. You're paying for AI where it earns its cost.

**Notes**: "The cost argument dissolves when you see the tiered model. The AI budget is proportional to query ambiguity — which is proportional to where it creates value."

---

## Card 10 — What This Is (and Isn't)

**Type**: Two-column card

**Headline**:
> Let me be precise about scope.

**Left — This is:**
> A working reference implementation
> A demonstration of intent-first architecture
> A pattern applicable to real telco product surfaces
> A PoC with production-shaped architecture

**Right — This is not:**
> A production deployment
> A replacement for your existing workflow engine
> A fully solved governance or policy framework
> A claim that AI-generated UI is always better

**Small text below**:
> The governance skeleton is here. The component registry enforces a whitelist. What's missing for production: server-side cache, hard policy enforcement, KYC integration, load testing.

**Notes**: "I'm not claiming to have solved enterprise AI for telco. I'm articulating a pattern and demonstrating it works. The production path is clear from here."

---

## Card 11 — Close

**Type**: Statement card

**Single line, large:**
> Stop asking which flow.

**Second line:**
> Start asking which components, with what data, at what confidence, for which channel.

**Small text:**
> That's the shift. That's the PoC. That's what this architecture looks like when it runs.
> The components are registered. The orchestrator is live. The session persists across channels.
> It works today. The question is what you build with it.

**Notes**: Let it sit. Don't rush to Q&A. "I'll take questions." Then wait.

---

## Card 12 — Appendix: Q&A Reference (Hidden)

**Type**: Table card — keep hidden, reveal only if needed during Q&A

**Headline**: Anticipated Questions

| Question | Answer |
|----------|--------|
| "Isn't this a chatbot?" | Chatbots respond in text. This orchestrates structured UI, composes components, persists state across channels, and governs execution through a whitelist. Different layer entirely. |
| "What about cost?" | Tiered classification + server-side cache means Gemini is called on ~20–30% of queries. The hard cases. You're not paying for AI on every render. |
| "Why not a workflow engine?" | Workflow engines scale deterministic execution. They don't scale ambiguous intent mapping or multi-intent composition. These solve different problems. |
| "What about hallucinations?" | The component registry is the safeguard. Gemini can only propose components that exist in the whitelist. Unknown components are silently ignored. The AI cannot invent UI. |
| "Is this production-ready?" | Architecture is production-shaped. What's missing: server-side cache, hard policy enforcement, KYC integration. The path is clear. |
| "How is this different from what we do?" | If you have binary intent-to-flow: you have Tier 1. This adds confidence routing, entity extraction + pre-fill, cross-channel from one definition, and multi-intent composition. |
| "Can this replace our chatbot?" | No — and it shouldn't. Chatbots handle freeform conversation. This handles structured intent with UI output. They're complementary. |

---

## Gamma Settings

| Setting | Value |
|---------|-------|
| **Cards** | 11 visible + 1 hidden appendix |
| **Theme** | Classic |
| **Font** | Default (Inter) |
| **Background** | Dark for cards 1, 5, 11 — Light for everything else |
| **Language** | English (US) |
| **Presenter notes** | Add the "Notes" from each card |

---

## Paste Prompt for Gamma Generate

> Create an 11-card presentation titled "Unified Generative UI" for CAIS 2026. 30 minutes, live demo included. Structure: Cover → Problem (2 cards) → Mismatch → The Shift → Thesis → Old vs New → Demo transition → Architecture → Cost → Scope → Close. Audience: senior technology and AI conference. Tone: direct, systems thinking, no hype. Include speaker notes. Classic theme, dark background on title, thesis, and close cards.

Then manually paste each card's content from above.
