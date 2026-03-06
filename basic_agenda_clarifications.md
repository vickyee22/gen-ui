#1 What You Had (Singtel Chatbot)

User input
    ↓
Intent detected (subagents)
    ↓
AI maps to flow ID
    ↓
Flow executes on FE
    ↓
Binary — Flow A or Flow B
The constraint: The flow is the unit. Binary selection. Fixed steps. If intent is unclear, you still pick one. If query spans two intents, you still pick one.

What's Different Here
1. Binary → Parameterised
Singtel: "Intent is bill_enquiry → trigger bill enquiry flow"

GenUI: "Intent is bill_enquiry, confidence 88%, extracted: amount=$45, period=Jan, issueType=roaming → render DynamicForm pre-configured with these values"

Same routing, but the parameters travel with the intent. The form doesn't arrive blank. The flow doesn't need to ask questions the user already answered.

2. Confidence as a Decision Signal
Singtel: Classifier picks a flow. Confidence might be 51% but you still commit to that flow.

GenUI: Confidence is a live signal you can act on:

90%+ → render component immediately
60-80% → render component but show "Did you mean...?"
<60% → ask clarifying question before rendering anything
Multi-intent → return two components simultaneously
You're not locked into binary commit. Confidence gates what happens next.

3. Composition Over Selection
Singtel: Flow A OR Flow B. One path.

GenUI: Component A AND Component B when the query warrants both.

"My bill is high and I'm thinking of upgrading my plan"

Singtel routes to one flow. GenUI returns [BillShockChart, ComparisonTable] in a single response. No new flow definition needed.

4. Extensibility Without Rewriting Routing Logic
Singtel: Adding a new intent means:

Define new flow
Add new routing rule
Test all existing routes don't break
Deploy
GenUI: Adding a new capability means:

Register a new component in the registry with a description
Gemini automatically considers it for future queries
No routing rules to update, no flows to define
The registry is the routing table. Gemini reads it and selects. You extend by adding, not by rewriting.

5. Cross-Channel From One Definition
Singtel: Web team owns web flow, App team owns app flow, Chat team owns chat flow. Three codebases. Diverge over time.

GenUI: One orchestration layer. Channel is a rendering config — same component, different layout. Change logic once, all three channels update.

The Cleanest Way to Say This on Stage
"We already had deterministic intent-to-flow mapping at Singtel. What we didn't have was parameterised component composition with confidence-aware routing across channels from a single definition.

The old system asked: which flow?

This system asks: which components, with what extracted data, at what confidence, for which channel?

That's not a chatbot upgrade. That's a different abstraction entirely."

That's your sharpest point. The shift isn't from dumb to smart. It's from flow selection to component composition with live confidence signals. You've already built the first. This is the next layer.




###############################


#2 Where the Cost Actually Lives

User query
    ↓
Gemini API call (~150ms, ~500 tokens) ← COST
    ↓
Data hydration (mock now, real DB calls in prod) ← COST
    ↓
Render (React, free)
Two real costs: AI classification and data fetching. Rendering itself is free.

What's Already Solving It (In This Codebase)
TTL Cache — the biggest lever you already have

First query:  "Compare 5G plans" → Gemini call → 145ms → cached
Second query: "Compare 5G plans" → cache hit  →  12ms → FREE
Same input, same output, within 60 seconds → zero API cost. For a telco, the top 20 queries probably cover 70% of volume. Those 20 will cache aggressively.

The Core Architectural Fix: Tiered Classification
This is the production pattern. Don't call Gemini for everything.


Query arrives
    ↓
Tier 1: Exact cache hit?          → return cached (0ms, $0)
    ↓ miss
Tier 2: High-confidence keyword?  → return keyword result (1ms, $0)
    ↓ miss
Tier 3: Ambiguous/complex query   → call Gemini (150ms, $0.001)
Your keyword fallback is already Tier 2. It just runs as a failure mode today. Flip it to run as the first pass:


// Current (suboptimal): try Gemini → fail → keyword
// Better: keyword first → only call Gemini for ambiguous cases

function classifyIntent(query) {
  const keywordResult = keywordFallback(query);
  
  if (keywordResult.confidence > 0.85) {
    return keywordResult;  // Skip Gemini entirely
  }
  
  return callGemini(query);  // Only for genuinely ambiguous queries
}
In a real telco, maybe 60-70% of queries hit Tier 1 or 2. You only pay for the remaining 30%.

The Deeper Architectural Separation
The more important fix is separating two things that are currently coupled:

Concern	Frequency	Cache strategy
Intent classification	Per query	Short TTL (60s), per session
Component data (plans, prices)	Per day	Long TTL (1hr+), CDN-served
Right now both expire at 60 seconds. In production:

Plan prices don't change by the minute — cache at CDN edge, invalidate when product team publishes
Bill data is user-specific — cache per session, short TTL
Intent classification for "compare plans" is the same for all users — serve from edge

Anonymous user: "Compare 5G plans"
→ Intent classified (Tier 2, keyword, free)
→ Plan data served from CDN edge (not DB call, very fast)
→ Total cost: near zero
What Gemini Actually Costs Per Call
To ground this: Gemini 2.5 Flash is one of the cheapest models available.

Your classification prompt + query: ~300 input tokens
Classification response JSON: ~100 output tokens
Cost per call: roughly $0.0002–0.0005
At 10,000 queries/day with 30% hitting Gemini (after cache + keyword tiers):

3,000 Gemini calls × $0.0005 = $1.50/day
That's not a cost problem. It's a latency problem. And the tiered model solves latency too.

Server-Side for Production (Critical)
Currently the API key is on the client. That's fine for a demo — not for production. Moving to server-side unlocks the real architectural wins:


Client → Your API server → [cache check] → [Gemini if needed]
                                ↓
                         Server-side cache
                         (shared across all users)
Client-side cache: only benefits one user's repeated queries.
Server-side cache: "Compare 5G plans" cached once → serves all users.

Cache hit rate goes from ~20% to ~70%+ overnight.

Summary: The Architecture That Makes Cost Negligible

1. Tiered classification
   Keyword → confident? → done, no API call
   
2. Server-side shared cache
   Common queries cached once, served to all

3. Separate TTLs per data type
   Plan data: CDN, 1hr TTL
   Bill data: session-scoped, 5min TTL
   Intent: query-scoped, 60s TTL

4. Gemini only for genuinely ambiguous input
   Edge cases, multi-intent, entity extraction from complex sentences
The cost argument actually inverts under this model:

"We only pay for AI when the query is too complex for rules. For everything else, it's free. And the cases where we pay AI are exactly the cases where rules would get it wrong — so we're paying for correctness, not overhead."

That's a solid engineering answer for any CTO in the room.

######################################################

#3 Honest Answer: Where It's NOT Better Than Rules
For click-driven navigation, traditional is superior:

User clicks "Compare Plans" → show ComparisonTable
Zero latency, zero API dependency, zero failure mode
Rules-based wins completely
If your users always arrive via menus and buttons, GenUI adds nothing but complexity.

Where GenUI Actually Earns Its Complexity
1. Entity Extraction → Pre-filled Forms
This is the most concrete value. Traditional rules-based cannot do this:


User types: "I was overcharged $45 for roaming last month"
Rules-based:

Routes to bill_waiver form ✅ (if keyword "overcharged" matches)
Form arrives empty ❌
User re-types: amount, period, issue type — everything they already told you
GenUI:

Routes to bill_waiver form ✅
Form arrives with: amount = "$45", issueType = "roaming", period = "Jan 2026" ✅
User just confirms and submits
That gap — unstructured text → structured pre-filled data — is something no config file or keyword router can do. The AI is doing real extraction work, not just routing.

2. Conversational Entry Points Have No Menus
Rules-based UI rendering assumes the user navigated to something. Chat, voice, and support agent interfaces have no buttons to click. The user types:

"My internet is slow and I think I'm on the wrong plan"

Rules-based: Which flow do you route to? TroubleshootingWidget or ComparisonTable? You'd need to build a disambiguation tree. Then maintain it as queries evolve.

GenUI: Gemini returns ["TroubleshootingWidget", "ComparisonTable"] for multi-intent. No code change needed.

3. Cross-Channel From One Definition
Traditional cross-channel reality:

Web team builds ComparisonTable in React
App team builds a card-swipe version in SwiftUI/Kotlin
Chat team builds a text list version
Three codebases, three maintenance burdens, three points of divergence
GenUI:

One component definition
Three channel configs (layout, animation, showDetails)
Change the data model once, all three channels update
This only matters at scale, but it's architecturally real.

4. Semantic Edge Cases Without New Code
Rules-based routing is brittle at the edges:

User query	Keyword match	Semantic match
"Compare 5G plans"	✅ hits "compare"	✅
"What's the cheapest option for my travel?"	❌ no keyword	✅ roaming/plan comparison
"Looking to move my line across"	❌ no keyword	✅ port request
"I'm getting billed for something I didn't use"	❌ ambiguous	✅ bill waiver form
Every one of those edge cases in a rules system requires a developer to add a keyword. Gemini handles them without code changes.

Honest Complexity Cost
Aspect	Cost	Mitigation
Gemini API latency	+100-150ms per request	TTL cache (repeat queries = 12ms)
API key dependency	Risk of failure	Keyword fallback (always works)
Extra orchestration layer	More failure modes	Deterministic fallback at every step
JSON payload overhead	Larger state	Minimal for 5 components
The fallback design is what makes it defensible. If Gemini is down, keyword fallback runs. The system degrades gracefully rather than failing completely.

The Clean Framing for the Stage
"If your users always click menus, you don't need this. But the moment users start typing — in a chat widget, a support tool, a voice interface, a search box — your rules engine breaks down on edge cases and can't extract structured data from natural language.

GenUI is not about replacing rendering. The rendering layer is traditional and deterministic. The value is in the single step where unstructured human language becomes a structured, parameterised component payload — including extracted entities that pre-fill forms the user never has to fill again.

That's the gap this solves."

That's the crisp version. One sentence: rules-based rendering is fine; rules-based parsing of unstructured input is not.