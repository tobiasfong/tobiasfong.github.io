export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return new Response("ok");
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request)
      });
    }

    if (request.method !== "POST" || url.pathname !== "/translate") {
      return new Response("Not found", { status: 404 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400, request);
    }

    const text = (body.text || "").trim();
    const mode = body.mode || "auto";

    if (!text) return json({ error: "Missing text" }, 400, request);

    let instruction =
      "Detect whether the input is English or Japanese, then translate to the other language. Return only the translation.";

    if (mode === "en2ja") {
      instruction = "Translate English to Japanese. Return only the translation.";
    } else if (mode === "ja2en") {
      instruction = "Translate Japanese to English. Return only the translation.";
    }

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        instructions: instruction,
        input: text
      })
    });

    const out = await openaiRes.json();

    if (!openaiRes.ok) {
      return json({ error: out?.error?.message || "OpenAI error" }, 500, request);
    }

    return json({ translation: out.output_text || "" }, 200, request);
  }
};

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allowed = ["https://tobiasfong.github.io"];

  const allowOrigin = allowed.includes(origin) ? origin : allowed[0];

  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400"
  };
}

function json(obj, status, request) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders(request), "content-type": "application/json" }
  });
}
