/**
 * GenUI Component Renderer
 * Dynamically renders the appropriate component based on orchestrator payload
 */

import { ComparisonTable } from './ComparisonTable';
import { BundleBuilder } from './BundleBuilder';
import { BillShockChart } from './BillShockChart';
import { TroubleshootingWidget } from './TroubleshootingWidget';
import { DynamicForm } from './DynamicForm';

const componentMap = {
    ComparisonTable,
    BundleBuilder,
    BillShockChart,
    TroubleshootingWidget,
    DynamicForm
};

export function GenUIRenderer({ payload }) {
    if (!payload || !payload.components || payload.components.length === 0) {
        return null;
    }

    return (
        <div className={`genui-multi-wrapper ${payload.components.length > 1 ? 'grid' : 'single'}`}>
            {payload.components.map((comp, idx) => {
                const Component = componentMap[comp.name];

                if (!Component) {
                    return (
                        <div key={idx} className="genui-error">
                            Unknown component: {comp.name}
                        </div>
                    );
                }

                return (
                    <Component
                        key={`${comp.name}-${idx}`}
                        data={comp.data}
                        config={comp.config}
                    />
                );
            })}
        </div>
    );
}

export { ComparisonTable, BundleBuilder, BillShockChart, TroubleshootingWidget, DynamicForm };
