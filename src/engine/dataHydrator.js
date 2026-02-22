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

// eForm templates
const formTemplates = {
    bill_waiver: {
        formType: 'bill_waiver',
        title: 'Bill Waiver Request',
        description: 'Request a waiver or dispute a charge on your bill',
        submitLabel: 'Submit Waiver Request',
        successMessage: 'Your waiver request has been submitted and will be reviewed within 2 business days.',
        fields: [
            { id: 'account', label: 'Account Number', type: 'text', required: true, placeholder: 'e.g. NVT-123456' },
            { id: 'period', label: 'Billing Period', type: 'select', required: true, options: [
                { value: 'jan-2026', label: 'January 2026' },
                { value: 'dec-2025', label: 'December 2025' },
                { value: 'nov-2025', label: 'November 2025' }
            ]},
            { id: 'issueType', label: 'Charge Type', type: 'select', required: true, options: [
                { value: 'roaming', label: 'Roaming Charges' },
                { value: 'overage', label: 'Data Overage' },
                { value: 'addon', label: 'Unwanted Add-on' },
                { value: 'duplicate', label: 'Duplicate Charge' },
                { value: 'other', label: 'Other' }
            ]},
            { id: 'amount', label: 'Disputed Amount ($)', type: 'number', required: true, placeholder: 'e.g. 45.00' },
            { id: 'reason', label: 'Reason for Waiver', type: 'textarea', required: true, placeholder: 'Describe what happened...' }
        ]
    },
    technical_support: {
        formType: 'technical_support',
        title: 'Technical Support Request',
        description: 'Report a technical issue with your service',
        submitLabel: 'Submit Support Request',
        successMessage: 'A technician will contact you within 4 hours.',
        fields: [
            { id: 'service', label: 'Affected Service', type: 'select', required: true, options: [
                { value: 'fiber', label: 'Home Fibre' },
                { value: 'mobile', label: 'Mobile' },
                { value: 'tv', label: 'TV / CAST' }
            ]},
            { id: 'issue', label: 'Issue Description', type: 'textarea', required: true, placeholder: 'Describe the problem...' },
            { id: 'since', label: 'Issue Started', type: 'date', required: true },
            { id: 'contact', label: 'Contact Number', type: 'text', required: true, placeholder: 'e.g. 9123 4567' }
        ]
    },
    feedback: {
        formType: 'feedback',
        title: 'Share Your Feedback',
        description: 'Help us improve your NovaTel experience',
        submitLabel: 'Send Feedback',
        successMessage: 'Thank you! Your feedback helps us serve you better.',
        fields: [
            { id: 'category', label: 'Feedback Category', type: 'select', required: true, options: [
                { value: 'network', label: 'Network Quality' },
                { value: 'app', label: 'App Experience' },
                { value: 'billing', label: 'Billing' },
                { value: 'support', label: 'Customer Support' },
                { value: 'general', label: 'General' }
            ]},
            { id: 'rating', label: 'Overall Rating', type: 'stars', required: true },
            { id: 'title', label: 'Subject', type: 'text', required: false, placeholder: 'Brief summary...' },
            { id: 'message', label: 'Your Feedback', type: 'textarea', required: true, placeholder: 'Tell us more...' }
        ]
    },
    contact_us: {
        formType: 'contact_us',
        title: 'Contact Us',
        description: 'Get in touch with our team',
        submitLabel: 'Send Message',
        successMessage: "We'll get back to you within 1 business day.",
        fields: [
            { id: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your name' },
            { id: 'email', label: 'Email Address', type: 'text', required: true, placeholder: 'your@email.com' },
            { id: 'phone', label: 'Phone Number', type: 'text', required: false, placeholder: 'Optional' },
            { id: 'subject', label: 'Subject', type: 'text', required: true, placeholder: 'What is this regarding?' },
            { id: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'How can we help?' }
        ]
    },
    port_request: {
        formType: 'port_request',
        title: 'Number Port Request',
        description: 'Transfer your existing number to NovaTel',
        submitLabel: 'Submit Port Request',
        successMessage: 'Your port request is being processed. Transfer will complete within 1 business day.',
        fields: [
            { id: 'number', label: 'Mobile Number to Port', type: 'text', required: true, placeholder: 'e.g. 9123 4567' },
            { id: 'provider', label: 'Current Provider', type: 'select', required: true, options: [
                { value: 'starhub', label: 'StarHub' },
                { value: 'm1', label: 'M1' },
                { value: 'circles', label: 'Circles.Life' },
                { value: 'tpg', label: 'TPG' },
                { value: 'other', label: 'Other' }
            ]},
            { id: 'plan', label: 'New NovaTel Plan', type: 'select', required: true, options: [
                { value: 'xo75', label: 'XO 75 — $75.90/mo' },
                { value: 'xo98', label: 'XO 98 — $98.90/mo' },
                { value: 'xo128', label: 'XO 128 — $128.90/mo' }
            ]},
            { id: 'date', label: 'Preferred Transfer Date', type: 'date', required: true }
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
                case 'DynamicForm':
                    data = hydrateDynamicForm(parameters);
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

function hydrateDynamicForm(params) {
    const { formType = 'contact_us', prefilled = {}, aiContext = '' } = params;
    const template = formTemplates[formType] || formTemplates.contact_us;

    // Merge AI-extracted prefilled values into field definitions
    const fields = template.fields.map(field => {
        const prefilledValue = prefilled[field.id];
        if (prefilledValue) {
            return { ...field, prefilled: prefilledValue, aiExtracted: true };
        }
        return field;
    });

    return { ...template, fields, aiContext };
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
