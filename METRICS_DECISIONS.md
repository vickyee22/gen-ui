# Metrics Panel Design Decisions — CAIS 2026 Keynote

This document captures the decisions made about what to show/hide in the metrics panel and why.

---

## Decision 1: Remove "Validation Status" (AI vs Fallback)

### What Was Removed
```javascript
// Before (App.jsx line 93)
validationStatus: intentResult.processingTime > 50 ? 'AI' : 'Fallback'

// In metrics panel (lines 365-367)
<span className="metric-label">Validation</span>
<span className="metric-value">{metrics.validationStatus === 'AI' ? '✓ AI' : '⚠ Fallback'}</span>
```

### Why It Was Wrong for a Keynote

| Problem | Explanation |
|---------|-------------|
| **Hardcoded heuristic** | Threshold (50ms) is arbitrary; varies with deployment, network, Gemini load |
| **Not reliable** | API latency is unpredictable; fast response = false "Fallback" reading |
| **Leaky abstraction** | Exposes implementation detail that architects shouldn't care about |
| **Not actionable** | Users don't think: "Is this AI or keyword matching?" They think: "Does it work?" |
| **Confusing for demo** | Keynote audience might see "Fallback" and think the demo is failing |

### What a Production System Should Do

Instead of exposing the internal method:

| Alternative | When to Use | Benefit |
|-------------|-----------|---------|
| Don't show it | Always (best option) | Clean, focused metrics panel |
| Show API latency | For engineers debugging | "Intent classified in 87ms" is informative |
| Debug mode only | Dev/testing environment | Hidden from keynote, available for investigation |
| Show cache status | Always | "💾 cached" shows real performance value |

### Why We Chose: Don't Show It

**Keynote narrative**:
> "GenUI deterministically selects components based on intent. You don't need to know whether it used AI or keyword matching—the result is the same. What matters is confidence and performance."

This makes the demo look like **production infrastructure**, not a technical showcase of implementation details.

---

## Decision 2: Keep the Cache Status Badge (💾 cached)

### Why This Stays
Unlike the validation status, cache status is **immediately useful**:

```
First query: "Compare 5G plans" → 145ms
Second query: "Compare 5G plans" → 12ms 💾
```

**Narrative for keynote**:
> "Notice the TTL-based cache? Identical queries return in 12ms. In production, that's massive cost savings and deterministic behavior."

**Metrics impact**:
- Shows caching strategy is working
- Proves **determinism** (same input = same output within cache TTL)
- Real performance win (10x speedup)
- Not a leaky abstraction; it's an architectural achievement

---

## Decision 3: Highlight Confidence Breakdown (Intent + Entity + Plan)

### Why This Is More Valuable Than Validation Status

**Before**:
- Intent: 92%
- Validation: ✓ AI (hardcoded, confusing)

**After**:
- Intent confidence: 92% (how confident about the intent?)
- Entity confidence: 85% (how confident about extracted parameters?)
- Plan confidence: 87% (overall orchestration confidence)

**Narrative**:
> "See the confidence breakdown? Entity extraction is 85% confident because we found: overcharge amount ($45), period (January), and service type (roaming). In production, if entity confidence is too low, we'd ask clarifying questions."

This is **production-realistic**:
- Real systems track entity extraction accuracy
- Low confidence triggers fallback or human escalation
- Transparent to architects and stakeholders

---

## Decision 4: Policy Checks — Show Count, Not Details

### What We Show
```
Policy Checks: 3 (when components present)
Policy Checks: 2 (when message-only)
Guardrails Triggered: 0
Unsafe Actions Rejected: 0
```

### Why We Don't Show Details
- Scary for a keynote: "SQL injection detected" (even when blocked)
- Details belong in trace view, not main metrics
- Count is enough to signal "governance layer exists"

### Narrative for Keynote
During the demo:
> "Every request goes through policy checks—content, rate limit, guardrails. You can see it here: 3 checks executed, 0 guardrails triggered. In production, we'd log rejected requests and escalate to human review."

Optionally, during Q&A:
> "Real guardrails would catch SQL injection, PII exposure, abuse patterns, rate limit breaches. Today's demo shows the happy path, but the infrastructure is there."

---

## Decision 5: Session Continuity — The Mic Drop Moment

### What This Shows
```
Session ID: S-7F3A (stays the same across Web → App → Chat)
Completed Steps: 2 (increments with each interaction)
Toast on channel switch: "Resuming session S-7F3A... Loaded 2 completed steps"
```

### Why It's Powerful for a Keynote

**Narrative**:
> "Watch what happens when we switch channels. Same session ID, same completed steps, same state. GenUI orchestration is **channel-agnostic**. You could start on Web, continue on App, finish on Chat—the system knows where you left off."

**What the audience sees**:
1. Submit query on Web
2. Switch to "App" channel
3. Toast: "Resuming session S-7F3A... Loaded 1 completed step" ✨
4. Continue from where you left off

**Impact**: This proves **cross-channel orchestration** is real, not just UI theater.

---

## Decision 6: Trace View — Observability for Architects

### What This Shows
```
Step 1: Intent Classified (87ms, AI)
Step 2: Policy Checks (4ms, 3 checks)
Step 3: Hydration (45ms, 1 component)
```

### Why It Matters
- **For architects**: "I can see exactly how long each phase takes"
- **For debugging**: "This query is slow—let's check which step takes time"
- **For keynote**: "This is production infrastructure. We can observe and trace every request."

**Narrative**:
> "Open the Trace tab. You see the full execution timeline: intent classification, policy checks, component selection, data hydration. Every step measured. This is what production observability looks like."

---

## Metrics Panel Layout (Current)

### Tabs
- **Metrics** (default)
  - STATE: Session ID, Completed Steps, State Size
  - PLAN: Steps, Tools, Replans
  - GOVERNANCE: Policy Checks, Guardrails, Unsafe Actions
  - CONFIDENCE: Intent %, Entity %, Plan %
  - FOOTER: Timing breakdown + cache indicator

- **Trace** (when available)
  - Step-by-step timeline with durations
  - Status badges (AI, cached, completed)

### What's NOT Shown Anymore
- ❌ Validation Status (AI vs Fallback) — **Removed**
- ❌ Raw JSON dumps — Too technical
- ❌ Gemini API details — Brand neutrality (no vendor lock-in narrative)
- ❌ Token counts — Irrelevant to the audience

### What's Collapsed by Default (Click to Expand)
- Policy check details (full list of what was checked)
- Form field extraction details
- Cache entry debug info

---

## For the Keynote Script

### When Discussing Metrics:
> "GenUI is deterministic. Every request is logged, traced, and governed. You see:
> - **Confidence breakdown**: How sure is the system?
> - **Execution trace**: Where did the time go?
> - **Cache status**: Did we skip expensive work?
> - **Session continuity**: Is the user's context preserved?
>
> No vendor lock-in. No magic. Pure orchestration."

### When Discussing Cache:
> "Watch the latency. First query: 145ms. Second identical query: 12ms. That's the TTL cache. Same input, same output, faster. Production-grade determinism."

### When Discussing Governance:
> "Every request passes through policy checks. Not shown here, but blocking SQL injection, detecting PII, rate limiting, compliance checks. In real production, you'd see guardrails triggered and escalated to human review."

### When Discussing Session:
> "See the session ID? S-7F3A. Watch it stay the same when we switch from Web to App to Chat. GenUI is **channel-agnostic**. The orchestration logic doesn't care about the frontend—it works everywhere."

---

## Files Modified

| File | Change |
|------|--------|
| `src/App.jsx` | Removed `validationStatus` from metrics computation and display |
| `METRICS_EXAMPLES.md` | Updated table + explanations |
| `POLICY_FRAMEWORK.md` | Added (new) — policy checks and guardrails documentation |
| `METRICS_DECISIONS.md` | Added (new) — this file — design decisions |

---

## Remaining Questions for You

1. **Confidence % threshold**: Should we suggest to human review if any confidence drops below 60%? (Currently we just show it)
2. **Trace view depth**: Do you want to show component-level hydration times in the trace? (Currently just the 3 main phases)
3. **Session persistence**: Should we show "Session ID copied to clipboard" when they click the ID?
4. **Guardrails demo**: Do you want a test mode to trigger a guardrail during the keynote? (E.g., prefix with `[ADMIN]` to show rejection)

---

## Next Steps

Ready to:
1. ✅ Commit these changes to the branch
2. ✅ Test the metrics panel with the validation status removed
3. ✅ Practice the keynote narrative with the new metrics framing
4. ✅ Answer architect questions with reference to POLICY_FRAMEWORK.md

Let me know if you'd like any adjustments!
