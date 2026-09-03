export const CHOOSE_ART = "/assets/choose-reference.png";
export const CHOOSE_WORDMARK = [502, 83, 837, 175];
export const CHOICES = [
  { id: "test", title: "测试闯关", subtitle: "Test Challenge", crop: [243, 303, 426, 503] },
  { id: "reports", title: "报告查询", subtitle: "Report Inquiry", crop: [707, 303, 425, 503] },
  { id: "profile", title: "个人中心", subtitle: "Personal Center", crop: [1166, 303, 425, 503] },
];

export function getChooseLayout(width, height) {
  // 1113 is the virtual design height that reproduces the assessments page's
  // rhythm (title ~13%, card top ~35%, cards ~45% of height); the 863px
  // source art alone makes cards fill 58% and hug the viewport bottom.
  const unit = Math.min(width / 1822, Math.max(height, 560) / 1113);
  return { compact: width < 760, variables: { "--choose-unit": unit } };
}
