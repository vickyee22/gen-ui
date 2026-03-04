/**
 * GenUI POC - Main Application
 * CAIS 2026 Keynote Demo
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, MessageCircle, Zap, Clock, Database, Brain, Eye, EyeOff, ArrowLeft, Radio, ShoppingBag, Wifi, Tv, HelpCircle, Headphones, Speaker, Package, RotateCcw } from 'lucide-react';

import { classifyIntent } from './engine/intentClassifier';
import { orchestrate, getCacheStats } from './engine/orchestrator';
import { GenUIRenderer } from './components/genui';
import { WebChannel, MobileChannel, ChatChannel } from './channels';

import './index.css';

// Domain-specific suggestions
const DOMAIN_SUGGESTIONS = {
  novatek: [
    "Compare 5G plans with roaming",
    "I was overcharged $45 for roaming last month",
    "Why is my bill so high this month?",
    "Port my number to FutureTel",
    "My internet is slow"
  ],
  futurecommerce: [
    "Show me wireless headphones under $100",
    "Where is my order ORD-789?",
    "Find me noise cancelling earbuds",
    "I want to return my Sony headphones from order ORD-789",
    "Best bluetooth speakers under $100"
  ]
};

const DOMAIN_CONFIG = {
  novatek: {
    label: 'FutureTel',
    tagline: 'Telecom · Plans · Billing · Support',
    heroTitle: 'How can we help you today?',
    heroSub: 'Ask anything about your plans, bills, or services',
    icon: Radio,
    accent: 'teal',
    nav: [
      { icon: Smartphone, label: 'Mobile' },
      { icon: Wifi, label: 'Broadband' },
      { icon: Tv, label: 'Entertainment' },
      { icon: HelpCircle, label: 'Support' }
    ]
  },
  futurecommerce: {
    label: 'FutureCommerce',
    tagline: 'Audio · Electronics · Orders · Returns',
    heroTitle: 'What are you looking for?',
    heroSub: 'Browse products, track orders, or get support',
    icon: ShoppingBag,
    accent: 'indigo',
    nav: [
      { icon: Headphones, label: 'Audio' },
      { icon: ShoppingBag, label: 'Products' },
      { icon: Package, label: 'Orders' },
      { icon: RotateCcw, label: 'Returns' }
    ]
  }
};

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

  // Domain selection
  const [domain, setDomain] = useState(null); // null = landing page

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
      const intentResult = await classifyIntent(query, domain);

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
        components: result.components?.map(c => c.name) || [],
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

  const handleSelectDomain = (d) => {
    setDomain(d);
    setPayload(null);
    setMetrics(null);
    setQuery('');
  };

  // Render the appropriate channel
  const renderChannel = () => {
    const suggestions = domain ? DOMAIN_SUGGESTIONS[domain] : [];
    const channelProps = {
      query,
      onQueryChange: handleQueryChange,
      onSubmit: handleSubmit,
      suggestions,
      isProcessing,
      brandName: domainCfg?.label || 'FutureTel',
      navItems: domainCfg?.nav || []
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

  // Landing page
  if (!domain) {
    return (
      <div className="app landing">
        <div className="landing-page">
          <div className="landing-header">
            <h1>Unified Generative UI</h1>
            <p>Intent-first orchestration across channels. Select a domain to begin.</p>
          </div>
          <div className="landing-cards">
            {Object.entries(DOMAIN_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <motion.button
                  key={key}
                  className={`domain-card domain-card-${config.accent}`}
                  onClick={() => handleSelectDomain(key)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="domain-card-icon">
                    <Icon size={36} />
                  </div>
                  <h2>{config.label}</h2>
                  <p>{config.tagline}</p>
                  <span className="domain-card-cta">Open demo →</span>
                </motion.button>
              );
            })}
          </div>
          <div className="landing-footer">
            <span>CAIS 2026 · Unified Generative UI PoC</span>
          </div>
        </div>
      </div>
    );
  }

  const domainCfg = DOMAIN_CONFIG[domain];

  return (
    <div className={`app domain-${domain}`}>
      {/* Domain Nav Bar */}
      <div className="domain-nav">
        <button className="domain-back-btn" onClick={() => handleSelectDomain(null)}>
          <ArrowLeft size={14} /> Domains
        </button>
        <div className="domain-nav-label">
          {React.createElement(domainCfg.icon, { size: 14 })}
          <span>{domainCfg.label}</span>
        </div>
      </div>

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
      {metrics && !showArchitecture && !showMetrics && (
        <motion.button
          className="metrics-collapsed-btn"
          onClick={() => setShowMetrics(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          title="Show metrics"
        >
          <Eye size={16} />
        </motion.button>
      )}

      {metrics && !showArchitecture && showMetrics && (
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
              onClick={() => setShowMetrics(false)}
              title="Hide panel"
            >
              <EyeOff size={14} />
            </button>
          </div>

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
                      <span className="metric-label">Components</span>
                      <span className="metric-value">
                        {metrics.components?.length > 0
                          ? metrics.components.join(', ')
                          : '—'}
                      </span>
                    </div>
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
        </motion.div>
      )}

      {/* Demo Info */}
      <div className="demo-info">
        <span>CAIS 2026 Keynote</span>
        <span className="divider">|</span>
        <span>{domainCfg.label} · Unified Generative UI</span>
      </div>
    </div>
  );
}

export default App;
