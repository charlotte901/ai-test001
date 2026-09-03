export const ASSESSMENT_THEMES = {
  comprehensive: {
    title: "综合测评",
    color: "#2677ee",
    glow: "#4b96ff",
    deep: "#1559c9",
    soft: "#e9f2ff",
    description: "把判断、对话与实操串成一次完整闯关。",
    stages: ["objective", "conversation", "practical", "objective", "conversation"],
  },
  objective: {
    title: "客观题测评",
    color: "#00a568",
    glow: "#05b87a",
    deep: "#00855a",
    soft: "#e8f8ef",
    description: "用选择题检验你对 AI 的判断力。",
    stages: ["objective", "objective", "objective", "objective", "objective"],
  },
  conversation: {
    title: "对话式测评",
    color: "#7446d8",
    glow: "#8c59ed",
    deep: "#4f20b3",
    soft: "#f0eaff",
    description: "在真实沟通里，让 AI 理解你的意图。",
    stages: ["conversation", "conversation", "conversation", "conversation", "conversation"],
  },
  practical: {
    title: "实操任务测评",
    color: "#f26534",
    glow: "#ff8244",
    deep: "#e64418",
    soft: "#fff0e9",
    description: "像使用 Agent 一样拆解并完成任务。",
    stages: ["practical", "practical", "practical", "practical", "practical"],
  },
};

export const STAGE_LABELS = ["识别", "判断", "表达", "协作", "完成"];

export const QUESTIONS = [
  {
    prompt: "为了让 AI 生成更贴近需求的结果，第一步最重要的是？",
    options: ["先写出清晰的目标与限制", "只输入一个关键词", "等待 AI 猜测", "直接复制别人的答案"],
  },
  {
    prompt: "哪一种反馈能帮助 AI 更快修正结果？",
    options: ["指出需要保留和调整的部分", "说“再来一次”", "不给任何上下文", "一直更换问题"],
  },
  {
    prompt: "面对 AI 输出，哪种做法更可靠？",
    options: ["核对关键事实与来源", "默认它永远正确", "不看内容直接转发", "只看第一句话"],
  },
  {
    prompt: "当任务较复杂时，好的提示方式是？",
    options: ["分步骤说明成果标准", "一次塞入所有想法", "只说“帮我做”", "不给格式要求"],
  },
  {
    prompt: "完成 AI 协作任务前，最该检查的是？",
    options: ["结果是否满足原始目标", "页面颜色是否好看", "按钮有没有动画", "是否使用了最多工具"],
  },
];

export const CONVERSATIONS = [
  "请把“帮助新同学了解社团”活动，变成一句可执行的目标。",
  "现在补充两个限制条件，让这个任务更容易落地。",
  "如果 AI 的第一版结果太泛，你会怎样给出具体反馈？",
  "请用一句话说明你会如何验证 AI 提供的信息。",
  "最后，把你的提示词整理成一个可以直接使用的版本。",
];

export const PRACTICALS = [
  "为一场校园 AI 分享会拟定一份 30 分钟流程。",
  "为活动写一份可供 AI 执行的海报文案任务。",
  "把零散的访谈要点整理为行动清单。",
  "为同学设计一个可复用的学习计划提示词。",
  "产出一份带验收标准的 AI 协作任务说明。",
];

export function getStageMode(assessmentId, stage) {
  return ASSESSMENT_THEMES[assessmentId]?.stages[stage - 1] ?? "objective";
}

export function getAssessmentRoute() {
  const match = location.hash.match(/^#assessment\/(comprehensive|objective|conversation|practical)(?:\/(level)\/(\d))?$/);
  if (!match) return null;
  return {
    id: match[1],
    mode: match[2] === "level" ? "task" : "map",
    stage: Math.max(1, Math.min(5, Number(match[3] || 1))),
  };
}

export function assessmentHash(id, stage = null) {
  return stage ? `#assessment/${id}/level/${stage}` : `#assessment/${id}`;
}
