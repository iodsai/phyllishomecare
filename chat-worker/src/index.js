const FALLBACK = 'Thanks for reaching out! Our chat is currently being set up. Please call (302) 446-3986 or use the care request form, and our team will respond promptly.';

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };
}

export default {
  async fetch(request, env) {
    const allowed = safeParse(env.ALLOWED_ORIGINS) || [];
    const origin = request.headers.get("Origin") || "";
    const corsOrigin = allowed.includes(origin) ? origin : "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(corsOrigin) });
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST allowed" }),
        { status: 405, headers: corsHeaders(corsOrigin) }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        { status: 400, headers: corsHeaders(corsOrigin) }
      );
    }

    const { message, history = [] } = body || {};
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Missing message" }),
        { status: 400, headers: corsHeaders(corsOrigin) }
      );
    }

    const messages = [
      { role: "system", content: env.SYSTEM_PROMPT || defaultPrompt() },
      ...sanitizeHistory(history),
      { role: "user", content: message }
    ];

    try {
      const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.4,
          max_tokens: 320,
          messages
        })
      });

      if (!aiRes.ok) throw new Error("OpenAI error");

      const data = await aiRes.json();
      const reply = data?.choices?.[0]?.message?.content || FALLBACK;

      return new Response(
        JSON.stringify({ reply }),
        { headers: corsHeaders(corsOrigin) }
      );

    } catch (err) {
      return new Response(
        JSON.stringify({ reply: FALLBACK }),
        { status: 502, headers: corsHeaders(corsOrigin) }
      );
    }
  }
};

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-6).map(m => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content || "")
  }));
}

function safeParse(str) {
  try { return JSON.parse(str); } catch { return null; }
}

function defaultPrompt() {
  return `
You are the assistant for Phyllis Home Care, a non-medical in-home care company.

- Services: companion care, personal care (ADLs), memory care support, respite care, live-in and 24/7 coverage.
- Phone: (302) 446-3986
- Response time: under 15 minutes during business hours.
- Do NOT request or store medical or health information.
- If medical questions arise, politely decline and suggest speaking with a clinician.
- Keep responses short, calm, and action-oriented.
`;
}
