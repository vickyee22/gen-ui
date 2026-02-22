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

    // Check cache first
    if (componentCache.has(cacheKey)) {
        const cached = componentCache.get(cacheKey);
        if (isValidCache(cached)) {
            return {
                ...cached.payload,
                fromCache: true,
                orchestrationTime: Math.round(performance.now() - startTime)
            };
        }
        // Clear expired cache
        componentCache.delete(cacheKey);
    }

    // Handle greeting and fallback — return a text message, no components
    const textOnlyMessages = {
        greeting: "Hi there! I can help you compare plans, build bundles, explain your bill, or troubleshoot connectivity issues. What would you like help with?",
        fallback: "I'm not sure I understood that. Try asking me to compare plans, build a bundle, explain your bill, or help with a connectivity issue."
    };
    if (textOnlyMessages[intentResult.intent]) {
        return {
            components: [],
            message: textOnlyMessages[intentResult.intent],
            intent: intentResult.intent,
            channel,
            metadata: {
                confidence: intentResult.confidence,
                description: intentResult.description,
                originalQuery: intentResult.originalQuery,
                parameters: intentResult.parameters
            },
            fromCache: false,
            orchestrationTime: Math.round(performance.now() - startTime)
        };
    }

    // Fetch data and config for all components
    const componentSpecs = await Promise.all(intentResult.components.map(async (compName) => {
        const data = await hydrateComponent(compName, intentResult.parameters);
        const config = getChannelConfig(compName, channel);
        return {
            name: compName,
            data,
            config
        };
    }));

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
