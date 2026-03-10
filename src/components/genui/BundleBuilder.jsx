/**
 * BundleBuilder - Interactive bundle configuration component
 * Allows users to build custom packages with real-time pricing
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Smartphone, Tv, Check, Tag, ShoppingCart } from 'lucide-react';

const serviceIcons = {
    Fiber: Wifi,
    Mobile: Smartphone,
    TV: Tv
};

export function BundleBuilder({ data, config = {} }) {
    const { layout = 'grid', interactive = true, showPreview = true } = config;
    const [selected, setSelected] = useState(data.suggested || {});
    const [totalPrice, setTotalPrice] = useState(0);

    // Calculate total price when selection changes
    useEffect(() => {
        let price = 0;
        Object.entries(selected).forEach(([service, optionId]) => {
            const option = data.options[service]?.find(o => o.id === optionId);
            if (option) price += option.price;
        });

        // Apply bundle discount
        if (data.bundleDiscount && Object.keys(selected).length >= 2) {
            price = price * (1 - data.bundleDiscount / 100);
        }

        setTotalPrice(price);
    }, [selected, data]);

    const handleSelect = (service, optionId) => {
        if (!interactive) return;

        setSelected(prev => {
            if (prev[service] === optionId) {
                const { [service]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [service]: optionId };
        });
    };

    if (!data || !data.options) {
        return <div className="genui-empty">No bundle options available</div>;
    }

    return (
        <div className={`bundle-builder ${layout}`}>
            <div className="bundle-header">
                <h3>{data.title}</h3>
                {data.promotions?.length > 0 && (
                    <div className="promo-badge">
                        <Tag size={14} />
                        {data.promotions[0].discount}
                    </div>
                )}
            </div>

            <div className="bundle-services">
                {data.services.map(service => {
                    const Icon = serviceIcons[service] || Wifi;
                    const options = data.options[service] || [];

                    return (
                        <motion.div
                            key={service}
                            className="service-section"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="service-header">
                                <Icon size={20} />
                                <h4>{service}</h4>
                            </div>

                            <div className="service-options">
                                {options.map(option => (
                                    <motion.div
                                        key={option.id}
                                        className={`option-card ${selected[service] === option.id ? 'selected' : ''}`}
                                        onClick={() => handleSelect(service, option.id)}
                                        whileHover={interactive ? { scale: 1.02 } : {}}
                                        whileTap={interactive ? { scale: 0.98 } : {}}
                                    >
                                        <div className="option-name">{option.name}</div>
                                        <div className="option-price">
                                            <span className="amount">${option.price.toFixed(2)}</span>
                                            <span className="period">/mo</span>
                                        </div>
                                        <div className="option-specs">
                                            {option.speed && <span>{option.speed}</span>}
                                            {option.data && <span>{option.data}</span>}
                                            {option.channels && <span>{option.channels} channels</span>}
                                        </div>
                                        <ul className="option-features">
                                            {option.features.slice(0, 2).map((f, i) => (
                                                <li key={i}><Check size={12} /> {f}</li>
                                            ))}
                                        </ul>

                                        {selected[service] === option.id && (
                                            <motion.div
                                                className="selected-indicator"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                            >
                                                <Check size={16} />
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {showPreview && (
                <AnimatePresence>
                    {Object.keys(selected).length > 0 && (
                        <motion.div
                            className="bundle-summary"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                        >
                            <div className="summary-header">
                                <ShoppingCart size={20} />
                                <h4>Your Bundle</h4>
                            </div>

                            <div className="summary-items">
                                {Object.entries(selected).map(([service, optionId]) => {
                                    const option = data.options[service]?.find(o => o.id === optionId);
                                    return option ? (
                                        <div key={service} className="summary-item">
                                            <span>{option.name}</span>
                                            <span>${option.price.toFixed(2)}</span>
                                        </div>
                                    ) : null;
                                })}
                            </div>

                            {Object.keys(selected).length >= 2 && data.bundleDiscount > 0 && (
                                <div className="summary-discount">
                                    <span>Bundle Discount ({data.bundleDiscount}%)</span>
                                    <span className="discount-value">
                                        -${(totalPrice / (1 - data.bundleDiscount / 100) - totalPrice).toFixed(2)}
                                    </span>
                                </div>
                            )}

                            <div className="summary-total">
                                <span>Monthly Total</span>
                                <span className="total-value">${totalPrice.toFixed(2)}</span>
                            </div>

                            <button className="bundle-cta">
                                Add to Cart
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
}

export default BundleBuilder;
