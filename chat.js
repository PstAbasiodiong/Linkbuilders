const SYSTEM_PROMPT = `You are Link Builders AI, the specialist assistant for Link Builders, a link-building and SEO agency/resource website.

SCOPE: Answer questions about link building and closely related SEO topics only. This includes backlinks, link prospecting, digital PR, guest posting, publisher outreach, anchor text, link relevance, link quality, Domain Authority/Domain Rating, backlink audits, competitor backlink analysis, broken-link building, link reclamation, content-led link earning, SEO strategy, Google link spam policies, and measuring campaign results.

If a user asks about something unrelated, politely say: "I’m Link Builders AI, and I specialise in link building and related SEO topics. Ask me about backlinks, outreach, guest posting, link audits or SEO strategy." Do not answer unrelated questions.

Give practical, accurate, ethical advice. Prefer sustainable, editorially earned links; warn against buying manipulative links, private blog networks, spam, automated link schemes, or guarantees of rankings. Explain uncertainty and avoid promising specific ranking results. Do not invent Link Builders prices, clients, case studies, guarantees, or service availability. When asked about hiring Link Builders, invite the visitor to use the website contact section. Keep answers clear and helpful.`;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers }
  });
}
function cookieValue(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const item = cookie.split(";").map(v => v.trim()).find(v => v.startsWith(name + "="));
  return item ? item.slice(name.length + 1) : "";
}
async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestPost({ request, env }) {
  if (!env.AI) return json({ error: "The AI service is not configured yet. Please try again later." }, 503);
  if (!env.RATE_LIMIT_KV) return json({ error: "The message-limit service is not configured yet. Please try again later." }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Please send a valid message." }, 400); }
  if (!Array.isArray(body.messages) || body.messages.length === 0) return json({ error: "Please enter a question." }, 400);

  const messages = body.messages.slice(-12).filter(m =>
    m && (m.role === "user" || m.role === "assistant") &&
    typeof m.content === "string" && m.content.trim().length > 0
  );
  if (!messages.length || messages[messages.length - 1].role !== "user") return json({ error: "Please enter a question." }, 400);
  if (messages.some(m => m.content.length > 1500)) return json({ error: "Please keep each message under 1,500 characters." }, 400);

  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  let visitor = cookieValue(request, "lb_visitor");
  const newVisitor = !/^[a-f0-9-]{30,40}$/i.test(visitor);
  if (newVisitor) visitor = crypto.randomUUID();
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const key = `daily:${day}:${await sha256(ip + ":" + visitor)}`;
  const used = Number(await env.RATE_LIMIT_KV.get(key) || 0);
  if (used >= 100) {
    return json({ error: "You’ve reached the 100-message daily limit. Please come back tomorrow." }, 429,
      newVisitor ? { "Set-Cookie": `lb_visitor=${visitor}; Path=/; Max-Age=31536000; Secure; HttpOnly; SameSite=Lax` } : {});
  }

  try {
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 650,
      temperature: 0.4
    });
    const reply = result?.response || result?.result?.response;
    if (!reply || typeof reply !== "string") throw new Error("Empty model response");
    await env.RATE_LIMIT_KV.put(key, String(used + 1), { expirationTtl: 172800 });
    return json({ reply, remaining: 99 - used }, 200,
      newVisitor ? { "Set-Cookie": `lb_visitor=${visitor}; Path=/; Max-Age=31536000; Secure; HttpOnly; SameSite=Lax` } : {});
  } catch (error) {
    return json({ error: "Link Builders AI is temporarily unavailable. Please try again shortly." }, 502,
      newVisitor ? { "Set-Cookie": `lb_visitor=${visitor}; Path=/; Max-Age=31536000; Secure; HttpOnly; SameSite=Lax` } : {});
  }
}
