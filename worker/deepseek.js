export const DEEPSEEK_CHAT_PATH = "/api/deepseek/chat";
export const ARK_IMAGE_PATH = "/api/ark/images";

const MAX_MESSAGES = 16;
const MAX_CONTENT_LENGTH = 12_000;

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return null;
  const allowedRoles = new Set(["system", "user", "assistant"]);
  const safe = messages.map(({ role, content }) => ({ role, content: typeof content === "string" ? content.trim() : "" }));
  if (safe.some(({ role, content }) => !allowedRoles.has(role) || !content || content.length > MAX_CONTENT_LENGTH)) return null;
  return safe;
}

export async function handleDeepSeekChat(request, apiKey, fetcher = fetch) {
  if (request.method !== "POST") return json({ error: "仅支持 POST 请求。" }, 405);
  if (!apiKey) return json({ error: "尚未配置 DeepSeek 服务。" }, 503);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "请求格式不正确。" }, 400);
  }

  const messages = normalizeMessages(payload.messages);
  if (!messages) return json({ error: "对话内容不符合要求。" }, 400);

  const wantsStream = payload.stream !== false;
  let upstream;
  try {
    upstream = await fetcher("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash-vision-exp",
        messages,
        temperature: 0.55,
        stream: wantsStream,
        ...(wantsStream ? { stream_options: { include_usage: true } } : {}),
      }),
    });
  } catch {
    return json({ error: "暂时无法连接 DeepSeek，请稍后重试。" }, 502);
  }

  if (!upstream.ok) {
    let detail = "DeepSeek 暂时无法完成本次回应。";
    try { detail = (await upstream.json())?.error?.message || detail; } catch { /* keep generic detail */ }
    return json({ error: detail }, upstream.status);
  }

  if (!wantsStream) {
    const result = await upstream.json();
    return json({ message: result?.choices?.[0]?.message?.content || "" });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}

export async function handleArkImage(request, apiKey, fetcher = fetch) {
  if (request.method !== "POST") return json({ error: "仅支持 POST 请求。" }, 405);
  if (!apiKey) return json({ error: "尚未配置图片生成服务。" }, 503);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "请求格式不正确。" }, 400);
  }
  const prompt = typeof payload.prompt === "string" ? payload.prompt.trim() : "";
  if (!prompt || prompt.length > 4_000) return json({ error: "图片提示词不符合要求。" }, 400);

  let upstream;
  try {
    upstream = await fetcher("https://ark.cn-beijing.volces.com/api/v3/images/generations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "doubao-seedream-5-0-pro-260628",
        prompt,
        response_format: "url",
        size: "2K",
        stream: false,
        watermark: true,
      }),
    });
  } catch {
    return json({ error: "暂时无法连接图片生成服务，请稍后重试。" }, 502);
  }
  if (!upstream.ok) {
    let detail = "图片生成服务暂时无法完成本次任务。";
    try { detail = (await upstream.json())?.error?.message || detail; } catch { /* keep generic detail */ }
    return json({ error: detail }, upstream.status);
  }
  const result = await upstream.json();
  const image = result?.data?.[0]?.url;
  return image ? json({ image }) : json({ error: "图片服务未返回图片地址。" }, 502);
}
