/**
 * Dynamic buyflow — OpenAI JSON client (same key, model and retry policy as
 * src/engine/intentClassifier.js). Returns null when the LLM is unavailable so
 * callers fall back to deterministic rules.
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

// Once credits are exhausted, stop calling for the rest of the session.
// ?llm=0 forces the rules engine (stage-safe backup and for testing).
const forcedOff = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('llm') === '0';
let disabledReason = forcedOff ? 'LLM switched off (?llm=0)' : OPENAI_API_KEY ? null : 'No OpenAI API key';

export const llmStatus = () => (disabledReason ? { live: false, reason: disabledReason } : { live: true });

/**
 * @returns {Promise<{ json: object, ms: number } | null>}
 */
export async function askJSON(system, user, { maxTokens = 700, temperature = 0.2 } = {}) {
  if (disabledReason) return null;
  const start = performance.now();
  try {
    let response;
    for (let attempt = 0; ; attempt++) {
      response = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: typeof user === 'string' ? user : JSON.stringify(user) }
          ],
          temperature,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' }
        })
      });
      if (response.ok) break;

      let errorCode = null;
      if (response.status === 429) {
        errorCode = await response.clone().json().then((b) => b?.error?.code).catch(() => null);
      }
      const outOfCredits = errorCode === 'insufficient_quota' || errorCode === 'credit_balance_exhausted';
      if (outOfCredits || response.status === 401) {
        disabledReason = outOfCredits ? 'OpenAI credits exhausted' : 'OpenAI key rejected';
        throw new Error(disabledReason);
      }
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt >= 2) throw new Error(`OpenAI API error: ${response.status}`);
      const retryAfter = Number(response.headers.get('retry-after')) * 1000;
      await new Promise((r) => setTimeout(r, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 400 * 2 ** attempt));
    }
    const data = await response.json();
    const json = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    return { json, ms: Math.round(performance.now() - start) };
  } catch (err) {
    console.error('[EShop LLM] falling back to rules:', err.message);
    return null;
  }
}
