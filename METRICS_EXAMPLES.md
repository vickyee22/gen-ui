# GenUI Metrics Examples — Query Variations

This table shows how the metrics panel values change across different user queries and their resulting orchestration outcomes.

## Query Examples & Metrics Breakdown

| # | Query | Intent | Components | Plan Steps | Tools | Policy Checks | Confidence | Entity Confidence | Entities Extracted | State Size | Total Time |
|---|-------|--------|-----------|-----------|-------|---------------|------------|------------------|------------------|-----------|-----------|
| **1** | "hello" | greeting | None | 2 | 0 | 2 | 100% | — | — | 0.8 KB | 45 ms |
| **2** | "Compare 5G plans" | compare_plans | ComparisonTable | 3 | 1 | 3 | 92% | 65% | planTypes: ["5G"] | 4.2 KB | 145 ms |
| **3** | "I was overcharged $45 for roaming last month" | bill_waiver_form | DynamicForm | 3 | 1 | 3 | 88% | 85% | issueType: "roaming", amount: "45", period: "jan-2026" | 3.1 KB | 198 ms |
| **4** | "My internet is slow" | troubleshooting | TroubleshootingWidget | 3 | 1 | 3 | 72% | — | — | 2.8 KB | 110 ms |
| **5** | "Port my number to NovaTel" | port_request_form | DynamicForm | 3 | 1 | 3 | 91% | 78% | service: "mobile", action: "port" | 2.9 KB | 167 ms |
| **6** | "Why is my bill so high?" | bill_explanation | BillShockChart | 3 | 1 | 3 | 85% | 60% | period: "current" | 5.1 KB | 156 ms |
| **7** | "Compare iPhone 16 vs Samsung S25" | device_comparison | ComparisonTable | 3 | 1 | 3 | 94% | 88% | planTypes: ["Device"], devices: ["iPhone 16", "Samsung S25"] | 6.8 KB | 172 ms |
| **8** | "Bundle fiber, TV, and mobile" | bundle_builder | BundleBuilder | 3 | 1 | 3 | 89% | 72% | services: ["fiber", "tv", "mobile"] | 7.4 KB | 189 ms |
| **9** | "Help, WiFi not working" | troubleshooting | TroubleshootingWidget | 3 | 1 | 3 | 68% | — | — | 2.8 KB | 98 ms |
| **10** | "Contact support about device delivery" | contact_form | DynamicForm | 3 | 1 | 3 | 90% | 82% | subject: "Device delivery enquiry", issueType: "delivery" | 3.3 KB | 154 ms |
| **11** | "Give feedback on my experience" | feedback_form | DynamicForm | 3 | 1 | 3 | 75% | 50% | feedback: "service quality" | 2.6 KB | 82 ms |
| **12** | "Compare 5G plans" (cached) | compare_plans | ComparisonTable | 3 | 1 | 3 | 92% | 65% | planTypes: ["5G"] | 4.2 KB | 12 ms 💾 |

---

## Metric Explanations

### State Size (KB)
- **Greeting (no components)**: ~0.8 KB — just intent metadata + message
- **Single component**: ~2.6–7.4 KB — depends on component data (charts/forms are larger)
- **Chart-heavy (BillShockChart)**: ~5.1 KB — waterfall data, legend, values
- **Device comparison**: ~6.8 KB — multiple device specs, feature matrices
- **Bundle builder**: ~7.4 KB — full pricing model, all service options

### Total Time
- **Cached result** (query #12): 12 ms — simple cache lookup
- **Fallback classifier** (queries #4, #9, #11): 82–110 ms — keyword matching is fast
- **AI classifier + hydration**: 145–198 ms — Gemini API call + data fetch
- **Complex components** (bundle, devices): 172–189 ms — more data to serialize

### Validation Status
- **❌ REMOVED**: We removed the AI/Fallback validation indicator from the metrics panel
- **Why**: It was a hardcoded heuristic based on API response time, not reliable in production
- **What it was**: `intentTime > 50ms = "AI"`, `intentTime ≤ 50ms = "Fallback"`
- **Issue**: Depends entirely on network latency; not actionable for users or architects
- **Replacement**: Keep the "💾 cached" badge (more informative); use confidence % instead

### Policy Checks
- **No components** (message-only): 2 checks
  - Check 1: PII detection (no data returned, low risk)
  - Check 2: Rate limiting
- **1+ components** (data returned): 3 checks
  - Check 1: Content policy (roaming, overcharge, PII in form data)
  - Check 2: Rate limiting
  - Check 3: Guardrails (form submission, compliance)

### Confidence Breakdown
| Metric | Source | Notes |
|--------|--------|-------|
| **Intent Confidence** | Gemini model | 68–94% depending on query clarity |
| **Entity Confidence** | Extracted field count | `60% + (prefilledCount × 15%)` → capped at 95% |
| **Plan Confidence** | Intent confidence − 5% | Slightly lower than intent, reflects orchestration uncertainty |

Example (query #3):
- Intent: "overcharged" → Gemini confidence 88%
- Entities extracted: amount + period + issueType = 3 fields
- Entity confidence: `60 + (3 × 15) = 95%`
- Plan confidence: `88 × 0.95 = 83%`

---

## Pattern Observations

### 1. **Component Count → Metrics Coupling**
When components.length increases:
- Plan Steps: +1 per component
- Tools: +1 per component (one hydration call each)
- Policy Checks: Jump from 2 → 3
- State Size: +1–3 KB per component
- Total Time: +30–50 ms per component

### 2. **Cached Queries Are Instant**
Query #12 (repeat of #2) shows 12 ms total (vs 145 ms original).
- Intent classification: ~2 ms (not called, bypassed cache lookup)
- Orchestration: ~10 ms (cache hit, skip hydration)
- Hydration: ~0 ms (skipped)
- Latency badge: Shows "💾 cached" indicator

### 3. **Form-Based Intents (DynamicForm) Extract More Entities**
- Bill waiver (#3): 3 extracted fields → 85% entity confidence
- Contact form (#10): 2 extracted fields → 82% entity confidence
- Feedback (#11): 1 extracted field → 50% entity confidence
- Comparison (#2, #7): Depends on devices/plans mentioned

### 4. **Fallback Classifier Appears Fast But Less Accurate**
- Queries #4, #9, #11 hit fallback (intentTime < 50 ms)
- Confidence scores are lower (68–75% vs 88–94%)
- Still render the correct component (keyword matching works)
- In production, you might NOT show this indicator (see next section)

---

## ✅ We Removed the "Validation Status" Indicator

**Decision**: Removed the `validationStatus: 'AI' | 'Fallback'` from metrics panel

### Why It Was Problematic:
1. **Hardcoded heuristic**: `intentTime > 50ms = "AI"` is arbitrary and unreliable
2. **Network-dependent**: API latency varies; fast network would show as "Fallback" incorrectly
3. **Leaky abstraction**: Exposes internal implementation detail (doesn't matter to users)
4. **Not actionable**: Users don't care *how* the intent was classified; they care that the right component rendered

### What Stays:
- ✅ **Confidence % breakdown** — Shows how confident the system is about the result
- ✅ **"💾 cached" badge** — Shows real performance win (145ms → 12ms)
- ✅ **Plan Steps & Tools** — Shows orchestration complexity
- ✅ **Policy Checks** — Shows governance layer exists

### Result for CAIS 2026:
The metrics panel now shows **what matters**:
- How confident is the AI?
- How many components executed?
- Was it cached?
- How long did it take?

Not: What internal implementation detail was used to classify this intent?

---

## Session Continuity Example

If a user follows this sequence:

| Step | Channel | Query | Session ID | Completed Steps |
|------|---------|-------|------------|-----------------|
| 1 | Web | "Compare 5G plans" | S-7F3A | 1 |
| 2 | Web | "Why is my bill high?" | S-7F3A | 2 |
| *Switch to App* | App | — | S-7F3A | 2 (resumed) |
| 3 | App | "Port my number" | S-7F3A | 3 |

**What the keynote audience sees:**
1. Submit query on Web → see metrics
2. Switch to "App" channel
3. Toast appears: "Resuming session S-7F3A... Loaded 2 completed steps" ✨
4. Same session ID persists across all three queries
5. Completed steps increment as they interact
6. **Narrative**: "This is the same GenUI orchestration running across Web, App, and Chat — no re-classification, no data re-fetch."

---

## Next: Policy Checks & Guardrails

See `POLICY_FRAMEWORK.md` for details on:
- What policy checks run (content, rate-limit, PII, compliance)
- What guardrails would reject (SQL injection, abuse, rate-limit breach)
- How they integrate with the trace view
