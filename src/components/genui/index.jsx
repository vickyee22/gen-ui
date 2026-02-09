/**
 * GenUI Component Renderer
 * Dynamically renders the appropriate component based on orchestrator payload
 */

import { ComparisonTable } from './ComparisonTable';
import { BundleBuilder } from './BundleBuilder';
import { BillShockChart } from './BillShockChart';
import { TroubleshootingWidget } from './TroubleshootingWidget';

const componentMap = {
    ComparisonTable,
    BundleBuilder,
    BillShockChart,
    TroubleshootingWidget
};

export function GenUIRenderer({ payload }) {
    if (!payload || !payload.component) {
        return null;
    }

    const Component = componentMap[payload.component];

    if (!Component) {
        return (
            <div className="genui-error">
                Unknown component: {payload.component}
            </div>
        );
    }

    return (
        <Component
            data={payload.data}
            config={payload.renderConfig}
        />
    );
}

export { ComparisonTable, BundleBuilder, BillShockChart, TroubleshootingWidget };
