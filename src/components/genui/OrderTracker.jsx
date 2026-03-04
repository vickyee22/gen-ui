/**
 * OrderTracker - Real-time order status with step-by-step timeline
 * Entity extraction: order ID from natural language query
 */

import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, Clock, MapPin, Phone, RotateCcw } from 'lucide-react';

const STATUS_ICONS = {
    placed: Package,
    confirmed: CheckCircle,
    packed: Package,
    shipped: Truck,
    out_for_delivery: Truck,
    delivered: CheckCircle,
    pending: Clock
};

export function OrderTracker({ data, config = {} }) {
    const { layout = 'timeline', showActions = true, animate = true } = config;

    if (!data || !data.orderId) {
        return <div className="genui-empty">Order not found</div>;
    }

    const MotionDiv = animate ? motion.div : 'div';

    return (
        <div className={`order-tracker ${layout}`}>
            {/* Header */}
            <div className="order-header">
                <div className="order-id-row">
                    <Package size={16} />
                    <span className="order-id">{data.orderId}</span>
                    <span className={`order-status-badge status-${data.currentStatus}`}>
                        {data.statusLabel}
                    </span>
                </div>
                <p className="order-summary">
                    {data.items.length} item{data.items.length > 1 ? 's' : ''} · ${data.total.toFixed(2)}
                </p>
            </div>

            {/* Items */}
            <div className="order-items">
                {data.items.map((item, i) => (
                    <div key={i} className="order-item-row">
                        <span className="item-emoji">{item.emoji || '📦'}</span>
                        <span className="item-name">{item.name}</span>
                        <span className="item-qty">×{item.qty}</span>
                        <span className="item-price">${item.price.toFixed(2)}</span>
                    </div>
                ))}
            </div>

            {/* Tracking timeline */}
            <div className="tracking-timeline">
                {data.steps.map((step, index) => {
                    const Icon = STATUS_ICONS[step.statusKey] || Clock;
                    const stepClass = `timeline-step step-${step.state}`;
                    return (
                        <MotionDiv
                            key={step.id}
                            className={stepClass}
                            {...(animate && {
                                initial: { opacity: 0, x: -10 },
                                animate: { opacity: 1, x: 0 },
                                transition: { delay: index * 0.1 }
                            })}
                        >
                            <div className="step-icon-wrapper">
                                <Icon size={15} />
                            </div>
                            <div className="step-content">
                                <div className="step-title">{step.title}</div>
                                <div className="step-timestamp">{step.timestamp}</div>
                                {step.detail && <div className="step-detail">{step.detail}</div>}
                            </div>
                        </MotionDiv>
                    );
                })}
            </div>

            {/* Delivery info */}
            {data.estimatedDelivery && (
                <div className="delivery-estimate">
                    <Truck size={13} />
                    <span>Estimated delivery: <strong>{data.estimatedDelivery}</strong></span>
                </div>
            )}

            {data.deliveryAddress && (
                <div className="delivery-address">
                    <MapPin size={13} />
                    <span>{data.deliveryAddress}</span>
                </div>
            )}

            {/* Quick actions */}
            {showActions && (
                <div className="order-actions">
                    <button className="order-action-btn">
                        <Phone size={13} /> Contact Support
                    </button>
                    <button className="order-action-btn secondary">
                        <RotateCcw size={13} /> Return Item
                    </button>
                </div>
            )}
        </div>
    );
}

export default OrderTracker;
