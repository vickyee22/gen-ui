# Unified Generative UI: Intent-Driven Adaptive Interfaces
**CAIS 2026 | 30-Minute Keynote Script | Vicky**

---

## Presentation Objective

Deliver a clear conference narrative that does three things:
- Expose the architectural problem with channel-first digital experiences
- Demonstrate an intent-first orchestration model live across two domains
- Leave the audience with a precise, credible view of what the PoC proves and what it does not

**Core message:**
> "LLM proposes. The system governs. Execution remains deterministic."

---

## 30-Minute Run of Show

| Segment | Time | Cards | Purpose |
|---------|------|-------|---------|
| Opening | 0:00-6:00 | 1-3 | Establish the problem and the architectural mismatch |
| The Shift | 6:00-10:00 | 4-6 | Introduce the intent-first model and why it is different |
| Live Demo | 10:00-22:00 | 7 | Prove the system works across channels and domains |
| Architecture + Cost | 22:00-27:00 | 8-9 | Explain why this is governable and economically practical |
| Scope + Close | 27:00-30:00 | 10-11 | Set realistic boundaries and end with a strong takeaway |

---

## Delivery Guidance

- Speak as if you are explaining a new architectural pattern, not selling a product.
- Do not over-explain the demo UI; narrate what the system is deciding.
- Pause after the strongest lines and let the room read the slide.
- Keep the language direct. The audience is technical and senior.

---

## Card 1 - Cover (0:00-0:30)

**On screen:**
- Unified Generative UI
- Intent-Driven Adaptive Interfaces
- Vicky · CAIS 2026

**Speaker notes:**

Walk on, let the title sit for a few seconds, then begin:

> "I want to show you something we built. And I want to be precise about what it is and what it isn't."

> "This is a working proof of concept, but more importantly, it is a model for how digital experiences change when you stop designing around channels and start designing around intent."

**Transition:**
> "The reason this matters starts with a pattern every enterprise here already knows."

---

## Card 2 - The Problem (0:30-3:00)

**On screen headline:**
> Every business has built the same thing three times.

**Speaker notes:**

> "Every business I know has built the same capability three times. A web flow. An app flow. A chat flow."

> "Same customer. Same underlying need. Three implementations that drift apart over time."

> "Every new feature gets built three times. Every bug gets fixed three times. And every channel slowly becomes inconsistent with the others."

> "But duplication is only the visible cost. The deeper cost is rigidity. Because each channel is built around predefined flows, the system cannot adapt dynamically when the customer's intent changes mid-journey."

> "This is not a telecom problem. It is a retailer problem, a banking problem, a healthcare problem. Anywhere the same customer shows up through multiple interfaces, this pattern repeats."

> "The issue is not the UI. The issue is the architecture assumption underneath it: that the channel comes first, and the experience can only do what that channel flow already expected."

**Transition:**
> "That assumption breaks because customers do not arrive in neat workflow-shaped requests."

---

## Card 3 - The Mismatch (3:00-6:00)

**On screen:**
- Customer says one messy, multi-part request
- System expects one clear intent, one clear flow, one thing at a time

**Speaker notes:**

Point to the customer example and say:

> "A real customer says: show me wireless headphones under a hundred dollars, check where my order is, and if these are better, maybe I should return what I bought."

> "That is one sentence, but operationally it contains multiple intents: product discovery, order tracking, and return initiation."

> "Most enterprise systems cannot process that as one moment. They force the customer to pick a flow, commit early, and repeat context."

> "So the failure happens before UX design even begins. The architecture assumes intent is clean and singular. The customer is neither."

> "That gap is what this work addresses."

**Transition:**
> "The fix is not a better chatbot. The fix is to invert the decision model."

---

## Card 4 - The Shift (6:00-8:00)

**On screen:**
```text
BEFORE   Channel -> Flow -> Offer -> Render
AFTER    Intent -> Orchestrator -> Components -> Channel
```

**Speaker notes:**

Walk the audience through the diagram slowly:

> "In the old model, the channel determines what is possible. You enter a web flow, an app flow, or a chat flow, and everything downstream is constrained by that choice."

> "In the new model, intent comes first. The system interprets what is needed, the orchestrator selects the right components, and only at the end does the channel decide how to render the result."

> "That means the channel becomes presentation, not control logic."

> "This is the core inversion. Same customer. Same need. But the decision moves from entry point selection to intent orchestration."

**Transition:**
> "Once you make that inversion, the role of the model becomes much narrower and much safer."

---

## Card 5 - The Thesis (8:00-9:00)

**On screen quote:**
> "LLM proposes. The system governs. Execution remains deterministic."

**Speaker notes:**

Deliver this cleanly and once:

> "This is the governing principle of the whole architecture."

> "The AI is the planner. It proposes a structured plan. The orchestrator is the control plane. It decides what can actually run."

> "The model does not execute tools directly. It does not own state. In this PoC, it only sees the user request and returns a plan; the hydrated UI data stays in the orchestration path."

> "That separation is what makes this viable beyond a demo, even though in production you would still move classification and validation server-side."

**Transition:**
> "So if we already had intent-to-flow systems, what exactly is new here?"

---

## Card 6 - Old vs New (9:00-10:00)

**On screen:**
- Previous systems route to a flow
- GenUI composes components with parameters

**Speaker notes:**

> "We already had intent classification. That is not the breakthrough."

> "The old decision was binary: which flow should I send this user into?"

> "The new decision is granular: which components should I render, with what data, at what confidence?"

> "That shift enables structured entity extraction, reusable components, and one definition rendered across three channels."

> "In this PoC, multi-component composition exists, but only in limited cases. The broader pattern is what matters."

> "And critically, it is portable. The same engine can operate in telecom today and ecommerce tomorrow."

**Transition:**
> "Let me show you that live."

---

## Card 7 - Live Demo (10:00-22:00)

**Demo framing line:**
> "I want you to watch for three things: how intent becomes UI, how state survives channel changes, and how the same engine moves across domains."

### Demo Part 1 - FutureTel / Telecom

#### Demo 1: Natural language to parameterised component

**Type:**
`Compare 5G plans with roaming`

**Narration:**

> "I typed a natural-language request. The system classified the intent, selected the comparison component, extracted the relevant plan attributes, and rendered a configured result."

> "There is no hardcoded route here for this exact phrase. The system interpreted the request and matched it to a registered capability."

**Call out:**
- Intent confidence around 90%+
- Extracted entities such as `5G` and `roaming`
- Fast response, roughly 150ms on first pass

#### Demo 2: Entity extraction into a pre-filled form

**Type:**
`I was overcharged $45 for roaming last month`

**Narration:**

> "This is where routing alone stops being enough."

> "The model identifies a billing-dispute intent, extracts the amount, the category, and the period, and the form arrives already structured."

> "In a conventional system, I would still land on a blank form and manually retype the information I just said."

> "Here, the AI is not just classifying. It is compiling the request into structured input for a deterministic component."

#### Demo 3: Direct render for a single clear intent

**Type:**
`Why is my bill so high?`

**Narration:**

> "This is a simpler case, but an important one. When intent is clear, the system can go straight to a domain-specific component and render an explanation path immediately."

> "That is the right use of confidence: reduce friction when the signal is strong."

#### Demo 4: Cross-channel continuity

**Action:**
Switch Web -> App -> Chat

**Narration:**

> "Now the channel changes, but the session does not."

> "You should see the same session identifier, the same task context, and the same progression state carried across all three renderers."

> "This is not three separate products trying to stay in sync. It is one orchestration layer rendered three different ways."

### Demo Part 2 - FutureCommerce / Ecommerce

**Bridge line:**
> "Now I want to prove this is not a telecom-specific design. I am switching domains entirely."

#### Demo 5: Product discovery

**Type:**
`Show me wireless headphones under $100`

**Narration:**

> "Different industry, different data model, same pipeline."

> "Budget is extracted. Product category is extracted. Keywords are extracted. The product component renders with those parameters."

> "What changed here is the component registry and the data layer, not the architecture."

#### Demo 6: Order tracking

**Type:**
`Where is my order ORD-789?`

**Narration:**

> "The order identifier is pulled straight from natural language, and the order-tracking component renders a structured timeline."

> "Again, same orchestration model. New component. New data source."

#### Demo 7: Return flow

**Type:**
`I want to return my Sony headphones`

**Narration:**

> "This is another strong example of structured intent. The system recognizes the return request, identifies the product, and prepares the form in the right context."

> "This is where adaptive UI becomes useful: the user does not start from a menu. They start from intent."

#### Demo 8: Cache hit

**Action:**
Repeat any previous query

**Narration:**

> "Now you should see the cached badge and a noticeably faster response."

> "The cached payload is reused, so the orchestrator can skip repeat hydration and return the same UI much faster."

> "In the current PoC, classification still happens first. The production optimisation is to move cache and deterministic routing ahead of the model so repeated and obvious requests avoid AI cost entirely."

**Transition back to slides:**
> "So now you have seen the core claim: one engine, two domains, three channels, one orchestration pattern."

---

## Card 8 - The Architecture (22:00-24:30)

**On screen headline:**
> Three things that make this not a chatbot.

**Speaker notes:**

**1. The AI proposes; the UI stays bounded.**

> "The model returns a structured plan, typically JSON. In this PoC, the UI can only render components that exist in the fixed component map."

> "If the model returns an unknown component name, the PoC shows an error state. In production, the orchestrator should reject that earlier and never let it reach render."

**2. State lives in the orchestrator, not the LLM.**

> "Session continuity, completed steps, channel context, and confidence traces are managed centrally."

> "The model is stateless between requests. Continuity comes from the system architecture, not from pretending the model remembers."

**3. Confidence is visible now, actionable next.**

> "Confidence is not just a debugging metric, but in this PoC it is primarily an observability signal."

> "The production step is to use that signal to trigger clarification, fallback, or escalation when certainty drops."

**Transition:**
> "The next question is the one every technical leader asks next: what does this cost?"

---

## Card 9 - On Cost (24:30-27:00)

**On screen:**
- PoC today: classify first, then cache repeated hydration
- Production: cache first, then deterministic routing
- Ambiguous requests: call Gemini

**Speaker notes:**

> "The assumption people make is that every user interaction now incurs an AI cost. That is the wrong model."

> "For the architecture, the right model is tiered. For the current PoC, the implementation is simpler."

> "Today, the app classifies first, then uses a local TTL cache to skip repeat hydration work."

> "The production pattern is what you would expect: check cache first, route obvious cases through deterministic matching, and only call the model for the ambiguous requests."

> "That concentrates AI cost on the hard cases, which are also the cases where deterministic routing performs worst."

> "So the economics improve when the system is designed correctly. You pay for reasoning where reasoning adds value."

**Transition:**
> "That said, this is still a proof of concept, and I want to be explicit about the boundaries."

---

## Card 10 - What This Is (and Isn't) (27:00-28:30)

**Speaker notes:**

> "This is a working reference implementation of an intent-first orchestration pattern."

> "It demonstrates the pattern live across two domains, which matters because domain portability is part of the claim."

> "It is also production-shaped. There is a control plane, a registry, explicit state handling, and a clear place for governance."

Pause, then set the boundary:

> "It is not a production deployment."

> "It is not a replacement for your existing workflow engine."

> "It is not a finished governance framework."

> "And it is not a claim that generative UI is always the right answer."

> "The point is narrower and more useful: this is a concrete architectural pattern for turning ambiguous intent into deterministic UI."

**Transition:**
> "So if you remember one thing, remember this."

---

## Card 11 - Close (28:30-30:00)

**On screen line 1:**
> Stop asking which flow.

**On screen line 2:**
> Start asking which components, with what data, at what confidence, for which channel, in which domain.

**Speaker notes:**

Deliver the close cleanly:

> "Customers do not think in flows. They think in intent."

> "The next phase of AI in digital experience is not smarter chatbots. It is unified intent orchestration with adaptive, deterministic rendering."

> "That is the shift this PoC is meant to make visible."

> "If you are building toward this, evaluating it, or disagree with it, I would be glad to talk."

> "Thank you."

Then stop and take questions.

---

## Q&A Backup

**If asked: "Isn't this just a chatbot?"**
> "No. A chatbot primarily returns language. This system returns governed, structured UI and uses the model only as a planner. The control logic remains deterministic."

**If asked: "Why not just use a workflow engine?"**
> "Workflow engines are strong at deterministic execution after the route is known. They are weak at resolving ambiguous, multi-intent input before the route exists. These solve different layers of the problem."

**If asked: "What prevents hallucinated UI?"**
> "In the PoC, the fixed component map limits what the UI can render, but unknown component names still surface as an error. In production, you reject those at the orchestrator boundary so the safeguard becomes structural."

**If asked: "Why show two domains?"**
> "To prove the abstraction is portable. The same orchestration pattern survives when the business domain, data model, and components change."

**If asked: "Is this production-ready?"**
> "No. It is a PoC with production-shaped architecture. The next steps are server-side validation, stronger policy controls, cache-before-classification, integration hardening, and operational validation."

---

## Presenter Checklist

- Open with confidence and do not rush the first two cards
- During the demo, narrate system decisions, not UI chrome
- Explicitly say "same engine" when switching domains
- Explicitly say "same session" when switching channels
- End on the architecture shift, not on the demo mechanics

---

*CAIS 2026 - Unified Generative UI: Intent-Driven Adaptive Interfaces*
