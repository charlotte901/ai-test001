const END_EVENT = "[DONE]";

function readError(response) {
  return response.json().then((payload) => payload?.error || "DeepSeek 暂时无法完成回应。").catch(() => "DeepSeek 暂时无法完成回应。");
}

export async function streamDeepSeek({ messages, onDelta, signal }) {
  const response = await fetch("/api/deepseek/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages, stream: true }),
    signal,
  });
  if (!response.ok) throw new Error(await readError(response));
  if (!response.body) throw new Error("DeepSeek 未返回可读取的内容。");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let complete = "";

  const consume = (chunk) => {
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === END_EVENT) continue;
      try {
        const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
        if (delta) {
          complete += delta;
          onDelta(complete);
        }
      } catch {
        // Ignore non-content SSE frames and retain the valid streamed output.
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() || "";
    frames.forEach(consume);
    if (done) break;
  }
  if (buffer) consume(buffer);
  return complete;
}

export async function generateArkImage({ prompt, signal }) {
  const response = await fetch("/api/ark/images", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt }),
    signal,
  });
  if (!response.ok) throw new Error(await readError(response));
  const payload = await response.json();
  if (!payload.image) throw new Error("图片服务未返回图片地址。");
  return payload.image;
}
