/**
 * Guardrails Engine - Content safety and abuse prevention
 * Scans user input for threats and returns rejection if violations detected
 */

// Content policy violations
const ABUSE_PATTERNS = [
  /hack|exploit|breach|crack|sql injection|drop table|delete from|union select/i,
  /expose.*system|compromise|infiltrate|penetrate|attack/i,
  /ddos|dos attack|buffer overflow|malware|virus|ransomware/i
];

// PII patterns (credit cards, SSN, passport)
const PII_PATTERNS = [
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /\b[A-Z]{1,2}\d{6,9}\b/ // Passport
];

// Excessive punctuation/spam patterns
const SPAM_PATTERNS = [
  /(.)\1{4,}/, // 5+ repeated characters
  /[!?]{3,}/, // Multiple exclamation marks
];

/**
 * Check if query violates content policy
 * Returns { passed: boolean, violation: string | null, severity: 'low' | 'medium' | 'high' }
 */
export function checkContentPolicy(query) {
  // Check for abuse patterns (hacking, exploits, attacks)
  for (const pattern of ABUSE_PATTERNS) {
    if (pattern.test(query)) {
      return {
        passed: false,
        violation: 'Abuse attempt detected',
        severity: 'high',
        type: 'content_policy'
      };
    }
  }

  // Check for PII exposure (outside secure forms)
  for (const pattern of PII_PATTERNS) {
    if (pattern.test(query)) {
      return {
        passed: false,
        violation: 'Personal information detected in insecure context',
        severity: 'high',
        type: 'pii_leak'
      };
    }
  }

  // Check for spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(query)) {
      return {
        passed: false,
        violation: 'Spam pattern detected',
        severity: 'low',
        type: 'spam'
      };
    }
  }

  return { passed: true, violation: null, severity: null, type: null };
}

/**
 * Check rate limiting for a session
 * Returns { passed: boolean, reason: string | null }
 */
export function checkRateLimit(sessionId, requestCount, timeWindowMs = 60000) {
  // Store request counts in sessionStorage (in real prod: Redis/database)
  const key = `ratelimit_${sessionId}`;
  const now = Date.now();
  const stored = sessionStorage.getItem(key);

  let requests = [];
  if (stored) {
    try {
      requests = JSON.parse(stored).filter(ts => now - ts < timeWindowMs);
    } catch (e) {
      requests = [];
    }
  }

  // Different limits per operation type
  const limit = requestCount <= 2 ? 20 : 5; // Form submissions have tighter limit

  if (requests.length >= limit) {
    return {
      passed: false,
      reason: `Rate limit exceeded: ${limit} requests per minute`,
      type: 'rate_limit'
    };
  }

  // Record this request
  requests.push(now);
  sessionStorage.setItem(key, JSON.stringify(requests));

  return { passed: true, reason: null, type: null };
}

/**
 * Main guardrails check - runs all checks
 * Returns rejection result if any check fails
 */
export function evaluateGuardrails(query, sessionId, sessionRequestCount = 1) {
  const checks = [];
  let triggered = 0;

  // Check 1: Content Policy
  const contentCheck = checkContentPolicy(query);
  checks.push(contentCheck);
  if (!contentCheck.passed) triggered++;

  // Check 2: Rate Limiting
  const rateLimitCheck = checkRateLimit(sessionId, sessionRequestCount);
  checks.push(rateLimitCheck);
  if (!rateLimitCheck.passed) triggered++;

  // If any guardrail triggered, return rejection
  if (triggered > 0) {
    const violation = checks.find(c => !c.passed);
    return {
      blocked: true,
      violation: violation.violation || 'Request blocked by guardrails',
      severity: violation.severity || 'medium',
      type: violation.type,
      message: getGuardrailMessage(violation.type, violation.violation),
      guardrailsTriggered: triggered,
      unsafeActionsRejected: 1
    };
  }

  // All checks passed
  return {
    blocked: false,
    violation: null,
    severity: null,
    type: null,
    message: null,
    guardrailsTriggered: 0,
    unsafeActionsRejected: 0
  };
}

/**
 * Generate user-friendly message for guardrail violations
 */
function getGuardrailMessage(type, violation) {
  const messages = {
    content_policy: "We can't process that request. Please don't ask for help with hacking, exploits, or attacks.",
    pii_leak: "Please don't share personal information (credit cards, SSN) in the chat. Use secure forms instead.",
    rate_limit: "You're making requests too quickly. Please wait a moment before trying again.",
    spam: "Your message looks like spam. Please try a normal request."
  };

  return messages[type] || "Your request was blocked by our safety guardrails. Please try again.";
}

/**
 * Clear rate limit for a session (for testing)
 */
export function clearRateLimit(sessionId) {
  const key = `ratelimit_${sessionId}`;
  sessionStorage.removeItem(key);
}

/**
 * Get guardrails stats for this session
 */
export function getGuardrailsStats(sessionId) {
  const key = `guardrails_${sessionId}`;
  const stored = sessionStorage.getItem(key);

  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return { triggered: 0, rejected: 0, violations: [] };
    }
  }

  return { triggered: 0, rejected: 0, violations: [] };
}

/**
 * Log a guardrail violation for analytics
 */
export function logGuardrailViolation(sessionId, type, severity) {
  const key = `guardrails_${sessionId}`;
  const stats = getGuardrailsStats(sessionId);

  stats.triggered++;
  if (severity === 'high') stats.rejected++;
  stats.violations.push({ type, severity, timestamp: Date.now() });

  sessionStorage.setItem(key, JSON.stringify(stats));
}
