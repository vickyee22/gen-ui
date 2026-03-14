# Option 4 — Concrete + Architectural + Honest

## Title
From Intent to Adaptive Interface: Generative UI for Enterprises

## Subtitle
A working PoC, an architectural argument, and the enterprise case for bounded Generative UI.

---

A customer types: *"Why is my bill high and I want to raise a waiver."*

In a traditional system, that query routes to one flow. Maybe bill enquiry. Maybe a dispute form. The system picks one, and the customer re-explains everything the routing discarded.

A different kind of system can respond in a more useful way. It can return two governed components simultaneously — a bill breakdown chart and a pre-filled waiver form — with the charge type, amount, and billing period already extracted from the sentence.

No new flow was defined for that combination. The system composed a bounded interface from intent.

That is the architectural idea I want to unpack: not just UI generation, but the move from routing users into predefined flows toward assembling the right interface from intent.

---

## The hidden tax enterprises already pay

Most enterprises have implemented the same customer capability at least three times. A web flow. An app flow. A chat flow.

The visible cost is duplication. The deeper cost is that each channel becomes the place where business logic lives. Over time, the three diverge. The customer experiences one company through three different decision models.

At the same time, customer intent is rarely clean.

People do not think in workflow entry points. They combine problems, context, and desired outcomes in one sentence. Traditional digital architectures assume intent is singular and neat. The customer is neither.

## The inversion

The familiar model:

```
Channel → Flow → Data → Render
```

What I argued for:

```
Intent → Plan → Govern → Hydrate → Render
```

The channel stops being the router. It becomes the renderer.

Instead of starting from a page or a channel-specific workflow, the system first decides what interface should be assembled from the user's intent. Then governance, data, and rendering layers determine what is actually shown.

That decision layer — between raw intent and governed interface — is where I think a meaningful part of the enterprise opportunity now sits.

## Generative UI is a spectrum, not a binary

When people hear "Generative UI", they often imagine the most extreme version: a model inventing interface structure dynamically at runtime — fields, layout, flow, all generated.

That is one end of the spectrum. It is not the only useful interpretation.

At the other end is **bounded Generative UI**: the system selects and configures governed components within a trusted boundary. The interface is assembled at runtime, but from known building blocks under policy control.

The PoC I built sits on the bounded end. That is not a limitation. It is exactly what makes the pattern credible for enterprise use.

The model should not be the runtime. It should be the planner.

## What this looks like in practice

The system classifies natural language intent, selects one or more components from a governed registry, extracts parameters, hydrates data, and renders the result — all from a single orchestration layer that serves web, app, and chat.

Concretely:

- **"Compare 5G plans with roaming"** → selects the comparison component, extracts plan types, renders a structured table. Not a paragraph of text. A governed UI component.

- **"I was overcharged $45 for roaming last month"** → selects the dispute form, pre-fills: amount = $45, issue type = roaming, period = January 2026. The form does not arrive blank.

- **"Why is my bill high and I want to raise a waiver"** → returns *two* components: a bill breakdown chart and a waiver form. Multi-intent, composed at runtime, no new flow definition required.

- **Switch from Web to App to Chat** → the same decision model renders differently. The channel is a rendering config, not the control point.

- **Switch from telecom to ecommerce** → the same orchestration pattern works. Different domain, different data, same architecture.

The important point is not that AI can generate pixels. It is that AI can help decide what interface to assemble, while the system retains authority over what is allowed.

## Entity extraction is where the real value lives

This is the most concrete gap between traditional routing and what this pattern enables.

A rules-based system can route "I was overcharged" to a dispute form. It cannot extract the amount, the charge type, and the billing period from the sentence and pre-fill the form before the user sees it.

That extraction — unstructured text to structured, pre-filled interface state — is work that no config file or keyword router can do. The AI is doing real semantic work, not just routing.

For the customer, the difference is immediate: they confirm and submit instead of re-typing everything they already told you.

## Multi-intent changes the economics of flow design

Traditional flow-based systems handle one intent per interaction. If the query spans two intents, the system picks one and discards context.

With bounded Generative UI, multi-intent becomes a composition problem instead of a routing dilemma.

*"Track my order and show me similar products in case it's delayed"* returns an order tracker and a product recommendation grid. No disambiguation tree. No new flow to define. The system composes from its registry.

This matters at scale because it changes how you extend the system. Adding a new capability means registering a new component with a description. The classifier automatically considers it for future queries. No routing rules to update. No flows to redefine.

The registry is the routing table. The model reads it and selects. You extend by adding, not by rewriting.

## The cost model that makes it credible

An honest concern with AI-powered classification is cost and latency.

The PoC uses tiered classification:

```
Tier 1: Cache hit           → instant, free
Tier 2: Keyword match       → ~1ms, free
Tier 3: Model reasoning     → slower, paid
```

Repeated queries hit cache. Common queries match keywords deterministically. Only genuinely ambiguous or multi-intent queries invoke the model.

In a real deployment, a meaningful share of traffic should resolve at Tier 1 or 2. The model should be reserved for the cases where rules would get it wrong — which is exactly where it is worth paying for better interpretation.

The fallback design also means the system degrades gracefully. If the API is unavailable, keyword classification runs. The experience continues. That is not a workaround. It is an architectural property.

## When NOT to use this

I want to be precise about where this pattern earns its complexity.

For menu-driven navigation, traditional routing is superior. A user clicks "Compare Plans" and you show the comparison table. Zero latency. Zero API dependency. No reason to involve AI.

The value appears at the boundary where structured systems meet unstructured human input: search boxes, chat widgets, support tools, voice interfaces. The moment users start typing instead of clicking, rules-based routing breaks down on edge cases and cannot extract structured data from natural language.

Rules-based rendering is fine. Rules-based parsing of unstructured input is not.

That gap is the specific layer this pattern addresses.

## The control model

Three design choices make this governable:

**1. The model proposes a plan, not arbitrary UI.**
The output is bounded by a fixed component registry. The model cannot invent components that do not exist.

**2. State and control live in the system, not in the model.**
Session continuity comes from orchestration state, not model memory. The system is stateful. The model is stateless.

**3. Execution remains deterministic.**
The model suggests. The system validates, hydrates, and renders.

The principle I kept returning to throughout the talk:

**The AI is advisory. The system is authoritative.**

## What this proves, and what it does not

I want to be honest about the claim.

**This PoC proves:**
- Intent can be translated into bounded UI plans
- Multi-intent composition works without predefined flows
- Entity extraction pre-fills interfaces in ways keyword routing cannot
- The same orchestration pattern survives a domain switch
- Channels can render the same governed decision differently

**This PoC does not yet prove:**
- Full production governance at enterprise scale
- Real backend integration with live systems
- Omnichannel session continuity across enterprise infrastructure
- Compliance readiness

The implementation is a PoC. The architecture is the point.

## Where this goes next

I do not think every part of the interface should be generative.

A practical next step is selective deeper generation inside trusted zones. eForms are one example: the outer experience stays bounded, but the system generates only the fields required for a specific case — based on intent, extracted entities, policy, and backend schema constraints.

Bounded by default. More expressive where variability creates real value.

## Why I chose to present this

These were the ideas behind the proof of concept I recently presented at the Conversational AI Innovation Summit (CAIS) 2026 in Singapore.

What I wanted to show was not only a demo, but a build path: a way of thinking about Generative UI that is ambitious enough to matter, but controlled enough to be useful in enterprise environments.

The next phase of AI in digital experience is not just better chat. It is systems that can translate messy human intent into governed, structured, channel-aware interfaces.

That is what this PoC was really about.
