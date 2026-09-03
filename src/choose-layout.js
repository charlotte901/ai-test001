export const CHOOSE_ART = "/assets/choose-reference.png";
export const CHOOSE_WORDMARK = [502, 83, 837, 175];
export const CHOICES = [
  { id: "test", title: "测试闯关", subtitle: "Test Challenge", crop: [243, 303, 426, 503] },
  { id: "reports", title: "报告查询", subtitle: "Report Inquiry", crop: [707, 303, 425, 503] },
  { id: "profile", title: "个人中心", subtitle: "Personal Center", crop: [1166, 303, 425, 503] },
];

export function getChooseLayout(width, height) {
  const unit = Math.min(width / 1822, Math.max(height, 520) / 863);
  return { compact: width < 760, variables: { "--choose-unit": unit } };
}
