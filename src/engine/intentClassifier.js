/**
 * Intent Classifier - Simulates LLM intent classification
 * Maps natural language queries to structured intents
 */

// Intent patterns for classification
const intentPatterns = [
    {
        intent: 'compare_and_bundle',
        keywords: ['bundle', 'combine', 'deal', 'package', 'compare', 'difference', 'together'],
        components: ['ComparisonTable', 'BundleBuilder'],
        description: 'Compare plans and build a bundle'
    },
    {
        intent: 'compare_plans',
        keywords: ['compare', 'vs', 'versus', 'difference', 'which plan', 'best plan', '5g', 'roaming', 'data plans'],
        components: ['ComparisonTable'],
        description: 'Compare mobile/data plans'
    },
    {
        intent: 'build_bundle',
        keywords: ['bundle', 'package', 'fiber', 'mobile', 'tv', 'combine', 'build', 'together', 'deal'],
        components: ['BundleBuilder'],
        description: 'Build custom bundle packages'
    },
    {
        intent: 'explain_bill',
        keywords: ['bill', 'charge', 'expensive', 'high', 'why', 'breakdown', 'shock', 'cost', 'payment'],
        components: ['BillShockChart'],
        description: 'Explain billing breakdown'
    },
    {
        intent: 'troubleshoot',
        keywords: ['slow', 'problem', 'issue', 'not working', 'help', 'fix', 'internet', 'connection', 'error'],
        components: ['TroubleshootingWidget'],
        description: 'Troubleshoot connectivity issues'
    }
];

// Extract parameters from query
function extractParameters(query, intent) {
    const params = {};
    const lowerQuery = query.toLowerCase();

    switch (intent) {
        case 'compare_and_bundle':
            params.planTypes = ['5G', 'Roaming'];
            params.includeServices = ['Fiber', 'Mobile'];
            break;

        case 'compare_plans':
            params.planTypes = [];
            if (lowerQuery.includes('5g')) params.planTypes.push('5G');
            if (lowerQuery.includes('roaming')) params.planTypes.push('Roaming');
            if (lowerQuery.includes('data')) params.planTypes.push('Data');
            if (lowerQuery.includes('unlimited')) params.planTypes.push('Unlimited');
            if (params.planTypes.length === 0) params.planTypes = ['5G', 'Roaming'];
            break;

        case 'build_bundle':
            params.includeServices = [];
            if (lowerQuery.includes('fiber') || lowerQuery.includes('broadband')) params.includeServices.push('Fiber');
            if (lowerQuery.includes('mobile')) params.includeServices.push('Mobile');
            if (lowerQuery.includes('tv')) params.includeServices.push('TV');
            if (params.includeServices.length === 0) params.includeServices = ['Fiber', 'Mobile'];
            break;

        case 'explain_bill':
            params.billPeriod = 'current';
            if (lowerQuery.includes('last month')) params.billPeriod = 'previous';
            break;

        case 'troubleshoot':
            params.issueType = 'general';
            if (lowerQuery.includes('slow')) params.issueType = 'speed';
            if (lowerQuery.includes('connect')) params.issueType = 'connection';
            if (lowerQuery.includes('wifi')) params.issueType = 'wifi';
            break;
    }

    return params;
}

// Main classification function
export function classifyIntent(query) {
    const startTime = performance.now();
    const lowerQuery = query.toLowerCase();

    // Simulate processing delay (50-100ms for realism)
    const processingTime = 50 + Math.random() * 50;

    // Score each intent based on keyword matches
    let bestMatch = null;
    let highestScore = 0;

    for (const pattern of intentPatterns) {
        let score = 0;
        for (const keyword of pattern.keywords) {
            if (lowerQuery.includes(keyword)) {
                score += 1;
            }
        }

        if (score > highestScore) {
            highestScore = score;
            bestMatch = pattern;
        }
    }

    // Default to comparison if no match
    if (!bestMatch || highestScore === 0) {
        bestMatch = intentPatterns[0];
    }

    const result = {
        intent: bestMatch.intent,
        components: bestMatch.components,
        confidence: Math.min(0.95, 0.6 + (highestScore * 0.1)),
        parameters: extractParameters(query, bestMatch.intent),
        processingTime: Math.round(processingTime),
        description: bestMatch.description,
        originalQuery: query
    };

    // Return as a promise to simulate async LLM call
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(result);
        }, processingTime);
    });
}

// Get all supported intents (for demo purposes)
export function getSupportedIntents() {
    return intentPatterns.map(p => ({
        intent: p.intent,
        components: p.components,
        description: p.description
    }));
}
