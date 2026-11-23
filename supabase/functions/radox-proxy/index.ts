
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("RADOX_API_KEY");
    if (!apiKey) {
      return Response.json(
        { error: "RADOX_API_KEY secret is missing" },
        { status: 500, headers: corsHeaders },
      );
    }

    const base = "https://radoxai.com/v1";
    const isModels = req.method === "GET";

    if (!isModels && req.method !== "POST") {
      return Response.json(
        { error: "Method not allowed" },
        { status: 405, headers: corsHeaders },
      );
    }

    const upstream = await fetch(
      isModels
        ? `${base}/models`
        : `${base}/chat/completions`,
      {
        method: isModels ? "GET" : "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Accept": isModels ? "application/json" : "text/event-stream",
        },
        ...(isModels ? {} : { body: await req.text() }),
        signal: req.signal,
      },
    );

    const headers = new Headers(corsHeaders);
    headers.set(
      "Content-Type",
      upstream.headers.get("Content-Type") || "application/json",
    );
    headers.set("Cache-Control", "no-cache, no-transform");

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Proxy error" },
      { status: 500, headers: corsHeaders },
    );
  }
});
