/**
 * ComparisonTable - Dynamic plan comparison component
 * Shows mobile plans side-by-side with highlighted features
 */

import { motion } from 'framer-motion';
import { Check, Star, Zap, Globe } from 'lucide-react';

export function ComparisonTable({ data, config = {} }) {
    const { layout = 'horizontal', showDetails = true, animate = true } = config;

    if (!data || !data.plans || data.plans.length === 0) {
        return <div className="genui-empty">No plans available</div>;
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const MotionDiv = animate ? motion.div : 'div';

    return (
        <div className={`comparison-table ${layout}`}>
            <div className="comparison-header">
                <h3>{data.title}</h3>
                {data.highlighted && (
                    <span className="highlight-badge">
                        <Star size={14} /> Recommended: {data.highlighted}
                    </span>
                )}
            </div>

            <MotionDiv
                className="comparison-grid"
                {...(animate && { variants: containerVariants, initial: "hidden", animate: "visible" })}
            >
                {data.plans.map((plan, index) => (
                    <MotionDiv
                        key={plan.name}
                        className={`plan-card ${plan.name === data.highlighted ? 'highlighted' : ''}`}
                        {...(animate && { variants: itemVariants })}
                    >
                        {plan.category && (
                            <div className="plan-category">
                                {plan.category === '5G' ? <Zap size={14} /> : <Globe size={14} />}
                                {plan.category}
                            </div>
                        )}

                        <h4 className="plan-name">{plan.name}</h4>

                        <div className="plan-price">
                            <span className="currency">$</span>
                            <span className="amount">{plan.price.toFixed(2)}</span>
                            <span className="period">/mo</span>
                        </div>

                        <div className="plan-data">
                            <span className="data-value">{plan.data}</span>
                            <span className="data-label">Data</span>
                        </div>

                        {showDetails && (
                            <>
                                <div className="plan-details">
                                    {plan.speed && <div className="detail"><strong>Speed:</strong> {plan.speed}</div>}
                                    {plan.roaming && <div className="detail"><strong>Roaming:</strong> {plan.roaming}</div>}
                                    {plan.calls && <div className="detail"><strong>Calls:</strong> {plan.calls}</div>}
                                    {plan.coverage && <div className="detail"><strong>Coverage:</strong> {plan.coverage}</div>}
                                    {plan.validity && <div className="detail"><strong>Validity:</strong> {plan.validity}</div>}
                                </div>

                                {plan.features && (
                                    <ul className="plan-features">
                                        {plan.features.map((feature, i) => (
                                            <li key={i}><Check size={14} /> {feature}</li>
                                        ))}
                                    </ul>
                                )}
                            </>
                        )}

                        <button className="plan-cta">
                            {plan.name === data.highlighted ? 'Best Choice' : 'Select Plan'}
                        </button>
                    </MotionDiv>
                ))}
            </MotionDiv>
        </div>
    );
}

export default ComparisonTable;
