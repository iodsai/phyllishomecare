# Phyllis Chat Worker (Cloudflare Workers + OpenAI)

Lightweight chat API to answer site visitors using `gpt-4o-mini` with business context and CORS.

## Prereqs
- Cloudflare account & API token (Workers Scripts:Edit, Routes:Edit; optional KV:Edit).
- OpenAI API key.
- Node/npm (npx).

## Configure
1) Set secrets (from this folder):
```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put SYSTEM_PROMPT   # optional; falls back to default in code
npx wrangler secret put ALLOWED_ORIGINS # e.g. ["https://www.phyllishomecare.com","https://phyllis-chat.workers.dev"]
```
Optional environment vars (add via `wrangler secret put`):
- `OPENAI_MODEL` (default: gpt-4o-mini)
- `MAX_TOKENS` (default: 320)

2) Publish
```bash
cd phyllishomecare/chat-worker
npx wrangler publish --account-id <YOUR_ACCOUNT_ID>
```

If using a custom domain (e.g., `chat.phyllishomecare.com`):
- In Cloudflare → Workers → your Worker → Triggers → add Custom Domain, then add DNS CNAME if prompted.

## Front-end call example
```js
async function askBot(msg) {
  const res = await fetch('https://<your-worker-route>/', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ message: msg, history: [] })
  });
  const data = await res.json();
  return data.reply;
}
```

## Safety defaults
- No PHI; concise answers; phone: (302) 446-3986; service area: Greater Metro + suburbs.
- CORS limited via ALLOWED_ORIGINS secret.

