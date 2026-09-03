export const PROFILE_ART = "/assets/profile-reference.png";
// Source pixels: white bounce lettering ("CENTER") over five category cards.
export const PROFILE_WORDMARK = [456, 140, 813, 174];
export const PROFILE_CARDS = [
  { id: "organizations", title: "我的组织", subtitle: "My Organization", crop: [110, 350, 294, 438] },
  { id: "works", title: "我的作品", subtitle: "My Works", crop: [420, 350, 285, 438] },
  { id: "records", title: "测评记录", subtitle: "Assessment Records", crop: [720, 350, 275, 438] },
  { id: "favorites", title: "我的收藏", subtitle: "My Favorites", crop: [1010, 350, 285, 438] },
  { id: "settings", title: "账号设置", subtitle: "Account Settings", crop: [1310, 350, 268, 438] },
];

export function getProfileLayout(width, height) {
  const unit = Math.min(width / 1672, Math.max(height, 560) / 941);
  return { compact: width < 760, variables: { "--profile-unit": unit } };
}
