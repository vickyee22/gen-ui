/**
 * Intent Classifier - Uses Gemini AI to classify user intent
 * and select the right UI components from a skill registry
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

// Domain-scoped registries
const DOMAIN_COMPONENTS = {
    novatek: ['ComparisonTable', 'BundleBuilder', 'BillShockChart', 'TroubleshootingWidget', 'DynamicForm'],
    futurecommerce: ['ProductRecommendations', 'OrderTracker', 'DynamicForm']
};

const DOMAIN_FORM_TYPES = {
    novatek: ['bill_waiver', 'technical_support', 'feedback', 'contact_us', 'port_request'],
    futurecommerce: ['return_request', 'contact_us', 'feedback']
};

const DOMAIN_CONTEXT = {
    novatek: 'You are a UI orchestrator for FutureTel, a telecommunications company.',
    futurecommerce: 'You are a UI orchestrator for FutureCommerce, an electronics and audio products ecommerce store.'
};

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
        description: 'AI-powered dynamic eForm that renders the right fields and pre-fills them from user context. Use for: bill disputes/waivers, technical support requests, feedback, contact us, number port requests, product return requests.',
        handles: [
            'waive my bill', 'dispute charge', 'overcharged', 'wrong charge',
            'submit a complaint', 'raise a complaint', 'I have a complaint',
            'technical issue', 'report a problem', 'raise a ticket',
            'give feedback', 'leave a review', 'rate my experience',
            'contact support', 'speak to someone', 'reach customer service',
            'port my number', 'transfer my number', 'switch to FutureTel',
            'return my order', 'return item', 'refund', 'return this product'
        ],
        formTypes: {
            bill_waiver: 'overcharged, wrong charge, dispute bill, waive fee',
            technical_support: 'technical issue, service not working, report problem',
            feedback: 'feedback, suggestion, review, rate experience',
            contact_us: 'contact, speak to agent, reach support',
            port_request: 'port number, transfer number, switch provider',
            return_request: 'return order, return item, refund product, send back'
        }
    },
    {
        name: 'ProductRecommendations',
        description: 'Ecommerce product discovery grid. Shows products filtered by AI-extracted budget, category, and feature keywords. Use for: browsing products, finding items by budget, searching by type (headphones, earbuds, speakers).',
        handles: [
            'show me products', 'find me headphones', 'looking for earbuds',
            'recommend a speaker', 'best headphones under', 'wireless headphones',
            'noise cancelling', 'bluetooth earphones', 'budget earbuds',
            'shop for', 'buy headphones', 'what speakers do you have'
        ]
    },
    {
        name: 'OrderTracker',
        description: 'Order status timeline. Shows step-by-step order progress. Use when user asks about a specific order, delivery status, or tracking. Extract orderId from query if present.',
        handles: [
            'track my order', 'where is my order', 'order status',
            'has my order shipped', 'when will my order arrive',
            'delivery status', 'wheres my package', 'check my order'
        ]
    }
];

const SYSTEM_PROMPT = `You are a UI orchestrator for a multi-domain platform covering telecommunications (FutureTel) and ecommerce (electronics/audio products).

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
2. Return item / refund / send back product: DynamicForm, formType: "return_request", prefilled: { orderId: "<extracted if present>", productName: "<extracted if present>" }
3. Track order / order status / where is my order / delivery: OrderTracker, parameters: { orderId: "<extracted order ID if present, e.g. ORD-789>" }
4. Product search / browse / recommend (headphones, earbuds, speakers, electronics): ProductRecommendations
   - Extract: { category: "headphones|earbuds|speakers|all", budget: "<number if mentioned>", keywords: ["wireless","noise cancelling", etc.] }
   - Example: "show me wireless headphones under $100" → ProductRecommendations, { category: "headphones", budget: "100", keywords: ["wireless"] }
5. Bill disputes, overcharges, waiver requests, wrong/unexpected charges: DynamicForm, formType: "bill_waiver" — NEVER BillShockChart for these
6. Contact agent / talk to someone / complaint: DynamicForm, formType: "contact_us", prefilled: { subject: "<extracted topic>" }
7. Technical support request / raise ticket: DynamicForm, formType: "technical_support"
8. Feedback / review / rate experience: DynamicForm, formType: "feedback"
9. Port / transfer number / switch provider: DynamicForm, formType: "port_request"
10. DynamicForm parameters: { formType, prefilled: {fieldId: value}, aiContext: "original query snippet" }
    - prefilled: extract values from query (amount, reason, issueType, period, subject, orderId, productName)
    - Example: "I was overcharged $45 for roaming last month" → formType: "bill_waiver", prefilled: { issueType: "roaming", amount: "45", period: "jan-2026" }
    - Example: "return my Sony headphones from order ORD-789" → formType: "return_request", prefilled: { orderId: "ORD-789", productName: "Sony headphones" }
11. Bill explanation / why is my bill high (NOT a dispute): BillShockChart
12. Connectivity / speed issues: TroubleshootingWidget
13. Device / phone selection: ComparisonTable, parameters: { planTypes: ["Device"] }
14. Plan comparison: ComparisonTable, parameters: { planTypes: ["5G"] } or ["Roaming"] or ["5G","Roaming"]
15. Bundle queries: BundleBuilder ONLY
16. Compare plans AND build bundle in same query: ComparisonTable + BundleBuilder
17. Anything unrecognised: components=[], helpful fallback message
- confidence: 0.0–1.0 based on how clearly the query maps to a component
- parameters: extract all relevant info from the query`;

// Build a domain-scoped system prompt
function buildPrompt(domain) {
    const allowedComponents = domain ? DOMAIN_COMPONENTS[domain] : null;
    const scopedRegistry = allowedComponents
        ? COMPONENT_REGISTRY.filter(c => allowedComponents.includes(c.name))
        : COMPONENT_REGISTRY;

    const contextLine = domain
        ? DOMAIN_CONTEXT[domain]
        : 'You are a UI orchestrator for a multi-domain platform covering telecommunications (FutureTel) and ecommerce (electronics/audio products).';

    return `${contextLine}

Given a user query, decide which UI components to render from the registry below.
Select 0, 1, or 2 components — only select multiple when the query clearly needs both.

Component registry:
${JSON.stringify(scopedRegistry, null, 2)}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "intent": "snake_case_intent_name",
  "components": ["ComponentName"],
  "confidence": 0.92,
  "message": "optional text if components is empty",
  "parameters": {}
}

${domain === 'futurecommerce' ? `Rules (apply the FIRST matching rule):
1. Greetings: components=[], friendly welcome message
2. Return item / refund / send back product: DynamicForm, formType: "return_request", prefilled: { orderId: "<extracted if present>", productName: "<extracted if present>" }
3. Track order / where is my order / delivery: OrderTracker, parameters: { orderId: "<extracted order ID if present>" }
4. Product search / browse / recommend (headphones, earbuds, speakers): ProductRecommendations
   - Extract: { category: "headphones|earbuds|speakers|all", budget: "<number if mentioned>", keywords: ["wireless","noise cancelling", etc.] }
5. Contact / complaint: DynamicForm, formType: "contact_us"
6. Feedback / review: DynamicForm, formType: "feedback"
7. Anything unrecognised: components=[], helpful fallback message
- confidence: 0.0–1.0 based on how clearly the query maps to a component
- parameters: extract all relevant info from the query`

: domain === 'novatek' ? `Rules (apply the FIRST matching rule):
1. Greetings: components=[], friendly welcome message
2. MULTI-INTENT — Bill explanation + raise waiver/dispute in same query (e.g. "why is my bill high and I want to raise a waiver", "explain my bill and dispute the roaming charge"): components: ["BillShockChart", "DynamicForm"], parameters: { billPeriod: "current", formType: "bill_waiver", prefilled: { issueType: "<roaming|overage|addon|other>", amount: "<extracted amount>" }, aiContext: "<query>" }
3. MULTI-INTENT — Bill charge + compare better plans in same query (e.g. "why am I charged for roaming and show me plans that include it", "my bill is high from roaming — show me a plan with roaming included"): components: ["BillShockChart", "ComparisonTable"], parameters: { billPeriod: "current", planTypes: ["Roaming"] }
4. Bill disputes/overcharges/waiver only (no bill explanation needed): DynamicForm, formType: "bill_waiver" — NEVER BillShockChart for these alone
5. Contact agent / talk to someone: DynamicForm, formType: "contact_us"
6. Technical support / raise ticket: DynamicForm, formType: "technical_support"
7. Feedback / review: DynamicForm, formType: "feedback"
8. Port / transfer number: DynamicForm, formType: "port_request"
9. DynamicForm parameters: { formType, prefilled: {fieldId: value}, aiContext }
   - Example: "overcharged $45 for roaming" → formType: "bill_waiver", prefilled: { issueType: "roaming", amount: "45" }
10. Bill explanation only / why is my bill high (no dispute intent): BillShockChart, parameters: { billPeriod: "current" }
11. Connectivity / speed issues: TroubleshootingWidget
12. Device / phone selection: ComparisonTable, parameters: { planTypes: ["Device"] }
13. MULTI-INTENT — Compare plans AND build bundle in same query: components: ["ComparisonTable", "BundleBuilder"], parameters: { planTypes: ["5G"], includeServices: ["Fiber", "Mobile"] }
14. Plan comparison only: ComparisonTable, parameters: { planTypes: ["5G"] } or ["Roaming"] or ["5G","Roaming"]
15. Bundle queries only: BundleBuilder, parameters: { includeServices: ["Fiber", "Mobile"] }
16. Anything else: components=[], helpful fallback message
- confidence: 0.0–1.0; parameters: extract relevant info from the query`

: SYSTEM_PROMPT.split('\n').slice(16).join('\n')}`;
}

// Keyword fallback (used if Gemini is unavailable)
// ORDER MATTERS: more specific / eForm patterns must come before broad plan/bill patterns
// so that queries like "overcharged for roaming" match bill_waiver_form, not compare_plans
const FALLBACK_PATTERNS = [
    {
        intent: 'greeting',
        keywords: ['hello', 'hi', 'hey', 'howdy', 'good morning', 'good afternoon', 'good evening'],
        components: [],
        message: "Hi there! I can help you browse products, track orders, compare plans, build bundles, explain your bill, or troubleshoot issues. What would you like help with?"
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
    // Ecommerce patterns
    {
        intent: 'return_request_form',
        keywords: ['return', 'refund', 'send back', 'return my order', 'return item', 'exchange'],
        components: ['DynamicForm'],
        parameters: { formType: 'return_request', prefilled: {} }
    },
    {
        intent: 'track_order',
        keywords: ['track', 'order status', 'where is my order', 'delivery status', 'my order', 'has it shipped', 'when will it arrive'],
        components: ['OrderTracker'],
        parameters: { orderId: null }
    },
    {
        intent: 'browse_products',
        keywords: ['headphones', 'earbuds', 'speakers', 'earphones', 'wireless', 'bluetooth', 'noise cancelling', 'show me products', 'recommend products', 'buy headphones', 'find me'],
        components: ['ProductRecommendations'],
        parameters: { category: 'all', budget: null, keywords: [] }
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

function keywordFallback(query, domain = null) {
    const lower = query.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;

    const allowedComponents = domain ? DOMAIN_COMPONENTS[domain] : null;

    // Multi-intent detection — order matters: most specific first

    const billKeywords = ['bill', 'billing', 'charged', 'charge', 'why is my bill', 'bill so high', 'bill is high'];
    const waiverKeywords = ['waiver', 'waive', 'dispute', 'raise waiver', 'raise a waiver', 'contest', 'raise a dispute'];
    const hasBill = billKeywords.some(k => lower.includes(k));
    const hasWaiver = waiverKeywords.some(k => lower.includes(k));
    const canShowBillWaiver = !allowedComponents || (allowedComponents.includes('BillShockChart') && allowedComponents.includes('DynamicForm'));

    // Bill explain + waiver → BillShockChart + DynamicForm
    if (hasBill && hasWaiver && canShowBillWaiver) {
        return {
            intent: 'bill_explain_and_waiver',
            components: ['BillShockChart', 'DynamicForm'],
            confidence: 0.92,
            message: null,
            parameters: { billPeriod: 'current', formType: 'bill_waiver', prefilled: {}, aiContext: query },
            processingTime: 0,
            description: 'bill_explain_and_waiver',
            originalQuery: query
        };
    }

    const comparePlanKeywords = ['compare', 'plan', 'show me plan', 'better plan', 'plans that include', 'plan with roaming', 'cheaper plan', 'switch plan'];
    const hasComparePlan = comparePlanKeywords.some(k => lower.includes(k));
    const canShowBillCompare = !allowedComponents || (allowedComponents.includes('BillShockChart') && allowedComponents.includes('ComparisonTable'));

    // Bill charge + compare plans → BillShockChart + ComparisonTable
    if (hasBill && hasComparePlan && canShowBillCompare) {
        const planType = lower.includes('roaming') ? ['Roaming'] : lower.includes('5g') ? ['5G'] : ['5G', 'Roaming'];
        return {
            intent: 'bill_explain_and_compare',
            components: ['BillShockChart', 'ComparisonTable'],
            confidence: 0.90,
            message: null,
            parameters: { billPeriod: 'current', planTypes: planType },
            processingTime: 0,
            description: 'bill_explain_and_compare',
            originalQuery: query
        };
    }

    // Plans + bundle in same query
    const planKeywords = ['compare', 'plan', 'mobile plan', '5g', 'roaming', 'show me plans'];
    const bundleKeywords = ['bundle', 'fiber', 'broadband', 'home internet', 'package'];
    const hasPlan = planKeywords.some(k => lower.includes(k));
    const hasBundle = bundleKeywords.some(k => lower.includes(k));
    const canShowBoth = !allowedComponents || (allowedComponents.includes('ComparisonTable') && allowedComponents.includes('BundleBuilder'));

    if (hasPlan && hasBundle && canShowBoth) {
        return {
            intent: 'compare_and_bundle',
            components: ['ComparisonTable', 'BundleBuilder'],
            confidence: 0.88,
            message: null,
            parameters: { planTypes: ['5G'], includeServices: ['Fiber', 'Mobile'] },
            processingTime: 0,
            description: 'compare_and_bundle',
            originalQuery: query
        };
    }

    const patterns = allowedComponents
        ? FALLBACK_PATTERNS.filter(p =>
            !p.components?.length || p.components.every(c => allowedComponents.includes(c))
        )
        : FALLBACK_PATTERNS;

    for (const pattern of patterns) {
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
            message: "I'm not sure I understood that. Try asking me to browse products, track an order, compare plans, build a bundle, explain your bill, or help with a connectivity issue.",
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

export async function classifyIntent(query, domain = null) {
    const startTime = performance.now();

    // Build domain-scoped prompt if domain is set
    const prompt = buildPrompt(domain);

    if (!OPENAI_API_KEY) {
        console.warn('[IntentClassifier] No OpenAI API key — using keyword fallback');
        const result = keywordFallback(query, domain);
        result.processingTime = Math.round(performance.now() - startTime);
        return result;
    }

    try {
        const response = await fetch(OPENAI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: prompt },
                    { role: 'user', content: query }
                ],
                temperature: 0.1,
                max_tokens: 300,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);

        const data = await response.json();
        const raw = data.choices?.[0]?.message?.content;
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
        console.error('[IntentClassifier] OpenAI failed, using keyword fallback:', err.message);
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
