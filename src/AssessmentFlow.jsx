import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChatCircleDots,
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
  PRACTICALS,
  QUESTIONS,
  STAGE_LABELS,
} from "./assessment-flow";

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
  const [sent, setSent] = useState(false);
  const send = () => {
    if (sent) {
      onComplete();
      return;
    }
    if (!draft.trim()) return;
    setSent(true);
  };
  return <div className="task-body conversation-task">
    <h2>和 AI 向导一起想清楚</h2>
    <div className="chat-thread" aria-live="polite">
      <div className="chat-bubble is-guide"><span>AI</span><p>{CONVERSATIONS[stage - 1]}</p></div>
      {sent && <div className="chat-bubble is-user"><p>{draft}</p><span>我</span></div>}
    </div>
    <label className="task-composer"><span className="sr-only">输入你的回应</span><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} placeholder={sent ? "已发送，点击箭头进入下一关" : "写下你的回应…"} /><button type="button" onClick={send} aria-label={sent ? "进入下一关" : "发送回应"}>{sent ? <ArrowRight weight="bold" /> : <PaperPlaneTilt weight="fill" />}</button></label>
  </div>;
}

function PracticalTask({ stage, onComplete }) {
  const [checks, setChecks] = useState([false, false, false]);
  const [draft, setDraft] = useState("");
  const ready = checks.some(Boolean) || draft.trim().length > 0;
  const steps = ["确认任务目标", "拆分执行步骤", "检查成果标准"];
  return <div className="task-body practical-task">
    <h2>让 AI 帮你完成这件事</h2>
    <p className="agent-brief">{PRACTICALS[stage - 1]}</p>
      <div className="agent-workspace">
      <div className="agent-checklist" aria-label="执行计划">
        {steps.map((label, index) => <label key={label}><input type="checkbox" checked={checks[index]} onChange={() => setChecks((value) => value.map((item, position) => position === index ? !item : item))} /><span>{label}</span></label>)}
      </div>
      <div className="agent-canvas" aria-label="Agent 工作区域"><span>Agent 将在这里展开执行结果</span></div>
    </div>
    <label className="agent-composer"><span className="sr-only">给 Agent 的第一条指令</span><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="描述你希望它怎样开始…" /><button type="button" className="agent-send" disabled={!ready} onClick={onComplete} aria-label="运行并进入下一关"><PaperPlaneTilt weight="fill" /></button></label>
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
