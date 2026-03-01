/**
 * Intent Classifier - Uses Gemini AI to classify user intent
 * and select the right UI components from a skill registry
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${GEMINI_API_KEY}`;

// Component registry — each component advertises what it can handle
const COMPONENT_REGISTRY = [
    {
        name: 'ComparisonTable',
        description: 'Side-by-side comparison of mobile plans OR devices/phones. Pass parameters.planTypes=["Device"] for device queries, or planTypes=["5G","Roaming"] for plan queries.',
        handles: [
            'looking for a plan', 'need a phone plan', 'compare plans',
            'which plan is best', 'show me plans', 'cheapest plan',
            '5G plan', 'roaming plan', 'data plan', 'plan options',
            'what plans do you have', 'recommend a plan',
            'select a device', 'choose a phone', 'compare phones',
            'which phone', 'best smartphone', 'new phone', 'buy a device',
            'iPhone vs Samsung', 'compare devices'
        ]
    },
    {
        name: 'BundleBuilder',
        description: 'Build and price a bundle of Fiber internet, Mobile, and TV services',
        handles: [
            'bundle services', 'combine fiber and mobile', 'home internet deal',
            'broadband and mobile package', 'TV and internet bundle',
            'package deal', 'save by bundling'
        ]
    },
    {
        name: 'BillShockChart',
        description: 'Visualise and explain a bill breakdown, identify unexpected or high charges',
        handles: [
            'high bill', 'why is my bill high', 'unexpected charge',
            'bill explanation', 'bill breakdown', 'cost breakdown',
            'what am I being charged for', 'bill shock'
        ]
    },
    {
        name: 'TroubleshootingWidget',
        description: 'Step-by-step guide to diagnose and fix connectivity issues',
        handles: [
            'slow internet', 'internet not working', 'WiFi problem',
            'cannot connect', 'network down', 'connection dropping',
            'speed issue', 'no signal'
        ]
    },
    {
        name: 'DynamicForm',
        description: 'AI-powered dynamic eForm that renders the right fields and pre-fills them from user context. Use for: bill disputes/waivers, technical support requests, feedback, contact us, number port requests.',
        handles: [
            'waive my bill', 'dispute charge', 'overcharged', 'wrong charge',
            'submit a complaint', 'raise a complaint', 'I have a complaint',
            'technical issue', 'report a problem', 'raise a ticket',
            'give feedback', 'leave a review', 'rate my experience',
            'contact support', 'speak to someone', 'reach customer service',
            'port my number', 'transfer my number', 'switch to NovaTel'
        ],
        formTypes: {
            bill_waiver: 'overcharged, wrong charge, dispute bill, waive fee',
            technical_support: 'technical issue, service not working, report problem',
            feedback: 'feedback, suggestion, review, rate experience',
            contact_us: 'contact, speak to agent, reach support',
            port_request: 'port number, transfer number, switch provider'
        }
    }
];

const SYSTEM_PROMPT = `You are a UI orchestrator for NovaTel, a telecommunications company.

Given a user query, decide which UI components to render from the registry below.
Select 0, 1, or 2 components — only select multiple when the query clearly needs both.

Component registry:
${JSON.stringify(COMPONENT_REGISTRY, null, 2)}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "intent": "snake_case_intent_name",
  "components": ["ComponentName"],
  "confidence": 0.92,
  "message": "optional text if components is empty",
  "parameters": {}
}

Rules (apply the FIRST matching rule):
1. Greetings (hello, hi, hey, good morning): components=[], friendly welcome message
2. Bill disputes, overcharges, waiver requests, wrong/unexpected charges: DynamicForm, formType: "bill_waiver" — NEVER BillShockChart for these
3. Contact agent / talk to someone / delivery issue / complaint about order or service: DynamicForm, formType: "contact_us", prefilled: { subject: "<extracted topic>" }
4. Technical support request / raise ticket / report a problem: DynamicForm, formType: "technical_support"
5. Feedback / review / rate experience: DynamicForm, formType: "feedback"
6. Port / transfer number / switch provider: DynamicForm, formType: "port_request"
7. eForm parameters for DynamicForm: { formType, prefilled: {fieldId: value}, aiContext: "original query snippet" }
   - prefilled: extract values from the query (e.g. amount, reason, issueType, period, subject, service)
   - Example: "I was overcharged $45 for roaming last month" → formType: "bill_waiver", prefilled: { issueType: "roaming", amount: "45", period: "jan-2026", reason: "Overcharged for roaming" }
   - Example: "talk to agent about device delivery" → formType: "contact_us", prefilled: { subject: "Device delivery enquiry" }
8. Bill explanation / why is my bill high / bill breakdown (NOT a dispute): BillShockChart
9. Connectivity / speed issues: TroubleshootingWidget
10. Device / phone selection queries (select a device, choose a phone, compare phones): ComparisonTable, parameters: { planTypes: ["Device"] }
11. Plan discovery or comparison: ComparisonTable, parameters: { planTypes: ["5G"] } or ["Roaming"] or ["5G","Roaming"]
12. Bundle-only queries (build a bundle, home internet + mobile package): BundleBuilder ONLY — do NOT add ComparisonTable unless user explicitly also asks to compare plans
13. User explicitly asks to compare plans AND build a bundle in the same query: ComparisonTable + BundleBuilder
14. Anything else unrelated to telco: components=[], helpful fallback message
- confidence: 0.0–1.0 based on how clearly the query maps to a component
- parameters: extract relevant info e.g. { "planTypes": ["5G"], "issueType": "speed" }`;

// Keyword fallback (used if Gemini is unavailable)
// ORDER MATTERS: more specific / eForm patterns must come before broad plan/bill patterns
// so that queries like "overcharged for roaming" match bill_waiver_form, not compare_plans
const FALLBACK_PATTERNS = [
    {
        intent: 'greeting',
        keywords: ['hello', 'hi', 'hey', 'howdy', 'good morning', 'good afternoon', 'good evening'],
        components: [],
        message: "Hi there! I can help you compare plans, build bundles, explain your bill, or troubleshoot connectivity issues. What would you like help with?"
    },
    // eForms first — specific user actions that should not be confused with generic plan/bill queries
    {
        intent: 'bill_waiver_form',
        keywords: ['overcharged', 'dispute', 'waive', 'wrong charge', 'incorrect charge', 'refund', 'billed incorrectly'],
        components: ['DynamicForm'],
        parameters: { formType: 'bill_waiver', prefilled: {} }
    },
    {
        intent: 'port_request_form',
        keywords: ['port my number', 'transfer my number', 'switch provider', 'move my number', 'port to'],
        components: ['DynamicForm'],
        parameters: { formType: 'port_request', prefilled: {} }
    },
    {
        intent: 'technical_support_form',
        keywords: ['raise a ticket', 'raise ticket', 'report a problem', 'technical issue', 'service down', 'lodge complaint'],
        components: ['DynamicForm'],
        parameters: { formType: 'technical_support', prefilled: {} }
    },
    {
        intent: 'feedback_form',
        keywords: ['feedback', 'suggestion', 'leave a review', 'rate my experience', 'rate your service'],
        components: ['DynamicForm'],
        parameters: { formType: 'feedback', prefilled: {} }
    },
    {
        intent: 'contact_form',
        keywords: ['talk to agent', 'speak to agent', 'contact support', 'reach customer service', 'speak to someone', 'talk to someone', 'agent', 'delivery'],
        components: ['DynamicForm'],
        parameters: { formType: 'contact_us', prefilled: {} }
    },
    // Generic component patterns
    {
        intent: 'select_device',
        keywords: ['device', 'phone', 'smartphone', 'iphone', 'samsung', 'pixel', 'handset', 'select a device', 'choose a phone', 'buy a phone'],
        components: ['ComparisonTable'],
        parameters: { planTypes: ['Device'] }
    },
    {
        intent: 'compare_plans',
        keywords: ['compare', 'plan', 'mobile plan', '5g', 'roaming', 'data plan', 'cheapest plan', 'best plan', 'looking for a plan', 'need a plan', 'show me plans', 'recommend'],
        components: ['ComparisonTable']
    },
    {
        intent: 'build_bundle',
        keywords: ['bundle', 'fiber', 'tv', 'broadband', 'home internet', 'package deal'],
        components: ['BundleBuilder']
    },
    {
        intent: 'explain_bill',
        keywords: ['bill', 'expensive', 'high bill', 'breakdown', 'shock', 'why is my bill'],
        components: ['BillShockChart']
    },
    {
        intent: 'troubleshoot',
        keywords: ['slow', 'not working', 'fix', 'wifi', 'signal', 'no internet', 'connection dropping'],
        components: ['TroubleshootingWidget']
    }
];

function keywordFallback(query) {
    const lower = query.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;

    for (const pattern of FALLBACK_PATTERNS) {
        let score = pattern.keywords.filter(k => lower.includes(k)).length;
        if (score > highestScore) {
            highestScore = score;
            bestMatch = pattern;
        }
    }

    if (!bestMatch || highestScore === 0) {
        return {
            intent: 'fallback',
            components: [],
            confidence: 0.6,
            message: "I'm not sure I understood that. Try asking me to compare plans, build a bundle, explain your bill, or help with a connectivity issue.",
            parameters: {},
            processingTime: 0,
            description: 'Unknown query',
            originalQuery: query
        };
    }

    let parameters = { ...(bestMatch.parameters || {}) };

    // For DynamicForm results, enrich parameters with context from the original query
    if (bestMatch.components?.includes('DynamicForm')) {
        parameters.aiContext = query;
        // Prefill subject for contact_us so the form field isn't blank
        if (parameters.formType === 'contact_us' && !parameters.prefilled?.subject) {
            parameters.prefilled = { ...parameters.prefilled, subject: query };
        }
    }

    return {
        intent: bestMatch.intent,
        components: bestMatch.components,
        confidence: Math.min(0.95, 0.6 + highestScore * 0.1),
        message: bestMatch.message || null,
        parameters,
        processingTime: 0,
        description: bestMatch.intent,
        originalQuery: query
    };
}

export async function classifyIntent(query) {
    const startTime = performance.now();

    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
        console.warn('[IntentClassifier] No Gemini API key — using keyword fallback');
        const result = keywordFallback(query);
        result.processingTime = Math.round(performance.now() - startTime);
        return result;
    }

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
                contents: [{ parts: [{ text: query }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.1,
                    maxOutputTokens: 300
                }
            })
        });

        if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

        const data = await response.json();
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = JSON.parse(raw);

        return {
            intent: parsed.intent || 'unknown',
            components: parsed.components || [],
            confidence: parsed.confidence ?? 0.8,
            message: parsed.message || null,
            parameters: parsed.parameters || {},
            processingTime: Math.round(performance.now() - startTime),
            description: parsed.intent || 'unknown',
            originalQuery: query
        };

    } catch (err) {
        console.error('[IntentClassifier] Gemini failed, using keyword fallback:', err.message);
        const result = keywordFallback(query);
        result.processingTime = Math.round(performance.now() - startTime);
        return result;
    }
}

// Get all supported components (for demo purposes)
export function getSupportedIntents() {
    return COMPONENT_REGISTRY.map(c => ({
        intent: c.name,
        components: [c.name],
        description: c.description
    }));
}
