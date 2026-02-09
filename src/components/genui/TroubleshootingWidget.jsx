/**
 * TroubleshootingWidget - Context-aware support component
 * Replaces static FAQs with step-by-step guided troubleshooting
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle,
    Circle,
    ChevronRight,
    Gauge,
    MessageCircle,
    Phone,
    AlertCircle,
    ArrowRight
} from 'lucide-react';

const quickActionIcons = {
    gauge: Gauge,
    'message-circle': MessageCircle,
    phone: Phone
};

export function TroubleshootingWidget({ data, config = {} }) {
    const { stepLayout = 'accordion', showImages = true } = config;
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState([]);

    if (!data || !data.steps) {
        return <div className="genui-empty">No troubleshooting data available</div>;
    }

    const handleStepComplete = (stepId) => {
        if (!completedSteps.includes(stepId)) {
            setCompletedSteps([...completedSteps, stepId]);
        }

        // Auto-advance to next step
        const currentIndex = data.steps.findIndex(s => s.id === stepId);
        if (currentIndex < data.steps.length - 1) {
            setCurrentStep(currentIndex + 1);
        }
    };

    const handleStepClick = (index) => {
        setCurrentStep(index);
    };

    const isStepCompleted = (stepId) => completedSteps.includes(stepId);
    const allCompleted = completedSteps.length === data.steps.length;

    return (
        <div className={`troubleshooting-widget ${stepLayout}`}>
            <div className="troubleshoot-header">
                <AlertCircle size={24} className="header-icon" />
                <div className="header-content">
                    <h3>{data.title}</h3>
                    <p className="symptom">{data.symptom}</p>
                </div>
            </div>

            {/* Quick Actions */}
            {data.quickActions && (
                <div className="quick-actions">
                    {data.quickActions.map(action => {
                        const Icon = quickActionIcons[action.icon] || ChevronRight;
                        return (
                            <motion.button
                                key={action.id}
                                className="quick-action"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Icon size={18} />
                                <span>{action.label}</span>
                            </motion.button>
                        );
                    })}
                </div>
            )}

            {/* Progress Indicator */}
            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{ width: `${(completedSteps.length / data.steps.length) * 100}%` }}
                />
                <span className="progress-text">
                    {completedSteps.length} of {data.steps.length} steps completed
                </span>
            </div>

            {/* Steps */}
            <div className="troubleshoot-steps">
                {data.steps.map((step, index) => {
                    const isCompleted = isStepCompleted(step.id);
                    const isCurrent = currentStep === index;

                    return (
                        <motion.div
                            key={step.id}
                            className={`step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div
                                className="step-header"
                                onClick={() => handleStepClick(index)}
                            >
                                <div className="step-indicator">
                                    {isCompleted ? (
                                        <CheckCircle size={24} className="completed-icon" />
                                    ) : (
                                        <Circle size={24} className={isCurrent ? 'current-icon' : ''} />
                                    )}
                                    <span className="step-number">{index + 1}</span>
                                </div>
                                <div className="step-title">{step.title}</div>
                                <ChevronRight
                                    size={20}
                                    className={`step-chevron ${isCurrent ? 'expanded' : ''}`}
                                />
                            </div>

                            <AnimatePresence>
                                {isCurrent && (
                                    <motion.div
                                        className="step-content"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <p className="step-description">{step.description}</p>

                                        <div className="step-action">
                                            <ArrowRight size={16} />
                                            <span>{step.action}</span>
                                        </div>

                                        <div className="step-buttons">
                                            <motion.button
                                                className="btn-done"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleStepComplete(step.id)}
                                            >
                                                {isCompleted ? 'Completed' : 'Mark as Done'}
                                            </motion.button>

                                            {index < data.steps.length - 1 && (
                                                <motion.button
                                                    className="btn-skip"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setCurrentStep(index + 1)}
                                                >
                                                    Skip
                                                </motion.button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* Resolution Status */}
            <AnimatePresence>
                {allCompleted && (
                    <motion.div
                        className="resolution-status"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        <CheckCircle size={32} className="resolution-icon" />
                        <div className="resolution-content">
                            <h4>All Steps Completed!</h4>
                            <p>If your issue persists, please contact our support team.</p>
                            <div className="resolution-actions">
                                <button className="btn-chat">
                                    <MessageCircle size={16} />
                                    Live Chat
                                </button>
                                <button className="btn-callback">
                                    <Phone size={16} />
                                    Request Callback
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default TroubleshootingWidget;
