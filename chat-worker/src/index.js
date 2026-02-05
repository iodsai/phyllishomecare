const FALLBACK = 'Thanks for reaching out! Please call (302) 446-3986 or fill out our care form at phyllishomecare.com/intake.html to get started.';

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

    const { message } = body || {};
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Missing message" }),
        { status: 400, headers: corsHeaders(corsOrigin) }
      );
    }

    const systemPrompt = `You are a helpful assistant for Phyllis Home Care, a non-medical in-home care company in Delaware.

SERVICES WE OFFER:
- Companion care (conversation, activities, errands)
- Personal care (bathing, grooming, dressing, mobility)
- Memory care (Alzheimer's and dementia support)
- Respite care (relief for family caregivers)
- 24-hour and live-in care
- Homemaker services (cooking, cleaning, laundry)

CONTACT INFO:
- Phone: (302) 446-3986
- Care form: phyllishomecare.com/intake.html

STRICT RULES:
1. Keep responses to exactly 2 sentences maximum.
2. First sentence: Answer their question briefly.
3. Second sentence: Always say "Call (302) 446-3986 or fill out our care form to get started!"
4. Never use bullet points, numbered lists, or any formatting.
5. Never give detailed explanations or step-by-step instructions.
6. Be warm and friendly but extremely concise.`;

    try {
      const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.7,
          max_tokens: 100,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ]
        })
      });

      if (!aiRes.ok) throw new Error("OpenAI error");

      const data = await aiRes.json();
      let reply = data?.choices?.[0]?.message?.content || FALLBACK;
      
      // Clean up the response - ensure it ends properly
      reply = cleanResponse(reply);

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

// Ensure response ends with complete sentence
function cleanResponse(text) {
  if (!text) return FALLBACK;
  
  // Remove any markdown formatting
  text = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^[-•]\s*/gm, '').replace(/^\d+\.\s*/gm, '');
  
  // Trim whitespace
  text = text.trim();
  
  // If response ends mid-sentence (no punctuation), add the CTA
  if (text && !text.match(/[.!?]$/)) {
    // Find last complete sentence
    const lastPunctuation = Math.max(
      text.lastIndexOf('.'),
      text.lastIndexOf('!'),
      text.lastIndexOf('?')
    );
    
    if (lastPunctuation > 0) {
      text = text.substring(0, lastPunctuation + 1);
    } else {
      // No complete sentence, use fallback
      return FALLBACK;
    }
  }
  
  // Ensure it ends with the CTA if it doesn't mention the phone number
  if (!text.includes('446-3986')) {
    text += ' Call (302) 446-3986 or fill out our care form to get started!';
  }
  
  return text;
}

function safeParse(str) {
  try { return JSON.parse(str); } catch { return null; }
}
