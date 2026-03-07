/**
 * PHYLLIS HOME CARE - Chat Worker
 * Hardened for high-traffic (thousands of concurrent users)
 * 
 * Features:
 * - Rate limiting per IP
 * - Request validation & sanitization
 * - Timeout handling
 * - Error boundaries
 * - Abuse prevention
 */

const FALLBACK = 'Thanks for reaching out! Call (302) 446-3986 or click "Get Started" on our website for a free consultation.';

// Rate limiting: max requests per IP per minute
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60000;

// In-memory rate limit store.
// NOTE: Cloudflare Workers runs in many V8 isolates globally. Each isolate has its
// own rateLimitMap, so this is per-isolate enforcement, not globally distributed.
// For global rate limiting at extreme scale, upgrade to Cloudflare KV or Durable Objects.
// At home-care traffic volumes this per-isolate approach is sufficient; the client-side
// rate limiter in main.js provides the first line of defense.
const MAX_MAP_ENTRIES = 5000; // hard cap to prevent OOM under sustained load
const rateLimitMap = new Map();

function corsHeaders(origin) {
  const headers = {
    "Content-Type": "application/json",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY"
  };
  
  // Only set CORS header if origin is allowed (standards-compliant)
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
  }
  
  return headers;
}

// Rate limiter by IP
function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  // Probabilistic cleanup: run on ~5% of requests to keep Map from growing unbounded
  if (Math.random() < 0.05) {
    for (const [key, val] of rateLimitMap) {
      if (now - val.timestamp > RATE_WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    }
  }
  
  if (!record || now - record.timestamp > RATE_WINDOW_MS) {
    // Hard cap: if Map is full, evict all expired entries before inserting
    if (rateLimitMap.size >= MAX_MAP_ENTRIES) {
      for (const [key, val] of rateLimitMap) {
        if (now - val.timestamp > RATE_WINDOW_MS) {
          rateLimitMap.delete(key);
        }
      }
      // If still full after cleanup, reject to protect memory
      if (rateLimitMap.size >= MAX_MAP_ENTRIES) {
        return false;
      }
    }
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// Sanitize and validate message
function sanitizeMessage(msg) {
  if (typeof msg !== 'string') return null;
  
  // Trim and limit length
  msg = msg.trim().substring(0, 500);
  
  // Remove potential XSS/injection
  msg = msg.replace(/<[^>]*>/g, '');
  
  // Must have some content
  if (msg.length < 1) return null;
  
  return msg;
}

// Validate origin
function isAllowedOrigin(origin, allowedList) {
  if (!origin) return false;
  
  // If ALLOWED_ORIGINS is not configured, allow localhost for development
  // In production, ALWAYS set ALLOWED_ORIGINS environment variable
  if (!allowedList || allowedList.length === 0) {
    console.warn("ALLOWED_ORIGINS not configured - allowing localhost only");
    // Allow localhost for development/testing
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return true;
    }
    return false; // Block all non-localhost without proper config
  }
  
  return allowedList.some(allowed => 
    origin === allowed || 
    origin === allowed.replace('https://', 'http://') ||
    origin.endsWith(allowed.replace('https://', '.'))
  );
}

export default {
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    
    // Get client IP for rate limiting
    const clientIP = request.headers.get('CF-Connecting-IP') || 
                     request.headers.get('X-Forwarded-For')?.split(',')[0] || 
                     'unknown';
    
    // Parse allowed origins
    const allowedOrigins = safeParse(env.ALLOWED_ORIGINS) || [];
    const origin = request.headers.get("Origin") || "";
    const isAllowed = isAllowedOrigin(origin, allowedOrigins);
    const corsOrigin = isAllowed ? origin : "";

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { 
        status: 204, 
        headers: corsHeaders(corsOrigin) 
      });
    }

    // Only allow POST
    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, corsOrigin);
    }

    // Check origin (block requests from unauthorized domains)
    if (!isAllowed && origin) {
      return jsonResponse({ error: "Unauthorized origin" }, 403, corsOrigin);
    }

    // Rate limiting
    if (!checkRateLimit(clientIP)) {
      return jsonResponse({ 
        reply: "You're sending messages too quickly. Please wait a moment and try again, or call (302) 446-3986." 
      }, 429, corsOrigin);
    }

    // Parse request body with size limit
    let body;
    try {
      const text = await request.text();
      if (text.length > 2000) {
        return jsonResponse({ error: "Request too large" }, 413, corsOrigin);
      }
      body = JSON.parse(text);
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, 400, corsOrigin);
    }

    // Validate and sanitize message
    const message = sanitizeMessage(body?.message);
    if (!message) {
      return jsonResponse({ error: "Invalid message" }, 400, corsOrigin);
    }

    // Check for OpenAI API key
    if (!env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY");
      return jsonResponse({ reply: FALLBACK }, 200, corsOrigin);
    }

    // Build system prompt
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
- Website: phyllishomecare.com (click "Get Started" or "Request a Free Consultation")

STRICT RULES:
1. Keep responses to exactly 2 sentences maximum.
2. First sentence: Answer their question briefly.
3. Second sentence: Always say "Call (302) 446-3986 or click 'Get Started' on our website for a free consultation!"
4. Never use bullet points, numbered lists, or any formatting.
5. Never give detailed explanations or step-by-step instructions.
6. Be warm and friendly but extremely concise.
7. Keep the first sentence under 20 words.
8. If asked about pricing, say costs vary based on care needs and encourage them to call for a free assessment.
9. Never discuss competitors or make medical recommendations.`;

    // Call OpenAI with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.3,
          max_tokens: 80,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!aiRes.ok) {
        const errorText = await aiRes.text();
        console.error(`OpenAI error: ${aiRes.status} - ${errorText}`);
        throw new Error("OpenAI API error");
      }

      const data = await aiRes.json();
      let reply = data?.choices?.[0]?.message?.content || FALLBACK;
      
      // Clean up the response
      reply = cleanResponse(reply);

      // Log response time for monitoring
      const duration = Date.now() - startTime;
      if (duration > 5000) {
        console.warn(`Slow response: ${duration}ms`);
      }

      return jsonResponse({ reply }, 200, corsOrigin);

    } catch (err) {
      if (err.name === 'AbortError') {
        console.error("OpenAI request timed out");
      } else {
        console.error(`Chat error: ${err.message}`);
      }
      return jsonResponse({ reply: FALLBACK }, 200, corsOrigin);
    }
  }
};

// Helper: JSON response
function jsonResponse(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(origin)
  });
}

// Helper: Clean response to ensure complete sentences
function cleanResponse(text) {
  if (!text) return FALLBACK;
  
  // Remove any markdown formatting
  text = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^[-•]\s*/gm, '').replace(/^\d+\.\s*/gm, '');
  
  // Trim whitespace
  text = text.trim();

  // Split into sentences and keep at most two
  var sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length === 0) {
    return FALLBACK;
  }
  sentences = sentences.slice(0, 2).map(function(sentence) {
    var trimmed = sentence.trim();
    if (!trimmed.match(/[.!?]$/)) {
      trimmed += '.';
    }
    return trimmed;
  });
  text = sentences.join(' ');
  
  // Ensure it ends with the CTA as the final sentence
  if (!text.includes('446-3986')) {
    text = text.replace(/[.!?]+\s*$/, '.');
    text = text + ' Call (302) 446-3986 or click "Get Started" for a free consultation!';
  }
  
  return text;
}

// Helper: Safe JSON parse
function safeParse(str) {
  try { return JSON.parse(str); } catch { return null; }
}
