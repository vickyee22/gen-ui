/**
 * DynamicForm - AI-powered dynamic eForm component
 * Renders the right form with pre-filled fields based on user intent
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle, FileText, Wrench, MessageSquare, Star, PhoneCall } from 'lucide-react';

const FORM_ICONS = {
    bill_waiver: FileText,
    technical_support: Wrench,
    contact_us: MessageSquare,
    feedback: Star,
    port_request: PhoneCall
};

export function DynamicForm({ data, config = {} }) {
    const { compact = false } = config;

    const [values, setValues] = useState(() => {
        const init = {};
        data?.fields?.forEach(f => { init[f.id] = f.prefilled || ''; });
        return init;
    });
    const [submitted, setSubmitted] = useState(false);

    if (!data || !data.fields) return null;

    const Icon = FORM_ICONS[data.formType] || FileText;

    const handleChange = (fieldId, value) => {
        setValues(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <motion.div
                className="form-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <CheckCircle size={48} />
                <h3>Submitted Successfully</h3>
                <p>{data.successMessage}</p>
                <span className="reference-number">Ref: NVT-{Math.floor(Math.random() * 900000 + 100000)}</span>
            </motion.div>
        );
    }

    return (
        <motion.div
            className={`dynamic-form ${compact ? 'compact' : ''}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Header */}
            <div className="form-header">
                <div className="form-icon">
                    <Icon size={20} />
                </div>
                <div>
                    <h3>{data.title}</h3>
                    <p className="form-description">{data.description}</p>
                </div>
            </div>

            {/* AI Context Banner */}
            {data.aiContext && (
                <div className="form-ai-context">
                    <Sparkles size={14} />
                    <span>AI understood: <em>"{data.aiContext}"</em></span>
                </div>
            )}

            {/* Fields */}
            <form onSubmit={handleSubmit} className="form-fields">
                {data.fields.map(field => (
                    <div key={field.id} className={`form-field ${field.aiExtracted ? 'ai-prefilled' : ''}`}>
                        <label className="field-label">
                            {field.label}
                            {field.required && <span className="required"> *</span>}
                            {field.aiExtracted && (
                                <span className="ai-badge">
                                    <Sparkles size={10} /> AI filled
                                </span>
                            )}
                        </label>

                        {field.type === 'textarea' && (
                            <textarea
                                value={values[field.id]}
                                onChange={e => handleChange(field.id, e.target.value)}
                                placeholder={field.placeholder}
                                rows={compact ? 2 : 3}
                                required={field.required}
                            />
                        )}

                        {field.type === 'select' && (
                            <select
                                value={values[field.id]}
                                onChange={e => handleChange(field.id, e.target.value)}
                                required={field.required}
                            >
                                <option value="">Select...</option>
                                {field.options?.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        )}

                        {field.type === 'stars' && (
                            <div className="star-rating">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        type="button"
                                        className={`star-btn ${parseInt(values[field.id]) >= star ? 'active' : ''}`}
                                        onClick={() => handleChange(field.id, star)}
                                    >★</button>
                                ))}
                            </div>
                        )}

                        {(['text', 'number', 'date'].includes(field.type) || !field.type) && (
                            <input
                                type={field.type || 'text'}
                                value={values[field.id]}
                                onChange={e => handleChange(field.id, e.target.value)}
                                placeholder={field.placeholder}
                                required={field.required}
                            />
                        )}
                    </div>
                ))}

                <button type="submit" className="form-submit">
                    {data.submitLabel || 'Submit'}
                </button>
            </form>
        </motion.div>
    );
}

export default DynamicForm;
