/**
 * BillShockChart - Waterfall chart for bill breakdown
 * Visualizes billing anomalies and explains charges
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export function BillShockChart({ data, config = {} }) {
    const { chartType = 'waterfall', showLegend = true, animate = true } = config;
    const [expandedItem, setExpandedItem] = useState(null);

    if (!data || !data.breakdown) {
        return <div className="genui-empty">No billing data available</div>;
    }

    // Prepare waterfall chart data
    const chartData = [];
    let cumulative = 0;

    data.breakdown.forEach((item, index) => {
        const start = cumulative;
        cumulative += item.amount;

        chartData.push({
            name: item.category,
            value: Math.abs(item.amount),
            start: item.amount >= 0 ? start : cumulative,
            fill: item.amount < 0
                ? '#10b981' // green for discounts
                : data.anomalies?.includes(item.category)
                    ? '#ef4444' // red for anomalies
                    : '#6366f1', // purple for normal
            isAnomaly: data.anomalies?.includes(item.category),
            description: item.description,
            amount: item.amount
        });
    });

    // Add total bar
    chartData.push({
        name: 'Total',
        value: data.total,
        start: 0,
        fill: '#1e293b',
        isTotal: true
    });

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div className="bill-tooltip">
                    <div className="tooltip-header">{item.name}</div>
                    <div className="tooltip-amount">
                        {item.amount < 0 ? '-' : ''}${Math.abs(item.amount || item.value).toFixed(2)}
                    </div>
                    {item.description && (
                        <div className="tooltip-desc">{item.description}</div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bill-shock-chart">
            <div className="bill-header">
                <div className="bill-title">
                    <h3>{data.title}</h3>
                    {data.comparison && (
                        <div className={`bill-change ${data.comparison.difference > 0 ? 'increase' : 'decrease'}`}>
                            {data.comparison.difference > 0 ? (
                                <TrendingUp size={16} />
                            ) : (
                                <TrendingDown size={16} />
                            )}
                            <span>
                                {data.comparison.difference > 0 ? '+' : ''}
                                ${data.comparison.difference.toFixed(2)}
                                ({data.comparison.percentChange > 0 ? '+' : ''}{data.comparison.percentChange}%)
                            </span>
                        </div>
                    )}
                </div>

                <div className="bill-total">
                    <span className="label">Total Bill</span>
                    <span className="amount">${data.total.toFixed(2)}</span>
                </div>
            </div>

            {data.anomalies?.length > 0 && (
                <motion.div
                    className="anomaly-alert"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <AlertTriangle size={18} />
                    <span>
                        Higher than usual charges detected: {data.anomalies.join(', ')}
                    </span>
                </motion.div>
            )}

            <div className="chart-container">
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                            axisLine={{ stroke: '#334155' }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {data.previousBill && (
                            <ReferenceLine
                                y={data.previousBill}
                                stroke="#6366f1"
                                strokeDasharray="5 5"
                                label={{
                                    value: `Previous: $${data.previousBill}`,
                                    fill: '#6366f1',
                                    fontSize: 11
                                }}
                            />
                        )}
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.fill}
                                    opacity={entry.isAnomaly ? 1 : 0.85}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bill-breakdown">
                <h4>Detailed Breakdown</h4>
                {data.breakdown.map((item, index) => (
                    <motion.div
                        key={index}
                        className={`breakdown-item ${data.anomalies?.includes(item.category) ? 'anomaly' : ''} ${expandedItem === index ? 'expanded' : ''}`}
                        onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <div className="item-main">
                            <div className="item-info">
                                <span className="item-category">{item.category}</span>
                                {data.anomalies?.includes(item.category) && (
                                    <span className="anomaly-badge">Unusual</span>
                                )}
                            </div>
                            <div className="item-right">
                                <span className={`item-amount ${item.amount < 0 ? 'negative' : ''}`}>
                                    {item.amount < 0 ? '-' : ''}${Math.abs(item.amount).toFixed(2)}
                                </span>
                                {expandedItem === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                        </div>

                        {expandedItem === index && (
                            <motion.div
                                className="item-detail"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                            >
                                {item.description}
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

export default BillShockChart;
