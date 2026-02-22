/**
 * Data Hydrator - Fetches mock data for GenUI components
 * Simulates real-time API calls to backend services
 */

// Mock data for mobile plans
const mobilePlans = {
    '5G': [
        {
            name: 'XO 75',
            data: '60GB',
            speed: '5G',
            price: 75.90,
            roaming: '12GB ASEAN',
            calls: 'Unlimited',
            features: ['5G Network', 'Data Rollover', 'Caller ID']
        },
        {
            name: 'XO 98',
            data: '100GB',
            speed: '5G Plus',
            price: 98.90,
            roaming: '20GB Worldwide',
            calls: 'Unlimited',
            features: ['5G Plus Network', 'Data Rollover', 'International Calls 100min']
        },
        {
            name: 'XO 128',
            data: 'Unlimited',
            speed: '5G Ultra',
            price: 128.90,
            roaming: '30GB Worldwide',
            calls: 'Unlimited',
            features: ['5G Ultra Speed', 'Hotspot Sharing', 'Priority Support']
        }
    ],
    'Roaming': [
        {
            name: 'Data X Regional',
            data: '15GB',
            speed: '4G',
            price: 29.90,
            coverage: 'ASEAN + HK + TW',
            validity: '30 days',
            features: ['Auto-Connect', 'Data Sharing']
        },
        {
            name: 'Data X Global',
            data: '25GB',
            speed: '4G/5G',
            price: 49.90,
            coverage: '80+ Countries',
            validity: '30 days',
            features: ['5G Where Available', 'Hotspot Enabled']
        }
    ]
};

// Mock data for devices
const deviceCatalog = {
    'Device': [
        {
            name: 'iPhone 16 Pro',
            data: '256GB',
            speed: '5G',
            price: 65.90,
            category: 'Flagship',
            features: ['A18 Pro Chip', '48MP ProCamera System', '6.3" Super Retina XDR', 'All-day battery', 'Titanium design']
        },
        {
            name: 'Samsung S25 Ultra',
            data: '512GB',
            speed: '5G',
            price: 72.90,
            category: 'Flagship',
            features: ['Snapdragon 8 Elite', '200MP AI Camera', '6.9" QHD+ Display', 'Built-in S Pen', '5000mAh battery']
        },
        {
            name: 'Google Pixel 9 Pro',
            data: '256GB',
            speed: '5G',
            price: 55.90,
            category: 'Flagship',
            features: ['Google Tensor G4', '50MP Triple Camera', '6.3" LTPO OLED', 'Google AI features', '7 years of updates']
        }
    ]
};

// Mock data for bundles
const bundleOptions = {
    Fiber: [
        { id: 'fiber-1gbps', name: '1Gbps Fibre', price: 49.90, speed: '1 Gbps', features: ['Unlimited Data', 'Free Router'] },
        { id: 'fiber-2gbps', name: '2Gbps Fibre', price: 69.90, speed: '2 Gbps', features: ['Unlimited Data', 'WiFi 6 Router', 'Priority Support'] },
        { id: 'fiber-10gbps', name: '10Gbps Fibre', price: 149.90, speed: '10 Gbps', features: ['Unlimited Data', 'WiFi 6E Router', '24/7 Support'] }
    ],
    Mobile: [
        { id: 'mobile-sim', name: 'SIM Only 20GB', price: 25.90, data: '20GB', features: ['5G Ready', 'Unlimited Calls'] },
        { id: 'mobile-xo', name: 'XO 75 Plan', price: 75.90, data: '60GB', features: ['5G Network', 'Data Rollover'] },
        { id: 'mobile-max', name: 'XO Unlimited', price: 128.90, data: 'Unlimited', features: ['5G Ultra', 'Hotspot'] }
    ],
    TV: [
        { id: 'tv-basic', name: 'CAST Basic', price: 14.90, channels: '50+', features: ['HD Streaming', 'On-Demand'] },
        { id: 'tv-plus', name: 'CAST Plus', price: 29.90, channels: '100+', features: ['4K Streaming', 'Sports Pack'] },
        { id: 'tv-premium', name: 'CAST Premium', price: 49.90, channels: '200+', features: ['4K HDR', 'All Packs', 'Multi-Room'] }
    ]
};

// Mock billing data
const billingData = {
    current: {
        period: 'January 2026',
        total: 287.45,
        breakdown: [
            { category: 'Base Plan', amount: 98.90, description: 'XO 98 Monthly Plan' },
            { category: 'Data Overage', amount: 45.00, description: '15GB excess @ $3/GB' },
            { category: 'Roaming', amount: 89.55, description: 'Japan trip - 3 days' },
            { category: 'Add-ons', amount: 14.90, description: 'CAST Basic TV' },
            { category: 'Taxes & Fees', amount: 39.10, description: 'GST 9%' }
        ],
        previousBill: 156.80,
        anomalies: ['Data Overage', 'Roaming']
    },
    previous: {
        period: 'December 2025',
        total: 156.80,
        breakdown: [
            { category: 'Base Plan', amount: 98.90, description: 'XO 98 Monthly Plan' },
            { category: 'Add-ons', amount: 14.90, description: 'CAST Basic TV' },
            { category: 'Discounts', amount: -15.00, description: 'Loyalty Discount' },
            { category: 'Taxes & Fees', amount: 58.00, description: 'GST 9%' }
        ],
        anomalies: []
    }
};

// Mock troubleshooting data
const troubleshootingSteps = {
    speed: {
        title: 'Internet Speed Issues',
        symptom: 'Slow internet connection',
        steps: [
            {
                id: 1,
                title: 'Check Router Placement',
                description: 'Ensure your router is in an open area, away from walls and electronic devices.',
                action: 'Move router if needed'
            },
            {
                id: 2,
                title: 'Restart Your Router',
                description: 'Unplug your router for 30 seconds, then plug it back in.',
                action: 'Wait 2 minutes for reconnection'
            },
            {
                id: 3,
                title: 'Run Speed Test',
                description: 'Visit speedtest.novattel.com to check your current speed.',
                action: 'Compare with your plan speed'
            },
            {
                id: 4,
                title: 'Contact Support',
                description: 'If issues persist, our technician can help.',
                action: 'Schedule a callback'
            }
        ]
    },
    connection: {
        title: 'Connection Problems',
        symptom: 'Cannot connect to internet',
        steps: [
            {
                id: 1,
                title: 'Check Physical Connections',
                description: 'Verify all cables are securely connected to your router and ONT.',
                action: 'Check cable connections'
            },
            {
                id: 2,
                title: 'Check Router Lights',
                description: 'Your router should show solid green lights for Power and Internet.',
                action: 'Look for red/orange lights'
            },
            {
                id: 3,
                title: 'Restart Equipment',
                description: 'Turn off router and ONT, wait 30 seconds, turn ONT on first, then router.',
                action: 'Wait 2 minutes'
            },
            {
                id: 4,
                title: 'Report Outage',
                description: 'There may be a service disruption in your area.',
                action: 'Check service status'
            }
        ]
    },
    wifi: {
        title: 'WiFi Issues',
        symptom: 'WiFi not connecting',
        steps: [
            {
                id: 1,
                title: 'Forget and Reconnect',
                description: 'On your device, forget the WiFi network and reconnect with password.',
                action: 'Re-enter WiFi password'
            },
            {
                id: 2,
                title: 'Check Connected Devices',
                description: 'Too many devices can slow your WiFi. Check device count.',
                action: 'Disconnect unused devices'
            },
            {
                id: 3,
                title: 'Change WiFi Channel',
                description: 'Log into router settings and try a different WiFi channel.',
                action: 'Use auto-channel selection'
            },
            {
                id: 4,
                title: 'Consider Mesh WiFi',
                description: 'Large homes may need WiFi extenders or mesh system.',
                action: 'View WiFi solutions'
            }
        ]
    },
    general: {
        title: 'General Support',
        symptom: 'General connectivity issues',
        steps: [
            {
                id: 1,
                title: 'Describe Your Issue',
                description: 'What specific problem are you experiencing?',
                action: 'Provide details'
            },
            {
                id: 2,
                title: 'Check Service Status',
                description: 'View any ongoing service advisories in your area.',
                action: 'View status page'
            },
            {
                id: 3,
                title: 'Live Chat Support',
                description: 'Connect with our support team for personalized help.',
                action: 'Start live chat'
            }
        ]
    }
};

/**
 * Hydrate component with required data
 */
export async function hydrateComponent(component, parameters) {
    // Simulate API latency (30-80ms)
    const latency = 30 + Math.random() * 50;

    return new Promise((resolve) => {
        setTimeout(() => {
            let data;

            switch (component) {
                case 'ComparisonTable':
                    data = hydrateComparisonTable(parameters);
                    break;
                case 'BundleBuilder':
                    data = hydrateBundleBuilder(parameters);
                    break;
                case 'BillShockChart':
                    data = hydrateBillShockChart(parameters);
                    break;
                case 'TroubleshootingWidget':
                    data = hydrateTroubleshootingWidget(parameters);
                    break;
                default:
                    data = { error: 'Unknown component' };
            }

            resolve({
                ...data,
                hydratedAt: new Date().toISOString(),
                latency: Math.round(latency)
            });
        }, latency);
    });
}

function hydrateComparisonTable(params) {
    const { planTypes = ['5G', 'Roaming'] } = params;
    const isDeviceQuery = planTypes.includes('Device');
    const plans = [];

    for (const type of planTypes) {
        if (mobilePlans[type]) {
            plans.push(...mobilePlans[type].map(p => ({ ...p, category: type })));
        }
        if (deviceCatalog[type]) {
            plans.push(...deviceCatalog[type].map(p => ({ ...p, category: p.category })));
        }
    }

    return {
        title: isDeviceQuery ? 'Compare Devices' : `Compare ${planTypes.join(' & ')} Plans`,
        plans,
        highlighted: plans.length > 0 ? plans[Math.floor(plans.length / 2)].name : null,
        metricLabel: isDeviceQuery ? 'Storage' : 'Data',
        ctaLabel: isDeviceQuery ? 'Select Device' : 'Select Plan'
    };
}

function hydrateBundleBuilder(params) {
    const { includeServices = ['Fiber', 'Mobile'] } = params;
    const options = {};

    for (const service of includeServices) {
        if (bundleOptions[service]) {
            options[service] = bundleOptions[service];
        }
    }

    // Calculate bundle discount
    const discountPercent = includeServices.length >= 3 ? 20 : includeServices.length >= 2 ? 10 : 0;

    return {
        title: 'Build Your Perfect Bundle',
        services: includeServices,
        options,
        bundleDiscount: discountPercent,
        promotions: [
            { code: 'BUNDLE2026', discount: '$50 off first bill', expires: '31 Mar 2026' }
        ]
    };
}

function hydrateBillShockChart(params) {
    const { billPeriod = 'current' } = params;
    const data = billingData[billPeriod];

    return {
        title: `Bill Breakdown - ${data.period}`,
        ...data,
        comparison: billPeriod === 'current' ? {
            difference: data.total - (billingData.previous?.total || 0),
            percentChange: Math.round(((data.total - billingData.previous.total) / billingData.previous.total) * 100)
        } : null
    };
}

function hydrateTroubleshootingWidget(params) {
    const { issueType = 'general' } = params;
    const steps = troubleshootingSteps[issueType] || troubleshootingSteps.general;

    return {
        ...steps,
        quickActions: [
            { id: 'speedtest', label: 'Run Speed Test', icon: 'gauge' },
            { id: 'chat', label: 'Live Chat', icon: 'message-circle' },
            { id: 'callback', label: 'Request Callback', icon: 'phone' }
        ]
    };
}
