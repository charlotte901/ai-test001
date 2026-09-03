import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChatCircleDots,
  ClipboardText,
  CircleNotch,
  ListChecks,
  PaperPlaneTilt,
  Sparkle,
  Target,
} from "@phosphor-icons/react";
import { TestWordmark } from "./TestWordmark";
import {
  ASSESSMENT_THEMES,
  CONVERSATIONS,
  getStageMode,
  PRACTICAL_TASKS,
  QUESTIONS,
  STAGE_LABELS,
} from "./assessment-flow";
import { generateArkImage, streamDeepSeek } from "./deepseek";

const GUIDES = "/assets/assessment-guides-crop.png";

function Progress({ current, complete, onPick, disabled = false }) {
  return (
    <div className="level-progress" aria-label={`第 ${current} 关，共 5 关`}>
      <div className="level-nodes">
        {[1, 2, 3, 4, 5].map((number) => {
          const state = number < current ? "complete" : number === current ? "active" : "locked";
          return (
            <button
              key={number}
              type="button"
              className={`level-node is-${state}`}
              disabled={disabled || number > complete}
              aria-label={`第 ${number} 关${number <= complete ? "，可进入" : "，尚未解锁"}`}
              onClick={() => onPick?.(number)}
            >
              {state === "complete" ? <Check weight="bold" /> : number}
            </button>
          );
        })}
        </div>
      <span>{current} / 5</span>
    </div>
  );
}

function Guides() {
  const canvas = useRef(null);
  useEffect(() => {
    const image = new Image();
    image.src = GUIDES;
    image.onload = () => {
      const node = canvas.current;
      if (!node) return;
      node.width = image.naturalWidth;
      node.height = image.naturalHeight;
      const context = node.getContext("2d", { willReadFrequently: true });
      context.clearRect(0, 0, node.width, node.height);
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, node.width, node.height);
      for (let index = 0; index < pixels.data.length; index += 4) {
        const red = pixels.data[index];
        const green = pixels.data[index + 1];
        const blue = pixels.data[index + 2];
        // The supplied guide render has a green matte. Preserve the white
        // strokes while keying out only pixels dominated by that matte.
        if (green > 108 && green > red * 1.35 && green > blue * 1.35)
          pixels.data[index + 3] = 0;
      }
      context.putImageData(pixels, 0, 0);
    };
  }, []);
  return <canvas ref={canvas} className="assessment-guides" width="900" height="620" role="img" aria-label="两位测评向导" />;
}

export function AssessmentMap({ id, current, complete, onBack, onOpenStage, busy }) {
  const theme = ASSESSMENT_THEMES[id];
  return (
    <main className="assessment-flow map-flow" style={{ "--assessment-color": theme.color, "--assessment-soft": theme.soft, "--assessment-glow": theme.glow, "--assessment-deep": theme.deep }}>
      <button className="flow-back" type="button" onClick={onBack} disabled={busy}>
        <ArrowLeft weight="bold" /> 返回测评选择
      </button>
      <h1 className="flow-wordmark" aria-label="TEST! 闯关地图"><TestWordmark /></h1>
      <Progress current={current} complete={complete} onPick={onOpenStage} disabled={busy} />
      <section className="level-map" aria-label={`${theme.title}关卡地图`}>
        <p className="map-kicker">{theme.title}</p>
        <h2>从这一关开始</h2>
        <p>{theme.description}</p>
        <div className="map-path" role="list" aria-label="五个闯关节点">
          {[1, 2, 3, 4, 5].map((number) => {
            const state = number < current ? "complete" : number === current ? "active" : "locked";
            return (
              <button
                key={number}
                type="button"
                className={`map-stage is-${state}`}
                disabled={busy || number > complete}
                onClick={() => onOpenStage(number)}
                aria-label={`第 ${number} 关：${STAGE_LABELS[number - 1]}`}
              >
                <span className="map-stage-number">{state === "complete" ? <Check weight="bold" /> : number}</span>
                <span>{STAGE_LABELS[number - 1]}</span>
              </button>
            );
          })}
        </div>
        <Guides />
      </section>
    </main>
  );
}

function TaskHeader({ id, stage }) {
  const theme = ASSESSMENT_THEMES[id];
  const mode = getStageMode(id, stage);
  const icons = { objective: Target, conversation: ChatCircleDots, practical: ListChecks };
  const Icon = icons[mode];
  const names = { objective: "判断题", conversation: "对话练习", practical: "Agent 实操" };
  return <div className="task-heading"><Icon weight="fill" /><span>{theme.title} · 第 {stage} 关</span><strong>{names[mode]}</strong></div>;
}

function ObjectiveTask({ stage, onComplete }) {
  const [choice, setChoice] = useState(null);
  const question = QUESTIONS[stage - 1];
  return <div className="task-body objective-task">
    <h2>{question.prompt}</h2>
    <div className="answer-options" role="radiogroup" aria-label="答案选项">
      {question.options.map((option, index) => (
        <button key={option} type="button" role="radio" aria-checked={choice === index} className={choice === index ? "is-selected" : ""} onClick={() => setChoice(index)}>
          <span>{String.fromCharCode(65 + index)}</span>{option}
          {choice === index && <Check weight="bold" />}
        </button>
      ))}
    </div>
    <TaskAction disabled={choice === null} onClick={onComplete} label="提交答案" />
  </div>;
}

function ConversationTask({ stage, onComplete }) {
  const [draft, setDraft] = useState("");
  const threadNode = useRef(null);
  const [thread, setThread] = useState([
    { role: "assistant", content: "先说说你希望最终结果解决什么问题。" },
    { role: "user", content: "我希望目标更具体，也方便直接执行。", sample: true },
    { role: "assistant", content: CONVERSATIONS[stage - 1] },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const node = threadNode.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [thread]);
  const send = async () => {
    if (isReady) {
      onComplete();
      return;
    }
    const content = draft.trim();
    if (!content || isSending) return;
    const nextThread = [...thread, { role: "user", content }, { role: "assistant", content: "", pending: true }];
    setThread(nextThread);
    setDraft("");
    setError("");
    setIsSending(true);
    try {
      await streamDeepSeek({
        messages: [
          { role: "system", content: "你是 AIQUOS 的测评向导。请用中文简洁回应用户，帮助其把 AI 协作需求说得更具体；指出一个做得好的点和一个可执行的改进建议。不要替用户直接完成测评任务。" },
          ...nextThread.filter((item) => !item.sample && !item.pending).map(({ role, content: message }) => ({ role, content: message })),
        ],
        onDelta: (message) => setThread((items) => items.map((item, index) => index === items.length - 1 ? { role: "assistant", content: message } : item)),
      });
      setIsReady(true);
    } catch (requestError) {
      setThread((items) => items.slice(0, -1));
      setError(requestError.message || "发送失败，请重试。");
    } finally {
      setIsSending(false);
    }
  };
  return <div className="task-body conversation-task">
    <h2>和 AI 向导一起想清楚</h2>
    <div ref={threadNode} className="chat-thread" aria-live="polite">
      {thread.map((item, index) => <div key={`${item.role}-${index}`} className={`chat-bubble ${item.role === "user" ? "is-user" : "is-guide"}${item.role === "assistant" && !item.pending && isReady && index === thread.length - 1 ? " is-feedback" : ""}`}><span>{item.role === "user" ? "我" : "AI"}</span><p>{item.pending ? <CircleNotch className="reply-spinner" weight="bold" /> : item.content}</p></div>)}
    </div>
    {error && <p className="agent-error" role="alert">{error}</p>}
    <label className="task-composer"><span className="sr-only">输入你的回应</span><input disabled={isSending || isReady} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} placeholder={isReady ? "已获得 AI 反馈，点击箭头进入下一关" : "写下你的回应…"} /><button type="button" disabled={isSending} onClick={send} aria-label={isReady ? "进入下一关" : "发送回应"}>{isSending ? <CircleNotch className="reply-spinner" weight="bold" /> : isReady ? <ArrowRight weight="bold" /> : <PaperPlaneTilt weight="fill" />}</button></label>
  </div>;
}

function PracticalTask({ stage, onComplete }) {
  const [draft, setDraft] = useState("");
  const [showSource, setShowSource] = useState(false);
  const [output, setOutput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");
  const task = PRACTICAL_TASKS[stage - 1];
  const isImageTask = task.outputType === "image";
  const run = async () => {
    if (output || imageUrl) return onComplete();
    const prompt = draft.trim();
    if (!prompt || isRunning) return;
    setError("");
    setOutput("");
    setImageUrl("");
    setIsRunning(true);
    try {
      if (isImageTask) {
        setImageUrl(await generateArkImage({ prompt: `${task.title}\n${task.goal}\n任务要求：${task.requirements.join("；")}\n活动素材：${task.source}\n用户补充：${prompt}` }));
        return;
      }
      await streamDeepSeek({
        messages: [
          { role: "system", content: "你是 AIQUOS 实操测评的执行 Agent。请严格根据用户提示词和原始素材完成任务；保留关键数据，不补充素材中没有的信息。输出仅包含最终交付内容，不解释你的推理。" },
          { role: "user", content: `任务：${task.title}\n目标：${task.goal}\n要求：\n${task.requirements.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n\n原始素材：\n${task.source}\n\n用户提示词：\n${prompt}` },
        ],
        onDelta: setOutput,
      });
    } catch (requestError) {
      setError(requestError.message || "运行失败，请重试。");
    } finally {
      setIsRunning(false);
    }
  };
  return <div className="task-body practical-task">
    <h2>{task.title}</h2>
    <p className="agent-brief">{task.goal}</p>
    <div className="agent-workspace">
      <section className="agent-checklist" aria-label="任务要求">
        <div className="agent-section-heading"><ClipboardText weight="fill" /><span>交付标准</span></div>
        <ul>{task.requirements.map((item) => <li key={item}>{item}</li>)}</ul>
        <button className="source-toggle" type="button" onClick={() => setShowSource((value) => !value)}>{showSource ? "收起原始汇报" : "查看原始口语汇报"}</button>
        {showSource && <p className="source-copy">{task.source}</p>}
      </section>
      <section className="agent-canvas" aria-live="polite" aria-label="Agent 工作区域">
        <div className="agent-section-heading"><Sparkle weight="fill" /><span>AI 输出</span></div>
        {isRunning && !output && !imageUrl ? <div className="agent-empty"><CircleNotch className="reply-spinner" weight="bold" /><span>{isImageTask ? "正在生成主视觉…" : "正在整理材料…"}</span></div> : imageUrl ? <img className="agent-image" src={imageUrl} alt={`${task.title}生成结果`} /> : output ? <p className="agent-output">{output}</p> : <div className="agent-empty"><Sparkle weight="fill" /><span>写好提示词后，Agent 将在这里完成交付。</span></div>}
      </section>
    </div>
    {error && <p className="agent-error" role="alert">{error}</p>}
    <label className="agent-composer"><span className="sr-only">给 Agent 的提示词</span><textarea disabled={isRunning || Boolean(output) || Boolean(imageUrl)} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={output || imageUrl ? "任务已完成，点击箭头进入下一关" : isImageTask ? "写下画面提示词，让 Agent 生成主视觉…" : "写下你的提示词，让 Agent 开始执行…"} /><button type="button" className="agent-send" disabled={isRunning || (!draft.trim() && !output && !imageUrl)} onClick={run} aria-label={output || imageUrl ? "进入下一关" : isImageTask ? "生成图片" : "运行 Agent"}>{isRunning ? <CircleNotch className="reply-spinner" weight="bold" /> : output || imageUrl ? <ArrowRight weight="bold" /> : <PaperPlaneTilt weight="fill" />}</button></label>
  </div>;
}

function TaskAction({ disabled, onClick, label }) {
  return <button type="button" className="task-action" disabled={disabled} onClick={onClick}>{label}<ArrowRight weight="bold" /></button>;
}

export function AssessmentTask({ id, stage, complete, onBack, onPick, onComplete, busy }) {
  const theme = ASSESSMENT_THEMES[id];
  const mode = getStageMode(id, stage);
  const taskKey = `${id}-${stage}-${mode}`;
  const props = { stage, onComplete: () => onComplete(stage) };
  return <main className="assessment-flow task-flow" data-mode={mode} style={{ "--assessment-color": theme.color, "--assessment-soft": theme.soft, "--assessment-glow": theme.glow, "--assessment-deep": theme.deep }}>
    <button className="flow-back" type="button" onClick={onBack} disabled={busy}><ArrowLeft weight="bold" /> 返回关卡地图</button>
    <h1 className="flow-wordmark" aria-label="TEST! 测评关卡"><TestWordmark /></h1>
    <Progress current={stage} complete={complete} onPick={onPick} disabled={busy} />
    <section className="task-panel" aria-label={`${theme.title}第 ${stage} 关`}>
      <Guides />
      <TaskHeader id={id} stage={stage} />
      {mode === "objective" ? <ObjectiveTask key={taskKey} {...props} /> : mode === "conversation" ? <ConversationTask key={taskKey} {...props} /> : <PracticalTask key={taskKey} {...props} />}
    </section>
  </main>;
}
