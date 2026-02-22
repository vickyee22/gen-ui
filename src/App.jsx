/**
 * GenUI POC - Main Application
 * CAIS 2026 Keynote Demo
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, MessageCircle, Zap, Clock, Database, Brain } from 'lucide-react';

import { classifyIntent } from './engine/intentClassifier';
import { orchestrate, getCacheStats } from './engine/orchestrator';
import { GenUIRenderer } from './components/genui';
import { WebChannel, MobileChannel, ChatChannel } from './channels';

import './index.css';

// Demo suggestions
const SUGGESTIONS = [
  "Compare 5G plans with roaming",
  "Build me a bundle with fiber and mobile",
  "Why is my bill so high this month?",
  "My internet is slow"
];

function App() {
  const [channel, setChannel] = useState('web');
  const [query, setQuery] = useState('');
  const [payload, setPayload] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [showArchitecture, setShowArchitecture] = useState(false);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);
    setShowArchitecture(true);
    setPayload(null);

    const totalStartTime = performance.now();

    try {
      // Step 1: Classify Intent (simulated LLM)
      const intentResult = await classifyIntent(query);

      // Step 2: Orchestrate (component selection + data hydration)
      const result = await orchestrate(intentResult, channel);

      const totalTime = Math.round(performance.now() - totalStartTime);

      const maxHydrationTime = result.components?.length > 0 ? Math.max(...result.components.map(c => c.data?.latency || 0)) : 0;

      setMetrics({
        intent: intentResult.intent,
        components: result.components?.map(c => c.name) || [],
        confidence: intentResult.confidence,
        intentTime: intentResult.processingTime,
        orchestrationTime: result.orchestrationTime,
        hydrationTime: maxHydrationTime,
        totalTime,
        fromCache: result.fromCache,
        cacheStats: getCacheStats()
      });

      setPayload(result);

    } catch (error) {
      console.error('GenUI Error:', error);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setShowArchitecture(false), 500);
    }
  }, [query, channel, isProcessing]);

  const handleQueryChange = (newQuery) => {
    setQuery(newQuery);
  };

  // Render the appropriate channel
  const renderChannel = () => {
    const channelProps = {
      query,
      onQueryChange: handleQueryChange,
      onSubmit: handleSubmit,
      suggestions: SUGGESTIONS,
      isProcessing
    };

    const genUIContent = payload
      ? payload.message
        ? (
          <motion.div
            className="text-response"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {payload.message}
          </motion.div>
        )
        : <GenUIRenderer payload={payload} />
      : null;

    switch (channel) {
      case 'mobile':
        return <MobileChannel {...channelProps}>{genUIContent}</MobileChannel>;
      case 'chat':
        return <ChatChannel {...channelProps}>{genUIContent}</ChatChannel>;
      default:
        return <WebChannel {...channelProps}>{genUIContent}</WebChannel>;
    }
  };

  return (
    <div className="app">
      {/* Channel Selector */}
      <div className="channel-selector">
        <div className="selector-label">Channel:</div>
        <div className="selector-buttons">
          <button
            className={channel === 'web' ? 'active' : ''}
            onClick={() => setChannel('web')}
          >
            <Monitor size={18} />
            <span>Web</span>
          </button>
          <button
            className={channel === 'mobile' ? 'active' : ''}
            onClick={() => setChannel('mobile')}
          >
            <Smartphone size={18} />
            <span>App</span>
          </button>
          <button
            className={channel === 'chat' ? 'active' : ''}
            onClick={() => setChannel('chat')}
          >
            <MessageCircle size={18} />
            <span>Chat</span>
          </button>
        </div>

        {/* Latency Badge */}
        {metrics && (
          <motion.div
            className={`latency-badge ${metrics.totalTime <= 200 ? 'fast' : 'slow'}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Clock size={14} />
            <span>{metrics.totalTime}ms</span>
            {metrics.fromCache && <span className="cache-badge">cached</span>}
          </motion.div>
        )}
      </div>

      {/* Channel Container */}
      <div className={`channel-container ${channel}`}>
        {renderChannel()}
      </div>

      {/* Architecture Visualization (during processing) */}
      <AnimatePresence>
        {showArchitecture && (
          <motion.div
            className="architecture-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="architecture-flow">
              <motion.div
                className="flow-step"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0 }}
              >
                <Brain size={32} />
                <span>Intent Classification</span>
              </motion.div>
              <motion.div
                className="flow-arrow"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2 }}
              />
              <motion.div
                className="flow-step"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Zap size={32} />
                <span>Component Selection</span>
              </motion.div>
              <motion.div
                className="flow-arrow"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5 }}
              />
              <motion.div
                className="flow-step"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Database size={32} />
                <span>Data Hydration</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics Panel */}
      {metrics && !showArchitecture && (
        <motion.div
          className="metrics-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="metrics-header">
            <Zap size={16} />
            <span>GenUI Metrics</span>
          </div>
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-label">Intent</span>
              <span className="metric-value">{metrics.intent}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Components</span>
              <span className="metric-value">{metrics.components.length > 0 ? metrics.components.join(', ') : 'None'}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Confidence</span>
              <span className="metric-value">{(metrics.confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="metric">
              <span className="metric-label">Intent Time</span>
              <span className="metric-value">{metrics.intentTime}ms</span>
            </div>
            <div className="metric">
              <span className="metric-label">Orchestration</span>
              <span className="metric-value">{metrics.orchestrationTime}ms</span>
            </div>
            <div className="metric">
              <span className="metric-label">Hydration</span>
              <span className="metric-value">{metrics.hydrationTime}ms</span>
            </div>
          </div>
          <div className="metrics-footer">
            <span>Total: <strong>{metrics.totalTime}ms</strong></span>
            <span>Cache: <strong>{metrics.cacheStats.size} items</strong></span>
          </div>
        </motion.div>
      )}

      {/* Demo Info */}
      <div className="demo-info">
        <span>CAIS 2026 Keynote</span>
        <span className="divider">|</span>
        <span>Unified Generative UI: Orchestrating Intent Across App, Web, and Chat</span>
      </div>
    </div>
  );
}

export default App;
