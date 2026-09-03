export const CHOOSE_ART = "/assets/choose-reference.png";
export const CHOOSE_WORDMARK = [502, 83, 837, 175];
export const CHOICES = [
  { id: "test", title: "测试闯关", subtitle: "Test Challenge", crop: [243, 303, 426, 503] },
  { id: "reports", title: "报告查询", subtitle: "Report Inquiry", crop: [707, 303, 425, 503] },
  { id: "profile", title: "个人中心", subtitle: "Personal Center", crop: [1166, 303, 425, 503] },
];

export function getChooseLayout(width, height) {
  // Match TEST's y=122 title, y=343 card row and 420px card height rhythm.
  const unit = Math.min(width / 1672, Math.max(height, 560) / 941);
  return { compact: width < 760, variables: { "--choose-unit": unit } };
}
