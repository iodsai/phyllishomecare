const FALLBACK = 'Sorry, I could not process that right now. Please call (302) 446-3986 or submit the care form.';

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}

export default {
  async fetch(request, env) {
    const allowed = safeParse(env.ALLOWED_ORIGINS) || [];
    const origin = request.headers.get('Origin') || '';
    const corsOrigin = allowed.includes(origin) ? origin : '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(corsOrigin) });
    }
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Only POST allowed' }), { status: 405, headers: corsHeaders(corsOrigin) });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: corsHeaders(corsOrigin) });
    }

    const { message, history = [] } = body || {};
    if (!message) {
      return new Response(JSON.stringify({ error: 'Missing message' }), { status: 400, headers: corsHeaders(corsOrigin) });
    }

    const messages = [
      { role: 'system', content: env.SYSTEM_PROMPT || defaultPrompt() },
      ...sanitizeHistory(history),
      { role: 'user', content: message }
    ];

    try {
      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || 'gpt-4o-mini',
          temperature: 0.4,
          max_tokens: Number(env.MAX_TOKENS || 320),
          messages
        })
      });

      if (!aiRes.ok) throw new Error(`OpenAI error ${aiRes.status}`);
      const data = await aiRes.json();
      const reply = data?.choices?.[0]?.message?.content || FALLBACK;
      return new Response(JSON.stringify({ reply }), { headers: corsHeaders(corsOrigin) });
    } catch (err) {
      console.error(err);
      return new Response(JSON.stringify({ reply: FALLBACK }), { status: 502, headers: corsHeaders(corsOrigin) });
    }
  }
};

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-6)
    .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '') }));
}

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function defaultPrompt() {
  return `
You are the assistant for Phyllis Home Care, a non-medical in-home care company.
Key facts:
- Services: companion care, personal care (ADLs), memory care support, respite/short-term help, 24/7 and live-in coverage.
- Service area: Greater Metro and suburbs (call to confirm specific ZIPs).
- Phone: (302) 446-3986. Encourage calling for urgent needs or scheduling.
- Response time: under 15 minutes during business hours.
- Do NOT request or store medical/health/PHI details. Keep conversations general and privacy-safe.
- If conversation turns medical, politely decline and suggest speaking with a clinician; for emergencies, advise calling local emergency services.
- Keep answers concise and action-oriented. Offer to connect by phone or the online care form.
`;
}
