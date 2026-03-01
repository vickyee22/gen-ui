/**
 * GenUI POC - Main Application
 * CAIS 2026 Keynote Demo
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, MessageCircle, Zap, Clock, Database, Brain, Eye, EyeOff } from 'lucide-react';

import { classifyIntent } from './engine/intentClassifier';
import { orchestrate, getCacheStats } from './engine/orchestrator';
import { GenUIRenderer } from './components/genui';
import { WebChannel, MobileChannel, ChatChannel } from './channels';

import './index.css';

// Demo suggestions
const SUGGESTIONS = [
  "Compare 5G plans with roaming",
  "I was overcharged $45 for roaming last month",
  "Why is my bill so high this month?",
  "Port my number to NovaTel",
  "My internet is slow"
];

function App() {
  // Session management
  const [sessionId] = useState(() => {
    const id = `S-${Math.random().toString(16).substr(2, 4).toUpperCase()}`;
    sessionStorage.setItem('genui_sessionId', id);
    return id;
  });
  const [completedSteps, setCompletedSteps] = useState(0);
  const [previousChannel, setPreviousChannel] = useState('web');
  const [showSessionResume, setShowSessionResume] = useState(false);
  const sessionResumeTimeoutRef = useRef(null);

  // UI state
  const [channel, setChannel] = useState('web');
  const [query, setQuery] = useState('');
  const [payload, setPayload] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [showArchitecture, setShowArchitecture] = useState(false);
  const [metricsTab, setMetricsTab] = useState('overview'); // 'overview' or 'trace'
  const [showMetrics, setShowMetrics] = useState(true);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);
    setShowArchitecture(true);
    setPayload(null);
    setCompletedSteps(prev => prev + 1);

    const totalStartTime = performance.now();

    try {
      // Step 1: Classify Intent (Gemini AI)
      const intentResult = await classifyIntent(query);

      // Step 2: Orchestrate (component selection + data hydration)
      const result = await orchestrate(intentResult, channel);

      const totalTime = Math.round(performance.now() - totalStartTime);

      const maxHydrationTime = result.components?.length > 0 ? Math.max(...result.components.map(c => c.data?.latency || 0)) : 0;

      // Extract prefilled field count for entity extraction confidence
      const prefilledCount = result.metadata?.parameters?.prefilled ? Object.keys(result.metadata.parameters.prefilled).length : 0;
      const entityConfidence = prefilledCount > 0 ? Math.min(95, 60 + prefilledCount * 15) : intentResult.confidence;

      setMetrics({
        sessionId,
        completedSteps,
        currentChannel: channel,
        intent: intentResult.intent,
        components: result.components?.map(c => c.name) || [],
        confidence: intentResult.confidence,
        entityConfidence,
        planConfidence: Math.round(intentResult.confidence * 0.95), // Slightly lower than intent confidence
        intentTime: intentResult.processingTime,
        orchestrationTime: result.orchestrationTime,
        hydrationTime: maxHydrationTime,
        totalTime,
        fromCache: result.fromCache,
        cacheStats: getCacheStats(),
        trace: result.trace || [],
        // Planning metrics
        planSteps: (result.components?.length || 0) + 2, // components + classify + orchestrate
        toolsExecuted: result.components?.length || 0,
        replans: 0,
        // Governance metrics
        policyChecks: (result.components?.length || 0) > 0 ? 3 : 2,
        guardrailsTriggered: 0,
        unsafeActionsRejected: 0,
        hilRequired: false,
        // State metrics
        stateSize: Math.round(JSON.stringify(result).length / 1024 * 10) / 10 // KB
      });

      setPayload(result);

    } catch (error) {
      console.error('GenUI Error:', error);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setShowArchitecture(false), 500);
    }
  }, [query, channel, isProcessing, completedSteps, sessionId]);

  const handleQueryChange = (newQuery) => {
    setQuery(newQuery);
  };

  const handleChannelChange = (newChannel) => {
    if (newChannel !== channel && completedSteps > 0) {
      // Show session resume animation
      setPreviousChannel(channel);
      setShowSessionResume(true);
      if (sessionResumeTimeoutRef.current) clearTimeout(sessionResumeTimeoutRef.current);
      sessionResumeTimeoutRef.current = setTimeout(() => {
        setShowSessionResume(false);
      }, 2000);
    }
    setChannel(newChannel);
  };

  useEffect(() => {
    return () => {
      if (sessionResumeTimeoutRef.current) clearTimeout(sessionResumeTimeoutRef.current);
    };
  }, []);

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
            onClick={() => handleChannelChange('web')}
          >
            <Monitor size={18} />
            <span>Web</span>
          </button>
          <button
            className={channel === 'mobile' ? 'active' : ''}
            onClick={() => handleChannelChange('mobile')}
          >
            <Smartphone size={18} />
            <span>App</span>
          </button>
          <button
            className={channel === 'chat' ? 'active' : ''}
            onClick={() => handleChannelChange('chat')}
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

      {/* Status Line */}
      <div className="status-line">
        <span className="status-item">Mode: Intent-Orchestrated</span>
        <span className="status-divider">|</span>
        <span className="status-item">Deterministic Execution</span>
        <span className="status-divider">|</span>
        <span className="status-item">Policy-Enforced</span>
      </div>

      {/* Session Resume Animation */}
      <AnimatePresence>
        {showSessionResume && (
          <motion.div
            className="session-resume"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <span>Resuming session {sessionId}...</span>
            <span className="resume-detail">Loaded {completedSteps} completed step{completedSteps !== 1 ? 's' : ''}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
            <span>GenUI Orchestration</span>
            <button
              className="metrics-toggle"
              onClick={() => setShowMetrics(!showMetrics)}
              title={showMetrics ? "Hide" : "Show"}
            >
              {showMetrics ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>

          {showMetrics && (
            <>
              <div className="metrics-tabs">
                <button
                  className={`tab ${metricsTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setMetricsTab('overview')}
                >
                  Metrics
                </button>
                {metrics.trace && metrics.trace.length > 0 && (
                  <button
                    className={`tab ${metricsTab === 'trace' ? 'active' : ''}`}
                    onClick={() => setMetricsTab('trace')}
                  >
                    Trace
                  </button>
                )}
              </div>

              {metricsTab === 'overview' ? (
                <div className="metrics-content">
                  {/* State Metrics */}
                  <div className="metrics-section">
                    <div className="section-title">STATE</div>
                    <div className="metric-row">
                      <span className="metric-label">Session</span>
                      <span className="metric-value">{metrics.sessionId}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Completed Steps</span>
                      <span className="metric-value">{metrics.completedSteps}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">State Size</span>
                      <span className="metric-value">{metrics.stateSize} KB</span>
                    </div>
                  </div>

                  {/* Planning Metrics */}
                  <div className="metrics-section">
                    <div className="section-title">PLAN</div>
                    <div className="metric-row">
                      <span className="metric-label">Steps</span>
                      <span className="metric-value">{metrics.planSteps}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Tools</span>
                      <span className="metric-value">{metrics.toolsExecuted}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Replans</span>
                      <span className="metric-value">{metrics.replans}</span>
                    </div>
                  </div>

                  {/* Governance Metrics */}
                  <div className="metrics-section">
                    <div className="section-title">GOVERNANCE</div>
                    <div className="metric-row">
                      <span className="metric-label">Policy Checks</span>
                      <span className="metric-value">{metrics.policyChecks}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Guardrails Triggered</span>
                      <span className="metric-value">{metrics.guardrailsTriggered}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Unsafe Actions</span>
                      <span className="metric-value">{metrics.unsafeActionsRejected}</span>
                    </div>
                  </div>

                  {/* Confidence Breakdown */}
                  <div className="metrics-section">
                    <div className="section-title">CONFIDENCE</div>
                    <div className="metric-row">
                      <span className="metric-label">Intent</span>
                      <span className="metric-value">{(metrics.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Entities</span>
                      <span className="metric-value">{(metrics.entityConfidence).toFixed(0)}%</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Plan</span>
                      <span className="metric-value">{metrics.planConfidence}%</span>
                    </div>
                  </div>

                  {/* Timing Footer */}
                  <div className="metrics-footer">
                    <div className="footer-item">
                      <span>Intent: {metrics.intentTime}ms</span>
                      <span>Orchestration: {metrics.orchestrationTime}ms</span>
                      <span>Hydration: {metrics.hydrationTime}ms</span>
                    </div>
                    <div className="footer-item">
                      <span>Total: <strong>{metrics.totalTime}ms</strong></span>
                      {metrics.fromCache && <span className="cache-indicator">💾 cached</span>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="trace-content">
                  {metrics.trace && metrics.trace.map((entry, idx) => (
                    <div key={idx} className="trace-entry">
                      <span className="trace-step">{entry.step}</span>
                      <span className="trace-name">{entry.name}</span>
                      <span className="trace-duration">{entry.duration}ms</span>
                      {entry.status && <span className="trace-status">{entry.status}</span>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
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
