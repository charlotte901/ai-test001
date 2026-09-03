import test from "node:test";
import assert from "node:assert/strict";
import { ARK_IMAGE_PATH, DEEPSEEK_CHAT_PATH, handleArkImage, handleDeepSeekChat } from "../worker/deepseek.js";

const requestFor = (body, method = "POST") => new Request(`http://local.test${DEEPSEEK_CHAT_PATH}`, {
  method,
  headers: { "content-type": "application/json" },
  body: method === "POST" ? JSON.stringify(body) : undefined,
});

test("DeepSeek proxy keeps the credential server-side and rejects missing configuration", async () => {
  const response = await handleDeepSeekChat(requestFor({ messages: [{ role: "user", content: "你好" }] }), "");
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "尚未配置 DeepSeek 服务。");
});

test("DeepSeek proxy validates content and relays the streaming response", async () => {
  const calls = [];
  const response = await handleDeepSeekChat(
    requestFor({ messages: [{ role: "user", content: "请给建议" }], stream: true }),
    "test-key",
    async (...args) => {
      calls.push(args);
      return new Response('data: {"choices":[{"delta":{"content":"已连接"}}]}\n\ndata: [DONE]\n\n', {
        headers: { "content-type": "text/event-stream" },
      });
    },
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/event-stream; charset=utf-8");
  assert.match(await response.text(), /已连接/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "https://api.deepseek.com/chat/completions");
  assert.equal(calls[0][1].headers.authorization, "Bearer test-key");
  assert.match(calls[0][1].body, /deepseek-v4-flash-vision-exp/);
});

test("DeepSeek proxy does not accept unsafe chat payloads", async () => {
  const response = await handleDeepSeekChat(requestFor({ messages: [{ role: "tool", content: "not allowed" }] }), "test-key");
  assert.equal(response.status, 400);
});

test("image proxy keeps the image credential server-side and returns only a generated URL", async () => {
  const calls = [];
  const request = new Request(`http://local.test${ARK_IMAGE_PATH}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt: "一张适用于校园 AI 分享会的主视觉" }),
  });
  const response = await handleArkImage(request, "image-test-key", async (...args) => {
    calls.push(args);
    return new Response(JSON.stringify({ data: [{ url: "https://example.test/generated.png" }] }), {
      headers: { "content-type": "application/json" },
    });
  });
  assert.deepEqual(await response.json(), { image: "https://example.test/generated.png" });
  assert.equal(calls[0][0], "https://ark.cn-beijing.volces.com/api/v3/images/generations");
  assert.equal(calls[0][1].headers.authorization, "Bearer image-test-key");
  assert.match(calls[0][1].body, /doubao-seedream-5-0-pro-260628/);
});
