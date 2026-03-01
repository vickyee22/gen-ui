# GenUI Policy Framework — What Guardrails Would Do in Production

This document explains what policy checks and guardrails exist in a **production GenUI system**. The current CAIS 2026 demo shows the happy path; these guardrails would silently protect the system in real deployments.

---

## Important: Demo vs Production

| Aspect | Demo | Production |
|--------|------|-----------|
| **Intent validation** | Always passes | Checks confidence, auth, intent registry |
| **Policy checks** | Simulated count (2-3) | Real enforcement with rejection |
| **Guardrails triggered** | Always 0 | Blocks abuse, PII, rate limits |
| **Unsafe actions rejected** | Always 0 | Actively prevents harm |
| **Display behavior** | Clean metrics | Logs and escalates violations |

---

## Policy Checks in Production

### Check 1: **Intent Validation**
**When**: Always (after classification, before orchestration)
**Purpose**: Ensures the intent is safe and recognized

**Would verify**:
- Is intent in approved list? (compare_plans, bill_waiver_form, etc.)
- Is confidence above threshold? (e.g., > 60%)
- Is query from authenticated user?
- Is intent attempt suspicious? (rapid retries, pattern matching, etc.)

**In demo**: Always passes
**In production**: Rejection returns: "Unable to process. Please try a different request."

---

### Check 2: **Policy & Governance Checks**
**When**: After intent classification, before data hydration
**Purpose**: Protect against abuse, ensure compliance

**Would run**:
1. **Content policy** — Flag abuse, harassing, or malicious intent
2. **Rate limiting** — Prevent spam and DoS (e.g., 5 forms/min, 20 queries/min)
3. **Compliance** — Ensure request meets regulatory requirements (GDPR, etc.)

**In demo**:
- Metrics panel shows: `Policy Checks: 2` (message-only) or `3` (components)
- `Guardrails Triggered: 0` (always passes in happy path)
- No actual enforcement

**In production**:
- Would actively block requests that violate policy
- Would log violations to security audit trail
- Would escalate severe violations to human review

---

### Check 3: **Cache Validation**
**When**: After policy checks, before data hydration
**What it does**: Checks if this exact query was processed recently

```javascript
// orchestrator.js line 54-74
const cacheKey = getCacheKey(intentResult); // intent + parameters
if (componentCache.has(cacheKey)) {
  const cached = componentCache.get(cacheKey);
  if (isValidCache(cached)) {
    // Return cached result (bypass hydration)
    return { ...cached.payload, fromCache: true };
  }
}
```

**TTL**: 1 minute (CACHE_TTL_MS = 60000)
**Benefits**:
- Identical queries return in ~12 ms instead of 145 ms
- Reduces API calls to hydrator
- Reduces load on database
- Deterministic: same input always gives same output (within TTL)

**In production**: Would likely include:
- User-scoped caching (different users see different cached results)
- Cache invalidation triggers (new bill, new plans released, etc.)
- Cache hit metrics (cost savings from cache hits)

---

## Guardrails: What Would Be Rejected in Production

These examples show what a **real guardrails system** would catch and reject. **The current demo does not implement guardrails** — it shows the happy path where all queries pass (guardrailsTriggered: 0). In production, these would actively block requests.

### Guardrail 1: **SQL Injection Prevention**
**Type**: Input validation
**Trigger**: Malicious query injection in form fields

```
User input: "Robert'; DROP TABLE customers; --"
Component: DynamicForm (bill_waiver)
Field: "reason"

❌ REJECTED
Reason: SQL keyword detected in form field
Action: Redact field content, log security event, notify admin
```

**How it works**:
- Before storing form data, scan for SQL keywords (DROP, DELETE, INSERT, etc.)
- Also detects common injection patterns (UNION, SELECT, etc.)
- Blocks the form submission, shows error to user

---

### Guardrail 2: **PII Leakage Prevention**
**Type**: Data privacy
**Trigger**: User shares personal info in wrong context

```
User query: "My credit card 4532-1234-5678-9012 is not working"
Intent: troubleshooting (technical_support form)

❌ REJECTED
Reason: Credit card number detected outside secure form
Action: Form submission blocked, user prompted to use secure channel
Context: Only port_request form accepts payment info securely
```

**How it works**:
- Regex scan for: credit cards (Luhn check), SSN, passport, phone, address
- If PII found in non-form queries, block or redact
- If PII in form fields, only allow in specific forms (port_request = payment required)

---

### Guardrail 3: **Rate Limiting**
**Type**: Abuse prevention
**Trigger**: User submits too many requests

```
Session: S-7F3A
User actions in 10 seconds: 8 form submissions to bill_waiver

❌ RATE LIMIT TRIGGERED
Reason: Exceed 5 requests/minute per session
Action: Block for 60 seconds, show cooldown message
Impact: guardrailsTriggered = 1, unsafeActionsRejected = 1
```

**How it works**:
- Track requests per session, per user, per IP
- Different limits per operation: (plans = 20/min, forms = 5/min, port = 1/hour)
- Returns 429 Too Many Requests; client shows "Please try again in 45s"

---

### Guardrail 4: **XSS Prevention**
**Type**: Script injection
**Trigger**: Malicious scripts in form fields

```
User input: "<img src=x onerror='alert(1)'>"
Component: DynamicForm (feedback)
Field: "feedback"

❌ REJECTED
Reason: HTML/JavaScript detected in form field
Action: Sanitize HTML, remove script tags, allow safe content
```

**How it works**:
- Use DOMPurify or similar library before storing/rendering form content
- Strip `<script>`, `onerror`, `onclick`, etc.
- Allow safe HTML (paragraphs, links, lists)

---

### Guardrail 5: **Port Request Verification**
**Type**: Business logic
**Trigger**: Port request without account verification

```
User query: "Port my number to NovaTel"
Form type: port_request
User account: Not verified (no KYC completed)

❌ BLOCKED — HIL REQUIRED
Reason: Port requests require account verification
Action: Redirect to account verification screen first
Impact: hilRequired: true, block form submission
```

**How it works**:
- Port requests (high-value operations) require:
  1. Account verified (KYC passed)
  2. Payment method on file
  3. Email/SMS confirmation
- If any missing, set `hilRequired: true` → human-in-the-loop
- Frontend shows: "Please verify your account before porting your number"

---

### Guardrail 6: **Billing Dispute Verification**
**Type**: Business logic
**Trigger**: Dispute request with implausible amount

```
User query: "I was overcharged $10,000 for roaming"
Form type: bill_waiver
Amount: $10,000
Account balance: $500 (impossible to be overcharged more than balance)

⚠️ HUMAN REVIEW REQUIRED
Reason: Disputed amount > account balance + 200% threshold
Action: Auto-escalate to human agent, flag as fraud risk check
Impact: guardrailsTriggered = 1, hilRequired: true
```

**How it works**:
- Fetch user's recent bill data
- If dispute amount seems implausible, flag for human review
- Not a rejection, but escalates urgency

---

### Guardrail 7: **Content Policy Violation**
**Type**: Brand safety
**Trigger**: Hate speech, profanity, harassment

```
User feedback: "Your service sucks, you [slur], fix this!"
Component: DynamicForm (feedback)
Field: "feedback"

❌ REJECTED
Reason: Profanity + hate speech detected
Action: Block form submission, show friendly message
Content filter: Uses transformer model or keyword list
```

**How it works**:
- Content moderation API (Google Perspective, OpenAI Moderation, or local transformer)
- Scans user input before submission
- Blocks or flags content > threshold
- Stores flagged content for review

---

## Current vs. Production Guardrails

| Guardrail | Current Demo | Production | Notes |
|-----------|--------------|-----------|-------|
| SQL Injection | ❌ Not checked | ✅ Regex scan | Demo allows any text; prod blocks SQL keywords |
| PII Detection | ❌ Not checked | ✅ Regex + ML | Demo doesn't scan for SSN/credit card; prod does |
| Rate Limiting | ❌ Not enforced | ✅ Per session/IP | Demo allows unlimited requests; prod throttles |
| XSS Prevention | ✅ (React does it) | ✅ DOMPurify | React auto-escapes; prod also sanitizes |
| Port Verification | ❌ Not checked | ✅ KYC check | Demo allows all port requests; prod verifies account |
| Bill Validation | ❌ Not checked | ✅ Sanity check | Demo allows $10k dispute on $100 bill; prod flags |
| Content Policy | ❌ Not checked | ✅ Moderation API | Demo allows any content; prod filters |

---

## Metrics Impact: When Guardrails Fire (Production Only)

When a guardrail is triggered in production, metrics would show:

```javascript
metrics = {
  guardrailsTriggered: 1,        // Went from 0 → 1
  unsafeActionsRejected: 1,      // Request blocked
  hilRequired: true,             // Human escalation flag
  policyChecks: 3,               // All 3 checks ran
  // Component NOT rendered; show error message instead
}
```

**In the CAIS 2026 demo**: `guardrailsTriggered: 0` (always). This demonstrates the happy path where GenUI successfully orchestrates intent → components. The metrics panel shows that the infrastructure is there, but the demo only shows successful requests.

---

## Recommendation for CAIS 2026 Keynote

### **What to show in the demo:**
- ✅ Intent classification and component orchestration
- ✅ Cross-channel continuity (session ID, completed steps)
- ✅ Cache performance (145ms → 12ms)
- ✅ Confidence breakdown (Intent, Entity, Plan %)
- ✅ Metrics panel with Policy Checks count

### **What to mention (don't demo):**
During the Q&A or closing:
> "In production, every request passes through policy checks and guardrails before reaching the component renderer. These include SQL injection prevention, PII detection, rate limiting, compliance checks, and content filtering. The metrics panel shows this infrastructure exists—today's demo shows successful requests, but in the real system, guardrails would actively block abuse and escalate violations to our security team."

### **Why this approach:**
- ✅ Keeps the demo clean and focused on orchestration value
- ✅ Mentions governance without distracting from main story
- ✅ Demonstrates production-readiness through narrative, not noise
- ✅ Audience understands: GenUI is enterprise-grade infrastructure

---

## Related Docs

- `METRICS_EXAMPLES.md` — How metrics change with different queries (12 examples)
- `METRICS_DECISIONS.md` — Design decisions for the metrics panel
- `PLAN.md` — Original enhancement planning doc
