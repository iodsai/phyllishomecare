# Phyllis Chat Worker (Cloudflare Workers + OpenAI)

Lightweight chat API to answer site visitors using `gpt-4o-mini` with business context and CORS.

## Prerequisites
- Cloudflare account & API token (Workers Scripts:Edit, Routes:Edit; optional KV:Edit)
- OpenAI API key from https://platform.openai.com/api-keys
- Node/npm (npx) for deployment

## Environment Variables

### Required
- `OPENAI_API_KEY` - Your OpenAI API key for chat functionality
- `ALLOWED_ORIGINS` - Comma-separated list of allowed domains for CORS (e.g., `https://phyllishomecare.com,https://www.phyllishomecare.com`)

### Optional
- `OPENAI_MODEL` - AI model to use (default: `gpt-4o-mini`)
- Other options: `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`

See `.env.example` for detailed configuration examples.

## Configuration

### 1. Set Secrets
From the `chat-worker` folder:

```bash
# Required secrets
npx wrangler secret put OPENAI_API_KEY
# Enter your sk-... key when prompted

npx wrangler secret put ALLOWED_ORIGINS
# Enter: https://phyllishomecare.com,https://www.phyllishomecare.com

# Optional: Override default model
npx wrangler secret put OPENAI_MODEL
# Enter: gpt-4o-mini (or gpt-4, etc.)
```

### 2. Deploy
```bash
cd phyllishomecare/chat-worker
npx wrangler deploy
```

### 3. Custom Domain (Optional)
For a custom domain like `chat.phyllishomecare.com`:
1. Go to Cloudflare Dashboard → Workers & Pages → your Worker
2. Click Triggers → Add Custom Domain
3. Add DNS CNAME if prompted

## Front-end Integration

```js
async function askBot(msg) {
  const res = await fetch('https://phyllis-chat.phyllis-chat.workers.dev/', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ message: msg, history: [] })
  });
  const data = await res.json();
  return data.reply;
}
```

## Security Features
- **Rate Limiting**: 10 requests per minute per IP address
- **Input Validation**: 500 character limit, XSS protection
- **CORS Protection**: Strict origin validation
- **Request Timeout**: 8-second maximum for OpenAI calls
- **Response Sanitization**: Limits responses to 2 complete sentences

## Production Hardening

For thousands of concurrent users, consider:

1. **Cloudflare Rate Limiting**: Configure zone-level rate limits
   - https://developers.cloudflare.com/waf/rate-limiting-rules/

2. **Cloudflare Turnstile**: Add CAPTCHA protection for abuse prevention
   - https://developers.cloudflare.com/turnstile/

3. **Monitor Usage**: Set up alerts for:
   - OpenAI API quota/spending
   - Worker request patterns
   - Error rates

## Safety Defaults
- No PHI (Protected Health Information) in responses
- Concise answers tailored to home care services
- Phone: (302) 446-3986
- Service area: Delaware
- CORS strictly limited via ALLOWED_ORIGINS

