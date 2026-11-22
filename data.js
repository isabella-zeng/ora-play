// Sample data — mirrors ORA/ORA/Models/SampleData.swift.
// Keep the two in sync when the app's seed data changes.

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

function at(dayOffset, hour) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour);
  return d;
}

export function makeSampleData() {
  const now = Date.now();
  const ago = (ms) => new Date(now - ms);

  const members = [
    { id: 'm1', name: 'Alice', role: '产品设计师', bio: '喜欢在靠窗的位置画原型，燕麦拿铁重度用户。', skills: ['Figma', '用户研究', '插画'], cafe: '转角咖啡', status: 'focusing', tint: 0, isFavorite: true },
    { id: 'm2', name: 'Tom', role: 'iOS 工程师', bio: 'SwiftUI 爱好者，周末带猫来上班。', skills: ['Swift', 'SwiftUI', 'CoreML'], cafe: '转角咖啡', status: 'open', tint: 4, isFavorite: false },
    { id: 'm3', name: 'Grace', role: '自由撰稿人', bio: '正在写第二本小说，需要安静但不孤单的地方。', skills: ['写作', '编辑', '播客'], cafe: '绿洲书房', status: 'focusing', tint: 3, isFavorite: false },
    { id: 'm4', name: 'Jack', role: '创业者', bio: '做可持续时尚的电商，随时欢迎交流想法。', skills: ['增长', '融资', '品牌'], cafe: '绿洲书房', status: 'open', tint: 2, isFavorite: false },
    { id: 'm5', name: 'Lea', role: '数据分析师', bio: '白天 SQL，晚上陶艺。', skills: ['Python', 'SQL', '可视化'], cafe: '山丘烘焙', status: 'away', tint: 1, isFavorite: false },
    { id: 'm6', name: 'Monica', role: '营销顾问', bio: '活动策划达人，ORA 读书会发起人。', skills: ['内容营销', '社群', '活动'], cafe: '山丘烘焙', status: 'open', tint: 3, isFavorite: false },
    { id: 'm7', name: 'Stephen', role: '后端工程师', bio: 'Go 和 Rust，喝美式不加糖。', skills: ['Go', 'Rust', '云架构'], cafe: '转角咖啡', status: 'focusing', tint: 5, isFavorite: false },
    { id: 'm8', name: 'Joe', role: '摄影师', bio: '在找愿意被拍的咖啡馆和人。', skills: ['摄影', '调色', '短视频'], cafe: '绿洲书房', status: 'away', tint: 0, isFavorite: false },
  ];

  const posts = [
    { id: 'p1', authorName: 'Alice', authorTint: 0, cafe: '转角咖啡', text: '今天的阳光刚好照在键盘上，三小时画完了整个引导流程 ☀️ 有人下午想一起番茄钟吗？', mood: '☀️', likes: 24, isLiked: false, commentCount: 5, createdAt: ago(25 * MIN) },
    { id: 'p2', authorName: 'Jack', authorTint: 2, cafe: '绿洲书房', text: '终于把 pitch deck 改完第七版了。谢谢昨天帮我看稿的各位，请大家喝咖啡！', mood: '🎉', likes: 41, isLiked: false, commentCount: 12, createdAt: ago(90 * MIN) },
    { id: 'p3', authorName: 'Grace', authorTint: 3, cafe: '绿洲书房', text: '第 12 章写完。安静的角落 + 一壶伯爵茶 = 生产力。', mood: '📖', likes: 18, isLiked: false, commentCount: 3, createdAt: ago(4 * HOUR) },
    { id: 'p4', authorName: 'Monica', authorTint: 3, cafe: '山丘烘焙', text: '周五晚上的读书会还剩 4 个位置，这次读《原则》，带上你的问题来～', mood: '📚', likes: 33, isLiked: false, commentCount: 8, createdAt: ago(20 * HOUR) },
  ];

  const events = [
    { id: 'e1', title: '晨间深度工作 Sprint', details: '两个 50 分钟番茄钟，中间一起喝咖啡聊进度。适合需要一点陪伴来启动一天的你。', location: '转角咖啡 · 二楼长桌', host: 'Tom', startDate: at(1, 9), durationMinutes: 120, capacity: 12, attendees: 8, isJoined: false, category: 'cowork' },
    { id: 'e2', title: 'SwiftUI 动画工作坊', details: '从 matchedGeometryEffect 到 PhaseAnimator，带电脑来现场动手。', location: '绿洲书房 · 会议室', host: 'Tom', startDate: at(2, 14), durationMinutes: 90, capacity: 16, attendees: 15, isJoined: false, category: 'workshop' },
    { id: 'e3', title: '周五读书会：《原则》', details: '每人分享一条对自己最有用的原则，轻松的讨论，有手冲咖啡。', location: '山丘烘焙', host: 'Monica', startDate: at(4, 19), durationMinutes: 120, capacity: 10, attendees: 6, isJoined: false, category: 'social' },
    { id: 'e4', title: '午间拉伸 & 冥想', details: '久坐救星。15 分钟拉伸 + 15 分钟正念呼吸。', location: '转角咖啡 · 露台', host: 'Lea', startDate: at(3, 12), durationMinutes: 30, capacity: 8, attendees: 8, isJoined: false, category: 'wellness' },
  ];

  const threads = [
    { id: 't1', title: '转角咖啡 · 今日在场', tint: 0, isGroup: true, unreadCount: 3, messages: [
      { senderName: 'Tom', text: '有人知道二楼的插座修好了吗？', isMine: false, sentAt: ago(40 * MIN) },
      { senderName: 'Alice', text: '修好啦，靠窗那排都能用', isMine: false, sentAt: ago(38 * MIN) },
      { senderName: 'Stephen', text: '下午 3 点一起休息吃蛋糕？🍰', isMine: false, sentAt: ago(10 * MIN) },
    ] },
    { id: 't2', title: 'Alice', tint: 0, isGroup: false, unreadCount: 1, messages: [
      { senderName: '我', text: '你的引导流程原型能给我看看吗？', isMine: true, sentAt: ago(3 * HOUR) },
      { senderName: 'Alice', text: '当然！下午番茄钟结束后给你演示 😊', isMine: false, sentAt: ago(2 * HOUR) },
    ] },
    { id: 't3', title: 'Jack', tint: 2, isGroup: false, unreadCount: 0, messages: [
      { senderName: 'Jack', text: '谢谢你昨天的建议，投资人很喜欢新的那页！', isMine: false, sentAt: ago(26 * HOUR) },
    ] },
  ];

  return { members, posts, events, threads, sessions: [] };
}

export const STATUS = {
  focusing: { label: '专注中', icon: 'headphones' },
  open: { label: '欢迎来聊', icon: 'hand-stop' },
  away: { label: '离开', icon: 'zzz' },
};

export const CATEGORY = {
  cowork: { label: '共享办公', icon: 'device-laptop', tint: 0 },
  workshop: { label: '工作坊', icon: 'bulb', tint: 2 },
  social: { label: '社交', icon: 'confetti', tint: 3 },
  wellness: { label: '身心', icon: 'leaf', tint: 1 },
};

export const ACHIEVEMENTS = [
  { id: 'first_visit', name: '初来乍到', detail: '在小世界里待满 1 分钟', icon: 'door-enter' },
  { id: 'chatterbox', name: '话痨观察员', detail: '见证 10 次 AI 对话', icon: 'messages' },
  { id: 'god_mode', name: '上帝视角', detail: '给角色下达一条指令', icon: 'sparkles' },
  { id: 'saver', name: '时光胶囊', detail: '保存一次存档', icon: 'archive' },
];

export const MOODS = ['☕️', '☀️', '🎉', '📖', '💡', '🔥', '😴', '🍰'];
