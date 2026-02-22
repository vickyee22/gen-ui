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
        description: 'Side-by-side comparison of mobile and data plans',
        handles: [
            'looking for a plan', 'need a phone plan', 'compare plans',
            'which plan is best', 'show me plans', 'cheapest plan',
            '5G plan', 'roaming plan', 'data plan', 'plan options',
            'what plans do you have', 'recommend a plan'
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

Rules:
- Greetings (hello, hi, hey, good morning): components=[], friendly welcome message
- Plan discovery or comparison queries: ComparisonTable
- Bundle / package queries: BundleBuilder
- Bill or charge queries: BillShockChart
- Connectivity / speed issues: TroubleshootingWidget
- Queries needing plans AND bundles: both ComparisonTable and BundleBuilder
- Anything else unrelated to telco: components=[], helpful fallback message
- confidence: 0.0–1.0 based on how clearly the query maps to a component
- parameters: extract relevant info e.g. { "planType": "5G", "issueType": "speed" }`;

// Keyword fallback (used if Gemini is unavailable)
const FALLBACK_PATTERNS = [
    {
        intent: 'greeting',
        keywords: ['hello', 'hi', 'hey', 'howdy', 'good morning', 'good afternoon', 'good evening'],
        components: [],
        message: "Hi there! I can help you compare plans, build bundles, explain your bill, or troubleshoot connectivity issues. What would you like help with?"
    },
    {
        intent: 'compare_plans',
        keywords: ['compare', 'plan', 'phone', 'mobile', '5g', 'roaming', 'data', 'cheapest', 'best', 'looking for', 'need a', 'show me', 'recommend'],
        components: ['ComparisonTable']
    },
    {
        intent: 'compare_and_bundle',
        keywords: ['bundle', 'combine', 'package', 'fiber and mobile', 'broadband and mobile'],
        components: ['ComparisonTable', 'BundleBuilder']
    },
    {
        intent: 'build_bundle',
        keywords: ['bundle', 'fiber', 'tv', 'broadband', 'home internet'],
        components: ['BundleBuilder']
    },
    {
        intent: 'explain_bill',
        keywords: ['bill', 'charge', 'expensive', 'high', 'breakdown', 'shock', 'cost'],
        components: ['BillShockChart']
    },
    {
        intent: 'troubleshoot',
        keywords: ['slow', 'problem', 'issue', 'not working', 'help', 'fix', 'internet', 'connection', 'wifi', 'signal'],
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

    return {
        intent: bestMatch.intent,
        components: bestMatch.components,
        confidence: Math.min(0.95, 0.6 + highestScore * 0.1),
        message: bestMatch.message || null,
        parameters: {},
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
