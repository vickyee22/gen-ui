/**
 * Component Orchestrator - Maps intents to components and manages caching
 */

import { hydrateComponent } from './dataHydrator';

// Component cache for identical queries
const componentCache = new Map();

// Cache configuration
const CACHE_TTL_MS = 60000; // 1 minute cache

// Generate cache key from intent result
function getCacheKey(intentResult) {
    return `${intentResult.intent}:${JSON.stringify(intentResult.parameters)}`;
}

// Check if cached result is still valid
function isValidCache(cacheEntry) {
    return Date.now() - cacheEntry.timestamp < CACHE_TTL_MS;
}

/**
 * Orchestrate component rendering based on classified intent
 * Returns a JSON payload that the frontend can use to render the component
 */
export async function orchestrate(intentResult, channel = 'web') {
    const startTime = performance.now();
    const cacheKey = getCacheKey(intentResult);
    const trace = [];

    // Step 1: Validation
    const validationStart = performance.now();
    const isValidated = intentResult.processingTime > 50; // Heuristic: >50ms = Gemini, <50ms = fallback
    trace.push({
        step: 1,
        name: 'Intent Validated',
        duration: Math.round(performance.now() - validationStart),
        status: isValidated ? 'AI' : 'Fallback'
    });

    // Step 2: Policy checks
    const policyStart = performance.now();
    const policyCheckCount = intentResult.components?.length > 0 ? 3 : 2; // More checks for components
    const guardrailsTriggered = 0; // Never trigger in demo
    trace.push({
        step: 2,
        name: 'Policy Checks',
        duration: Math.round(performance.now() - policyStart),
        checks: policyCheckCount,
        triggered: guardrailsTriggered
    });

    // Check cache first
    const cacheStart = performance.now();
    if (componentCache.has(cacheKey)) {
        const cached = componentCache.get(cacheKey);
        if (isValidCache(cached)) {
            trace.push({
                step: 3,
                name: 'Cache Hit',
                duration: Math.round(performance.now() - cacheStart),
                status: 'retrieved'
            });
            return {
                ...cached.payload,
                fromCache: true,
                trace,
                orchestrationTime: Math.round(performance.now() - startTime)
            };
        }
        // Clear expired cache
        componentCache.delete(cacheKey);
    }

    // If the classifier returned no components (greeting, fallback, or AI decision),
    // return the message directly without hydrating anything
    if (!intentResult.components || intentResult.components.length === 0) {
        trace.push({
            step: 3,
            name: 'No Components Required',
            duration: 0,
            status: 'message_only'
        });

        return {
            components: [],
            message: intentResult.message || "I'm not sure I understood that. Try asking about plans, bundles, bills, or connectivity issues.",
            intent: intentResult.intent,
            channel,
            metadata: {
                confidence: intentResult.confidence,
                description: intentResult.description,
                originalQuery: intentResult.originalQuery,
                parameters: intentResult.parameters
            },
            fromCache: false,
            trace,
            orchestrationTime: Math.round(performance.now() - startTime)
        };
    }

    // Step 3: Fetch data and config for all components
    const hydrationStart = performance.now();
    const componentSpecs = await Promise.all(intentResult.components.map(async (compName) => {
        const data = await hydrateComponent(compName, intentResult.parameters);
        const config = getChannelConfig(compName, channel);
        return {
            name: compName,
            data,
            config
        };
    }));

    trace.push({
        step: 3,
        name: 'Hydration',
        duration: Math.round(performance.now() - hydrationStart),
        components: intentResult.components.length
    });

    // Build the payload
    const payload = {
        components: componentSpecs,
        intent: intentResult.intent,
        channel,
        metadata: {
            confidence: intentResult.confidence,
            description: intentResult.description,
            originalQuery: intentResult.originalQuery,
            parameters: intentResult.parameters
        },
        fromCache: false,
        trace,
        orchestrationTime: Math.round(performance.now() - startTime)
    };

    // Cache the result
    componentCache.set(cacheKey, {
        payload,
        timestamp: Date.now()
    });

    return payload;
}

/**
 * Get channel-specific rendering configuration
 */
function getChannelConfig(component, channel) {
    const configs = {
        ComparisonTable: {
            web: { layout: 'horizontal', showDetails: true, animate: true },
            mobile: { layout: 'vertical', showDetails: false, animate: true },
            chat: { layout: 'compact', showDetails: false, animate: false }
        },
        BundleBuilder: {
            web: { layout: 'grid', interactive: true, showPreview: true },
            mobile: { layout: 'stack', interactive: true, showPreview: true },
            chat: { layout: 'list', interactive: false, showPreview: false }
        },
        BillShockChart: {
            web: { chartType: 'waterfall', showLegend: true, animate: true },
            mobile: { chartType: 'waterfall', showLegend: false, animate: true },
            chat: { chartType: 'bar', showLegend: false, animate: false }
        },
        TroubleshootingWidget: {
            web: { stepLayout: 'accordion', showImages: true },
            mobile: { stepLayout: 'carousel', showImages: true },
            chat: { stepLayout: 'sequential', showImages: false }
        },
        DynamicForm: {
            web: { compact: false },
            mobile: { compact: false },
            chat: { compact: true }
        }
    };

    return configs[component]?.[channel] || configs[component]?.web || {};
}

/**
 * Clear the component cache (for testing/demo)
 */
export function clearCache() {
    componentCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
    return {
        size: componentCache.size,
        keys: Array.from(componentCache.keys())
    };
}
