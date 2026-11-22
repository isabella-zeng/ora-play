// ORA web demo — a browser port of the SwiftUI app (ORA/ORA/Views).
// No framework: each screen is a function returning HTML; every tab keeps its
// own navigation stack, like SwiftUI's NavigationStack inside a TabView.

import { makeSampleData, STATUS, CATEGORY, ACHIEVEMENTS, MOODS } from './data.js';

// ---------- helpers ----------
const TINTS = ['--accent', '--matcha', '--honey', '--berry', '--sky', '--espresso'];
const tint = (i) => `var(${TINTS[Math.abs(i) % TINTS.length]})`;
const soft = (i, pct = 14) => `color-mix(in srgb, ${tint(i)} ${pct}%, transparent)`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (name, extra = '') => `<i class="ti ti-${name}" aria-hidden="true" ${extra}></i>`;
const pad2 = (n) => String(n).padStart(2, '0');
const hhmm = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

function rel(date) {
  const s = Math.round((Date.now() - date.getTime()) / 1000);
  if (s < 60) return '刚刚';
  if (s < 3600) return `${Math.floor(s / 60)}分钟前`;
  if (s < 86400) return `${Math.floor(s / 3600)}小时前`;
  return `${Math.floor(s / 86400)}天前`;
}
function dayTitle(d) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return '今天';
  if (diff === 1) return '明天';
  return `${d.getMonth() + 1}月${d.getDate()}日 ${WEEK[d.getDay()]}`;
}
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };

// ---------- state ----------
const ROOT_TITLES = { feed: '动态', members: '成员', events: '活动', chat: '聊天', play: '游戏' };
const state = {
  profile: null,
  ...makeSampleData(),
  tab: 'feed',
  stacks: { feed: [{ s: 'feed' }], members: [{ s: 'members' }], events: [{ s: 'events' }], chat: [{ s: 'chat' }], play: [{ s: 'play' }] },
  feedFilter: '全部',
  memberFilter: '全部',
  memberSearch: '',
  chatSearch: '',
  eventScope: 'upcoming',
  draft: '',
  newMessage: false,
};
const greeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return '早上好 ☀️';
  if (h >= 11 && h < 14) return '中午好 🥪';
  if (h >= 14 && h < 18) return '下午好 ☕️';
  return '晚上好 🌙';
};
const top = () => state.stacks[state.tab].at(-1);
const unread = () => state.threads.reduce((n, t) => n + t.unreadCount, 0);
const lastMsg = (t) => t.messages.at(-1);
const member = (id) => state.members.find((m) => m.id === id);
const eventById = (id) => state.events.find((e) => e.id === id);
const threadById = (id) => state.threads.find((t) => t.id === id);

// ---------- components ----------
function avatar(name, t, size = 44, online = false) {
  const dot = online ? `<span class="dot" style="width:${size * 0.28}px;height:${size * 0.28}px"></span>` : '';
  return `<span class="avatar" style="width:${size}px;height:${size}px;background:${soft(t, 18)};color:${tint(t)};font-size:${size * 0.42}px">${esc(name.slice(0, 1).toUpperCase())}${dot}</span>`;
}
function chip(text, { ic, color = 'var(--accent)', selected = false, act = '', data = '' } = {}) {
  const style = selected ? `background:${color};color:#fff` : `background:color-mix(in srgb, ${color} 12%, transparent);color:${color}`;
  const tag = act ? 'button' : 'span';
  return `<${tag} class="chip" style="${style}" ${act ? `data-act="${act}"` : ''} ${data}>${ic ? icon(ic) : ''}${esc(text)}</${tag}>`;
}
function filterBar(options, selected, act) {
  return `<div class="filterbar">${options.map((o) => chip(o, { selected: o === selected, act, data: `data-v="${esc(o)}"` })).join('')}</div>`;
}
const coinBadge = () => `<span class="coin" aria-label="咖啡豆 ${state.profile.coins} 个">${icon('coffee')}${state.profile.coins}</span>`;
function sectionHeader(title) { return `<div class="section-h"><div class="headline">${esc(title)}</div></div>`; }
function empty(ic, title, msg, action) {
  return `<div class="empty"><div class="icon">${icon(ic)}</div><div class="title">${esc(title)}</div><div class="muted body-t">${esc(msg)}</div>${action || ''}</div>`;
}
function navbar({ title, large = true, left = '', right = '' }) {
  const prev = state.stacks[state.tab].length > 1;
  const back = prev ? `<button class="nav-btn" data-act="back">${icon('chevron-left', 'style="font-size:26px"')}${esc(backLabel())}</button>` : left;
  return `<div class="navbar ${large ? 'has-large' : 'inline'}"><div class="nav-side">${back}</div><div class="nav-title">${esc(title || '')}</div><div class="nav-side right">${right}</div></div>${large ? `<h1 class="large-title">${esc(title)}</h1>` : ''}`;
}
function backLabel() {
  const st = state.stacks[state.tab];
  const prev = st.at(-2);
  if (!prev) return '';
  if (prev.s === 'member') return member(prev.id)?.name || '';
  return ROOT_TITLES[state.tab];
}
function capacityBar(e, color) {
  const full = e.attendees >= e.capacity && !e.isJoined;
  const pct = Math.min(100, (e.attendees / Math.max(e.capacity, 1)) * 100);
  return `<div style="display:flex;flex-direction:column;gap:4px">
    <div class="progress"><div style="width:${pct}%;background:${full ? 'var(--text-2)' : color}"></div></div>
    <div style="font-size:11px;color:${full ? 'var(--berry)' : 'var(--text-2)'}">${full ? '已满员' : `${e.attendees}/${e.capacity} 人 · 还剩 ${Math.max(0, e.capacity - e.attendees)} 位`}</div></div>`;
}

// ---------- screens ----------
const screens = {
  feed() {
    const p = state.profile;
    const hereNow = state.members.filter((m) => m.status !== 'away').sort((a, b) => a.name.localeCompare(b.name));
    const cafes = ['全部', ...[...new Set(state.posts.map((x) => x.cafe))].sort()];
    const posts = [...state.posts].sort((a, b) => b.createdAt - a.createdAt).filter((x) => state.feedFilter === '全部' || x.cafe === state.feedFilter);
    return navbar({ title: '动态', left: coinBadge(), right: `<button class="nav-btn right" data-act="compose" aria-label="发布动态">${icon('edit')}</button>` }) + `
    <div class="stack">
      <div class="px"><div class="caption-t">${greeting()}</div><div class="title">${esc(p.name)}，今天想在哪里工作？</div></div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="px">${sectionHeader(`此刻在场 · ${hereNow.length}`)}</div>
        <div class="strip">${hereNow.map((m) => `<button data-act="openMember" data-id="${m.id}" aria-label="${esc(m.name)}，${STATUS[m.status].label}，在${esc(m.cafe)}">
          ${avatar(m.name, m.tint, 56, true)}<span class="caption-t" style="color:var(--text)">${esc(m.name)}</span><span class="muted" style="font-size:11px">${icon(STATUS[m.status].icon)}</span></button>`).join('')}</div>
      </div>
      ${filterBar(cafes, state.feedFilter, 'feedFilter')}
      ${posts.length ? posts.map(postCard).join('') : empty('message-circle', '还没有动态', '分享你今天在做什么，让大家知道你在这里。', `<button class="btn-primary" style="max-width:220px" data-act="compose">发一条</button>`)}
    </div>`;
  },

  members() {
    const q = state.memberSearch.trim().toLowerCase();
    const f = state.memberFilter;
    const results = state.members.filter((m) => {
      const ok = f === '全部' || (f === '在线' && m.status !== 'away') || (f === '欢迎来聊' && m.status === 'open') || (f === '收藏' && m.isFavorite);
      if (!ok) return false;
      if (!q) return true;
      return m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.skills.some((s) => s.toLowerCase().includes(q));
    }).sort((a, b) => ((a.status === 'away') - (b.status === 'away')) || a.name.localeCompare(b.name));
    return navbar({ title: '成员' }) + `
    <div class="stack">
      <label class="search">${icon('search')}<input data-focus="memberSearch" data-input="memberSearch" placeholder="搜索名字、职业或技能" value="${esc(state.memberSearch)}"></label>
      ${filterBar(['全部', '在线', '欢迎来聊', '收藏'], f, 'memberFilter')}
      ${results.length ? `<div class="px" style="display:flex;flex-direction:column;gap:12px">${results.map(memberRow).join('')}</div>`
        : empty('user-question', '没有找到成员', q ? '试试搜索技能，例如“Swift”或“设计”。' : '换个筛选条件试试。')}
    </div>`;
  },

  member({ id }) {
    const m = member(id);
    const st = STATUS[m.status];
    const stColor = m.status === 'away' ? 'var(--text-2)' : 'var(--matcha)';
    return navbar({ title: '', large: false }) + `
    <div class="stack px" style="gap:24px;padding-bottom:32px">
      <div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding-top:8px">
        ${avatar(m.name, m.tint, 96, m.status !== 'away')}
        <div class="display">${esc(m.name)}</div>
        <div class="headline muted">${esc(m.role)}</div>
        <div class="row" style="gap:8px">${chip(st.label, { ic: st.icon, color: stColor })}${chip(m.cafe, { ic: 'map-pin' })}</div>
      </div>
      <div class="row">
        <button class="btn-primary" data-act="startChat" data-id="${m.id}">${icon('hand-stop')}打个招呼</button>
        <button class="btn-secondary" data-act="toggleFav" data-id="${m.id}">${icon(m.isFavorite ? 'star-filled' : 'star')}${m.isFavorite ? '已收藏' : '收藏'}</button>
      </div>
      <div class="card" style="display:flex;flex-direction:column;gap:12px">${sectionHeader('关于')}<div class="body-t">${esc(m.bio)}</div></div>
      <div class="card" style="display:flex;flex-direction:column;gap:12px">${sectionHeader('技能')}
        <div class="select-row">${m.skills.map((s, i) => chip(s, { color: tint(i + m.tint) })).join('')}</div></div>
    </div>`;
  },

  events() {
    const now = Date.now();
    let list = state.events.filter((e) => e.startDate.getTime() + e.durationMinutes * 60000 > now).sort((a, b) => a.startDate - b.startDate);
    if (state.eventScope === 'joined') list = list.filter((e) => e.isJoined);
    const groups = new Map();
    list.forEach((e) => { const k = startOfDay(e.startDate); groups.set(k, [...(groups.get(k) || []), e]); });
    const joined = state.eventScope === 'joined';
    return navbar({ title: '活动' }) + `
    <div class="stack">
      <div class="segmented" role="tablist">
        <button class="${!joined ? 'on' : ''}" data-act="scope" data-v="upcoming">即将开始</button>
        <button class="${joined ? 'on' : ''}" data-act="scope" data-v="joined">我报名的</button>
      </div>
      ${groups.size === 0 ? empty('calendar-plus', joined ? '还没有报名活动' : '近期没有活动', joined ? '去“即将开始”看看有什么感兴趣的吧。' : '过几天再来看看。',
        joined ? `<button class="btn-primary" style="max-width:220px" data-act="scope" data-v="upcoming">浏览活动</button>` : '') : ''}
      ${[...groups.entries()].map(([k, items]) => `<div class="px" style="display:flex;flex-direction:column;gap:12px">
        <div class="headline muted">${dayTitle(new Date(k))}</div>${items.map(eventCard).join('')}</div>`).join('')}
    </div>`;
  },

  event({ id }) {
    const e = eventById(id);
    const c = CATEGORY[e.category];
    const color = tint(c.tint);
    const full = e.attendees >= e.capacity && !e.isJoined;
    const d = e.startDate;
    const when = `${d.getMonth() + 1}月${d.getDate()}日 ${WEEK[d.getDay()].replace('星期', '周')} ${hhmm(d)}`;
    const label = e.isJoined ? '取消报名' : (full ? '已满员' : '报名参加 · +10 咖啡豆');
    return navbar({ title: '', large: false }) + `
    <div class="stack px" style="gap:24px;padding-bottom:110px">
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="width:80px;height:80px;border-radius:var(--r-m);background:${soft(c.tint)};color:${color};display:flex;align-items:center;justify-content:center;font-size:40px">${icon(c.icon)}</div>
        <div class="display">${esc(e.title)}</div>
        <div class="sub">由 ${esc(e.host)} 发起</div>
      </div>
      <div class="card" style="display:flex;flex-direction:column;gap:12px">
        <div class="row body-t">${icon('calendar', 'style="color:var(--accent)"')}${when}</div>
        <div class="row body-t">${icon('clock', 'style="color:var(--accent)"')}${e.durationMinutes} 分钟</div>
        <div class="row body-t">${icon('map-pin', 'style="color:var(--accent)"')}${esc(e.location)}</div>
        ${capacityBar(e, color)}
      </div>
      <div class="card" style="display:flex;flex-direction:column;gap:12px">${sectionHeader('活动介绍')}<div class="body-t">${esc(e.details)}</div></div>
    </div>
    <div class="bottom-bar"><button class="${e.isJoined ? 'btn-secondary' : 'btn-primary'}" data-act="toggleJoin" data-id="${e.id}" ${full ? 'disabled' : ''}>${icon(e.isJoined ? 'circle-x' : 'circle-check')}${label}</button></div>`;
  },

  chat() {
    const q = state.chatSearch.trim().toLowerCase();
    const list = state.threads.filter((t) => !q || t.title.toLowerCase().includes(q))
      .sort((a, b) => (lastMsg(b)?.sentAt || 0) - (lastMsg(a)?.sentAt || 0));
    return navbar({ title: '聊天' }) + `
    <div class="stack">
      <label class="search">${icon('search')}<input data-focus="chatSearch" data-input="chatSearch" placeholder="搜索对话" value="${esc(state.chatSearch)}"></label>
      ${state.threads.length === 0 ? empty('messages', '还没有对话', '在成员页面给感兴趣的人打个招呼吧。') :
        `<div class="thread-list">${list.map(threadRow).join('')}</div>`}
    </div>`;
  },

  thread({ id }) {
    const t = threadById(id);
    const msgs = t.messages;
    const bubbles = msgs.map((m, i) => {
      const showName = t.isGroup && !m.isMine && (i === 0 || msgs[i - 1].senderName !== m.senderName);
      const isNew = state.newMessage && i === msgs.length - 1;
      return `<div class="bubble-wrap ${m.isMine ? 'mine' : ''} ${isNew ? 'new' : ''}">
        ${showName ? `<div class="muted" style="font-size:11px;font-weight:600;padding:0 4px">${esc(m.senderName)}</div>` : ''}
        <div class="bubble">${esc(m.text)}</div>
        <div class="muted" style="font-size:11px;padding:0 4px">${hhmm(m.sentAt)}</div></div>`;
    }).join('');
    const can = state.draft.trim().length > 0;
    return navbar({ title: t.title, large: false }) + `
    <div class="bubbles">${msgs.length ? bubbles : empty('hand-stop', '打个招呼吧', `和 ${t.title} 的对话从这里开始。`)}</div>
    <form class="composer" data-submit="send" data-id="${t.id}">
      <input data-focus="draft" data-input="draft" placeholder="发消息…" value="${esc(state.draft)}" autocomplete="off">
      <button class="send ${can ? 'on' : ''}" aria-label="发送">${icon('arrow-up')}</button>
    </form>`;
  },

  play() {
    const p = state.profile;
    const minutes = Math.floor(state.sessions.reduce((n, s) => n + s.durationSeconds, 0) / 60);
    return navbar({ title: '游戏', right: coinBadge() }) + `
    <div class="stack px" style="gap:24px">
      <div class="feature">
        <div class="hero" style="background-image:url(assets/office.jpg)" role="img" aria-label="游戏截图：像素风办公室里的 AI 角色">${chip('AI 沙盒', { ic: 'cpu', color: '#fff' })}</div>
        <div style="padding:16px;display:flex;flex-direction:column;gap:12px">
          <div class="title">盒中小世界</div>
          <div class="sub">8 位拥有记忆和性格的 AI 小人在办公室里工作、聊天、建立关系。你是观察者，也可以是上帝。</div>
          <button class="btn-primary" data-act="playGame" style="margin-top:4px">${icon('player-play-filled')}进入小世界</button>
          <div class="muted" style="font-size:11px;text-align:center">每玩 1 分钟 +1 咖啡豆，单次最多 30 颗</div>
        </div>
      </div>
      <div class="stats">
        ${stat(p.coins, '咖啡豆', 'coffee', 'var(--honey)')}
        ${stat(minutes, '游戏分钟', 'clock-filled', 'var(--sky)')}
        ${stat(`${p.achievements.length}/${ACHIEVEMENTS.length}`, '成就', 'trophy', 'var(--berry)')}
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">${sectionHeader('成就')}
        <div class="grid2">${ACHIEVEMENTS.map((a) => {
          const on = p.achievements.includes(a.id);
          return `<div class="card compact" style="display:flex;flex-direction:column;gap:6px;opacity:${on ? 1 : 0.75}">
            <span style="font-size:22px;color:${on ? 'var(--honey)' : 'color-mix(in srgb, var(--text-2) 60%, transparent)'}">${icon(on ? a.icon : 'lock')}</span>
            <div class="headline" style="color:${on ? 'var(--text)' : 'var(--text-2)'}">${a.name}</div>
            <div class="muted" style="font-size:11px;min-height:28px">${a.detail}</div></div>`;
        }).join('')}</div></div>
      <div style="display:flex;flex-direction:column;gap:12px;padding-bottom:8px">${sectionHeader('最近游玩')}
        ${state.sessions.length === 0 ? `<div class="card sub">还没有游玩记录，进去看看 AI 小人们在忙什么吧。</div>` :
          `<div class="card" style="padding-top:6px;padding-bottom:6px">${state.sessions.slice(0, 5).map((s, i) => `
            <div class="row" style="padding:8px 0;${i ? 'border-top:.5px solid var(--divider)' : ''}">
              <div><div class="headline">${s.gameName}</div><div class="caption-t">${rel(s.startedAt)} · ${Math.max(1, Math.floor(s.durationSeconds / 60))} 分钟</div></div>
              <div class="spacer"></div><b style="font-family:var(--font);color:var(--honey)">+${s.coinsEarned}</b></div>`).join('')}</div>`}
      </div>
    </div>`;
  },
};

function postCard(x) {
  return `<article class="card post" style="margin:0 16px;display:flex;flex-direction:column;gap:12px">
    <div class="row">${avatar(x.authorName, x.authorTint, 40)}
      <div style="display:flex;flex-direction:column;gap:2px"><div class="headline">${esc(x.authorName)}</div>
      <div class="caption-t">${icon('map-pin')} ${esc(x.cafe)} · ${rel(x.createdAt)}</div></div>
      <div class="spacer"></div><span style="font-size:24px" aria-hidden="true">${x.mood}</span></div>
    <div class="body-t">${esc(x.text)}</div>
    <div class="actions">
      <button class="${x.isLiked ? 'liked' : ''}" data-act="like" data-id="${x.id}" aria-label="${x.isLiked ? '取消点赞' : '点赞'}，${x.likes} 个赞">${icon(x.isLiked ? 'heart-filled' : 'heart')}${x.likes}</button>
      <span aria-label="${x.commentCount} 条评论">${icon('message-circle')}${x.commentCount}</span>
      <div class="spacer"></div>
      ${x.authorName === state.profile.name && x.mine ? `<button data-act="deletePost" data-id="${x.id}" aria-label="删除">${icon('trash')}</button>` : ''}
      <button data-act="share" data-id="${x.id}" aria-label="分享">${icon('share-2')}</button>
    </div></article>`;
}
function memberRow(m) {
  const st = STATUS[m.status];
  return `<button class="card compact member-row row" data-act="openMember" data-id="${m.id}">
    ${avatar(m.name, m.tint, 52, m.status !== 'away')}
    <div style="display:flex;flex-direction:column;gap:4px;min-width:0">
      <div class="row" style="gap:6px"><span class="headline">${esc(m.name)}</span>${m.isFavorite ? `<span style="color:var(--honey);font-size:12px">${icon('star-filled')}</span>` : ''}</div>
      <div class="sub">${esc(m.role)}</div>
      <div class="row" style="gap:6px">${chip(st.label, { ic: st.icon, color: m.status === 'away' ? 'var(--text-2)' : 'var(--matcha)' })}<span class="caption-t">${esc(m.cafe)}</span></div>
    </div><div class="spacer"></div><span class="muted" style="opacity:.6">${icon('chevron-right')}</span></button>`;
}
function eventCard(e) {
  const c = CATEGORY[e.category];
  const color = tint(c.tint);
  return `<button class="card compact row" style="align-items:flex-start;text-align:left;width:100%;position:relative" data-act="openEvent" data-id="${e.id}">
    <div class="ev-time" style="background:${soft(c.tint)};color:${color}"><div class="headline" style="font-variant-numeric:tabular-nums">${hhmm(e.startDate)}</div><div style="font-size:11px;color:var(--text-2)">${e.durationMinutes} 分钟</div></div>
    <div style="display:flex;flex-direction:column;gap:6px;flex:1;align-items:flex-start">
      ${chip(c.label, { ic: c.icon, color })}
      <div class="headline">${esc(e.title)}</div>
      <div class="sub">${icon('map-pin')} ${esc(e.location)}</div>
      <div style="align-self:stretch">${capacityBar(e, color)}</div>
    </div>
    ${e.isJoined ? `<span style="position:absolute;top:12px;right:12px;color:var(--matcha);font-size:22px" aria-label="已报名">${icon('circle-check-filled')}</span>` : ''}
  </button>`;
}
function threadRow(t) {
  const last = lastMsg(t);
  const preview = last ? (last.isMine ? '我：' : (t.isGroup ? `${last.senderName}：` : '')) + last.text : '说点什么吧 👋';
  const av = t.isGroup
    ? `<span class="avatar" style="width:48px;height:48px;background:${soft(t.tint, 16)};color:${tint(t.tint)};font-size:20px">${icon('users-group')}</span>`
    : avatar(t.title, t.tint, 48);
  return `<button class="thread-row" data-act="openThread" data-id="${t.id}">${av}
    <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">
      <div class="row" style="gap:8px"><span class="headline" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.title)}</span><div class="spacer"></div>
        ${last ? `<span class="muted" style="font-size:11px;white-space:nowrap">${rel(last.sentAt)}</span>` : ''}</div>
      <div class="row" style="gap:8px"><span style="font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${t.unreadCount ? 'var(--text)' : 'var(--text-2)'}">${esc(preview)}</span><div class="spacer"></div>
        ${t.unreadCount ? `<span class="badge">${t.unreadCount}</span>` : ''}</div>
    </div></button>`;
}
function stat(value, label, ic, color) {
  return `<div class="card compact stat"><span style="color:${color};font-size:20px">${icon(ic)}</span><b>${value}</b><span class="muted" style="font-size:11px">${label}</span></div>`;
}

// ---------- rendering ----------
const $ = (sel, root = document) => root.querySelector(sel);
const screenRoot = $('#screen');
let tabContent, tabbar;

// A view = a scrolling area + pinned overlays (bottom bar, composer) that
// must not scroll with the content.
const scroller = (view) => view?.querySelector('.scroller');
function fillView(view) {
  const entry = top();
  view.innerHTML = `<div class="scroller">${screens[entry.s](entry)}</div>`;
  view.querySelectorAll('.scroller > .bottom-bar, .scroller > .composer').forEach((el) => view.appendChild(el));
  const sc = scroller(view);
  sc.addEventListener('scroll', () => view.classList.toggle('scrolled', sc.scrollTop > 8), { passive: true });
}
function renderView(anim = '') {
  const view = document.createElement('div');
  view.className = `view ${anim}`;
  fillView(view);
  return view;
}

/** Navigate: replace the visible view, with a push/pop/fade animation. */
function show(anim) {
  const old = tabContent.querySelector('.view:last-child');
  const view = renderView(anim);
  if (anim === 'pop-in' && old) {
    // Slide the old view out over the new one.
    tabContent.insertBefore(view, old);
    old.style.transition = 'transform .38s cubic-bezier(.2,.8,.2,1)';
    old.style.zIndex = 3;
    requestAnimationFrame(() => { old.style.transform = 'translateX(100%)'; });
    setTimeout(() => old.remove(), 400);
  } else {
    tabContent.appendChild(view);
    if (old) setTimeout(() => old.remove(), anim === 'push-in' ? 420 : 0);
  }
  const sc = scroller(view);
  if (top().scroll) sc.scrollTop = top().scroll;
  if (top().s === 'thread') sc.scrollTop = sc.scrollHeight;
  view.classList.toggle('scrolled', sc.scrollTop > 8);
  updateTabbar();
}

/** Re-render the current view in place, keeping scroll and focused input. */
function refresh() {
  const old = tabContent.querySelector('.view:last-child');
  if (!old) return show('');
  const scroll = scroller(old).scrollTop;
  const focused = document.activeElement?.dataset?.focus;
  const caret = document.activeElement?.selectionStart;
  fillView(old);
  scroller(old).scrollTop = scroll;
  old.classList.toggle('scrolled', scroll > 8);
  if (focused) {
    const el = old.querySelector(`[data-focus="${focused}"]`);
    if (el) { el.focus(); try { el.setSelectionRange(caret, caret); } catch {} }
  }
  updateTabbar();
}

function push(entry) {
  const cur = tabContent.querySelector('.view:last-child');
  if (cur) top().scroll = scroller(cur).scrollTop;
  state.stacks[state.tab].push(entry);
  show('push-in');
}
function back() {
  const st = state.stacks[state.tab];
  if (st.length < 2) return;
  st.pop();
  state.draft = '';
  show('pop-in');
}

function updateTabbar() {
  tabbar.classList.toggle('hidden', top().s === 'thread');
  tabbar.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.tab === state.tab));
  const n = unread();
  const badge = tabbar.querySelector('[data-tab="chat"] .badge');
  badge.textContent = n;
  badge.style.display = n ? '' : 'none';
}

function bumpCoins() {
  requestAnimationFrame(() => document.querySelectorAll('.coin').forEach((c) => {
    c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
  }));
}

let toastTimer;
function toast(text) {
  $('.toast', screenRoot)?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  screenRoot.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 2500);
}

// ---------- actions ----------
const actions = {
  back,
  tab({ tab }) {
    if (tab === state.tab) {
      // Tapping the active tab pops to root, like iOS.
      if (state.stacks[tab].length > 1) { state.stacks[tab] = [state.stacks[tab][0]]; show('pop-in'); }
      return;
    }
    const cur = tabContent.querySelector('.view:last-child');
    if (cur) top().scroll = scroller(cur).scrollTop;
    state.tab = tab;
    show('fade-in');
  },
  feedFilter({ v }) { state.feedFilter = v; refresh(); },
  memberFilter({ v }) { state.memberFilter = v; refresh(); },
  scope({ v }) { state.eventScope = v; refresh(); },
  openMember({ id }) { push({ s: 'member', id }); },
  openEvent({ id }) { push({ s: 'event', id }); },
  openThread({ id }) {
    const t = threadById(id);
    t.unreadCount = 0;
    state.draft = '';
    push({ s: 'thread', id });
  },
  like({ id }) {
    const p = state.posts.find((x) => x.id === id);
    p.isLiked = !p.isLiked;
    p.likes += p.isLiked ? 1 : -1;
    refresh();
  },
  deletePost({ id }) {
    state.posts = state.posts.filter((x) => x.id !== id);
    refresh();
  },
  async share({ id }) {
    const p = state.posts.find((x) => x.id === id);
    const text = `${p.authorName} 在 ${p.cafe}：${p.text}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); toast('已复制到剪贴板'); }
    } catch { /* user cancelled */ }
  },
  toggleFav({ id }) { const m = member(id); m.isFavorite = !m.isFavorite; refresh(); },
  startChat({ id }) {
    const m = member(id);
    let t = state.threads.find((x) => !x.isGroup && x.title === m.name);
    if (!t) { t = { id: `t${Date.now()}`, title: m.name, tint: m.tint, isGroup: false, unreadCount: 0, messages: [] }; state.threads.push(t); }
    actions.openThread({ id: t.id });
  },
  toggleJoin({ id }) {
    const e = eventById(id);
    const p = state.profile;
    if (e.isJoined) { e.isJoined = false; e.attendees = Math.max(0, e.attendees - 1); p.coins = Math.max(0, p.coins - 10); }
    else if (e.attendees < e.capacity) { e.isJoined = true; e.attendees += 1; p.coins += 10; toast('报名成功 · +10 咖啡豆'); bumpCoins(); }
    refresh();
  },
  compose: openCompose,
  playGame: openGame,
};
const inputs = {
  memberSearch(v) { state.memberSearch = v; refresh(); },
  chatSearch(v) { state.chatSearch = v; refresh(); },
  draft(v) {
    state.draft = v;
    // Only the send button depends on the draft — avoid re-rendering the thread.
    $('.send', tabContent)?.classList.toggle('on', v.trim().length > 0);
  },
};
function send({ id }) {
  const text = state.draft.trim();
  if (!text) return;
  threadById(id).messages.push({ senderName: '我', text, isMine: true, sentAt: new Date() });
  state.draft = '';
  state.newMessage = true;
  refresh();
  state.newMessage = false;
  const v = tabContent.querySelector('.view:last-child');
  scroller(v).scrollTo({ top: scroller(v).scrollHeight, behavior: 'smooth' });
  $('[data-focus="draft"]', v)?.focus();
}

// ---------- compose sheet ----------
function openCompose() {
  const cafes = [...new Set(state.posts.map((x) => x.cafe))].sort();
  const s = { text: '', mood: '☕️', cafe: cafes[0] || '转角咖啡' };
  const LIMIT = 280;
  const backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop';
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-label', '新动态');
  const draw = () => {
    const ok = s.text.trim() && s.text.length <= LIMIT;
    sheet.innerHTML = `
      <div class="sheet-nav"><button data-sheet="cancel">取消</button><div class="headline">新动态</div><button data-sheet="post" style="font-weight:600" ${ok ? '' : 'disabled'}>发布</button></div>
      <div style="overflow-y:auto;flex:1;padding-bottom:30px">
        <div class="form-group"><textarea placeholder="此刻在做什么？" maxlength="400">${esc(s.text)}</textarea>
          <div class="caption-t" style="text-align:right;color:${s.text.length > LIMIT ? 'var(--berry)' : 'var(--text-2)'}" data-count>${s.text.length}/${LIMIT}</div></div>
        <div class="form-label">心情</div>
        <div class="form-group"><div class="filterbar" style="padding:0">${MOODS.map((m) => `<button class="mood ${m === s.mood ? 'on' : ''}" data-mood="${m}">${m}</button>`).join('')}</div></div>
        <div class="form-label">地点</div>
        <div class="form-group"><div class="select-row">${cafes.map((c) => chip(c, { selected: c === s.cafe, data: `data-cafe="${esc(c)}"`, act: 'noop' })).join('')}</div></div>
        <div class="form-group" style="margin-top:24px;color:var(--honey)" ><span class="caption-t" style="color:var(--honey)">${icon('coffee')} 发布可获得 5 颗咖啡豆</span></div>
      </div>`;
  };
  draw();
  const close = () => {
    sheet.classList.add('closing');
    backdrop.style.transition = 'opacity .3s'; backdrop.style.opacity = 0;
    setTimeout(() => { sheet.remove(); backdrop.remove(); }, 300);
  };
  sheet.addEventListener('input', (e) => {
    if (e.target.tagName !== 'TEXTAREA') return;
    s.text = e.target.value;
    const ok = s.text.trim() && s.text.length <= LIMIT;
    sheet.querySelector('[data-sheet="post"]').disabled = !ok;
    const cnt = sheet.querySelector('[data-count]');
    cnt.textContent = `${s.text.length}/${LIMIT}`;
    cnt.style.color = s.text.length > LIMIT ? 'var(--berry)' : 'var(--text-2)';
  });
  sheet.addEventListener('click', (e) => {
    e.stopPropagation();
    const t = e.target.closest('[data-sheet],[data-mood],[data-cafe]');
    if (!t) return;
    if (t.dataset.mood) { s.mood = t.dataset.mood; draw(); sheet.querySelector('textarea').focus(); return; }
    if (t.dataset.cafe) { s.cafe = t.dataset.cafe; draw(); return; }
    if (t.dataset.sheet === 'cancel') return close();
    if (t.dataset.sheet === 'post') {
      state.posts.unshift({ id: `p${Date.now()}`, authorName: state.profile.name, authorTint: 0, cafe: s.cafe, text: s.text.trim(), mood: s.mood, likes: 0, isLiked: false, commentCount: 0, createdAt: new Date(), mine: true });
      state.profile.coins += 5;
      state.feedFilter = '全部';
      close();
      refresh();
      toast('已发布 · +5 咖啡豆');
      bumpCoins();
      scroller(tabContent.querySelector('.view:last-child'))?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  backdrop.addEventListener('click', close);
  screenRoot.append(backdrop, sheet);
  setTimeout(() => sheet.querySelector('textarea')?.focus(), 350);
}

// ---------- game (Godot web export in an iframe) ----------
// The iOS app hosts the same export in a WKWebView. IOSBridge.gd posts events to
// window.webkit.messageHandlers.godotBridge and listens on window.oraReceive,
// so we provide the same interface inside the iframe.
const GAME_URL = 'game/microverse.html';
const MAX_PLAY_REWARD = 30;

async function openGame() {
  const device = $('.device');
  const framed = getComputedStyle(device).borderRadius !== '0px';
  const g = document.createElement('div');
  g.className = 'game';
  g.innerHTML = `
    <div class="cover" style="background-image:url(assets/office.jpg)">
      <div class="spinner"></div><div class="headline">正在打开盒中小世界…</div>
      <div class="caption-t" style="color:rgba(255,255,255,.7)">首次加载约 45 MB，需要十几秒</div></div>
    <div class="pill"><button data-game="close" aria-label="退出游戏">${icon('x')}</button><span data-coins>${icon('coffee')} ${state.profile.coins}</span></div>`;
  screenRoot.appendChild(g);
  if (framed) device.classList.add('landscape');

  const session = { startedAt: new Date(), coins: 0, done: false };
  const setCoins = () => { g.querySelector('[data-coins]').innerHTML = `${icon('coffee')} ${state.profile.coins}`; };
  const reveal = () => g.classList.add('ready');
  const gameToast = (text) => toast(text);

  const close = () => {
    if (session.done) return;
    session.done = true;
    const seconds = Math.round((Date.now() - session.startedAt) / 1000);
    const playReward = Math.min(Math.floor(seconds / 60), MAX_PLAY_REWARD);
    state.profile.coins += playReward;
    state.sessions.unshift({ gameName: '盒中小世界', startedAt: session.startedAt, durationSeconds: seconds, coinsEarned: session.coins + playReward });
    if (seconds >= 60 && !state.profile.achievements.includes('first_visit')) state.profile.achievements.push('first_visit');
    device.classList.remove('landscape');
    g.style.transition = 'opacity .3s'; g.style.opacity = 0;
    setTimeout(() => { g.remove(); refresh(); }, 300);
  };
  g.addEventListener('click', (e) => { if (e.target.closest('[data-game="close"]')) close(); });

  const onMessage = (raw) => {
    let msg; try { msg = JSON.parse(raw); } catch { return; }
    const d = msg.data || {};
    switch (msg.event) {
      case 'game_ready': {
        const payload = JSON.stringify({ user_id: 'web-demo', username: state.profile.name, coins: state.profile.coins });
        try { iframe.contentWindow.oraReceive?.(payload); } catch {}
        reveal();
        break;
      }
      case 'coins_awarded':
        state.profile.coins += d.amount || 0; session.coins += d.amount || 0; setCoins();
        gameToast(`+${d.amount} 咖啡豆${d.reason ? ` · ${d.reason}` : ''}`);
        break;
      case 'coins_updated': state.profile.coins = Math.max(0, d.coins || 0); setCoins(); break;
      case 'achievement_unlocked':
        if (d.achievement_id && !state.profile.achievements.includes(d.achievement_id)) {
          state.profile.achievements.push(d.achievement_id);
          gameToast(`🏆 解锁成就：${d.achievement_name || d.achievement_id}`);
        }
        break;
      case 'close_game_requested': close(); break;
    }
  };

  // Check the export is there before loading (it's copied by scripts/build_web_demo.sh).
  const exists = await fetch('game/microverse.wasm', { method: 'HEAD' }).then((r) => r.ok).catch(() => false);
  if (!exists) {
    g.querySelector('.cover').innerHTML = `<div class="headline">游戏资源未打包</div>
      <div class="err">请先运行 <code>scripts/build_web_demo.sh</code>，把 Godot 的 Web 导出复制到 web-demo/game/。</div>`;
    return;
  }

  // Wait for the rotation to finish so Godot reads the landscape canvas size.
  await new Promise((r) => setTimeout(r, framed ? 650 : 0));
  if (session.done) return;
  const iframe = document.createElement('iframe');
  iframe.title = '盒中小世界';
  iframe.allow = 'autoplay; fullscreen; gamepad';
  iframe.addEventListener('load', () => {
    try {
      iframe.contentWindow.webkit = { messageHandlers: { godotBridge: { postMessage: (raw) => onMessage(String(raw)) } } };
    } catch { /* cross-origin: bridge unavailable, game still plays */ }
  });
  iframe.src = GAME_URL;
  g.prepend(iframe);
  // If the bridge never reports ready, reveal anyway (same as the iOS app).
  setTimeout(reveal, 20000);
}

// ---------- onboarding ----------
const OB_PAGES = [
  { icon: 'coffee', tint: 0, title: '欢迎来到 ORA', msg: '在你喜欢的咖啡馆，和一群同样在认真生活的人一起工作。' },
  { icon: 'users', tint: 1, title: '看见身边的伙伴', msg: '看看谁正在专注、谁欢迎来聊，找到合作者和朋友。' },
  { icon: 'device-gamepad-2', tint: 2, title: '休息一下，玩一会', msg: '在盒中小世界里观察 AI 小人的办公室生活，赚取咖啡豆。' },
];
function showOnboarding() {
  let page = 0;
  let name = '';
  const el = document.createElement('div');
  el.className = 'onboarding';
  el.innerHTML = `
    <button class="ob-skip" data-ob="skip">跳过</button>
    <div class="ob-pages">
      ${OB_PAGES.map((p) => `<div class="ob-page">
        <div class="ob-icon" style="background:${soft(p.tint)};color:${tint(p.tint)}">${icon(p.icon)}</div>
        <div style="display:flex;flex-direction:column;gap:12px"><div class="display" style="font-size:30px">${p.title}</div><div class="body-t muted">${p.msg}</div></div></div>`).join('')}
      <div class="ob-page ob-form">
        <div class="display" style="font-size:30px">怎么称呼你？</div>
        <div class="body-t muted">这会显示在你的动态和聊天里，之后可以修改。</div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <input data-ob-name placeholder="你的名字" maxlength="20" autocomplete="nickname">
          <input data-ob-headline placeholder="一句话介绍（可选），例如：独立开发者" maxlength="40"></div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px;padding:0 24px 34px">
      <div class="dots">${[0, 1, 2, 3].map(() => '<span></span>').join('')}</div>
      <button class="btn-primary" data-ob="next">继续</button>
    </div>`;
  screenRoot.appendChild(el);
  const pages = [...el.querySelectorAll('.ob-page')];
  const btn = el.querySelector('[data-ob="next"]');
  const nameInput = el.querySelector('[data-ob-name]');
  const draw = () => {
    pages.forEach((p, i) => {
      p.classList.toggle('current', i === page);
      p.style.transform = `translateX(${(i - page) * 100}%)`;
      p.style.opacity = i === page ? 1 : 0;
    });
    el.querySelectorAll('.dots span').forEach((d, i) => d.classList.toggle('on', i === page));
    const last = page === OB_PAGES.length;
    btn.textContent = last ? '开始使用' : '继续';
    btn.disabled = last && !name.trim();
    el.querySelector('.ob-skip').style.visibility = last ? 'hidden' : '';
  };
  const finish = (n) => {
    state.profile = { name: n, headline: el.querySelector('[data-ob-headline]').value.trim(), coins: 120, achievements: [] };
    startApp();
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 400);
  };
  const next = () => {
    if (page === OB_PAGES.length) { if (name.trim()) finish(name.trim()); return; }
    page += 1; draw();
    if (page === OB_PAGES.length) setTimeout(() => nameInput.focus(), 450);
  };
  el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-ob]');
    if (!t) return;
    if (t.dataset.ob === 'skip') { page = OB_PAGES.length; draw(); setTimeout(() => nameInput.focus(), 450); }
    else next();
  });
  nameInput.addEventListener('input', () => { name = nameInput.value; draw(); });
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter') next(); });
  // Swipe between intro pages
  let sx = null;
  el.addEventListener('pointerdown', (e) => { sx = e.clientX; });
  el.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0 && page < OB_PAGES.length) next();
    if (dx > 0 && page > 0) { page -= 1; draw(); }
  });
  draw();
}

// ---------- boot ----------
function startApp() {
  screenRoot.querySelector('.app')?.remove();
  const app = document.createElement('div');
  app.className = 'app';
  const tabs = [['feed', '动态', 'coffee'], ['members', '成员', 'users'], ['events', '活动', 'calendar'], ['chat', '聊天', 'messages'], ['play', '游戏', 'device-gamepad-2']];
  app.innerHTML = `<div class="tab-content"></div>
    <nav class="tabbar">${tabs.map(([k, l, i]) => `<button data-act="tab" data-tab="${k}">${icon(i)}<span>${l}</span>${k === 'chat' ? '<span class="badge"></span>' : ''}</button>`).join('')}</nav>`;
  screenRoot.prepend(app);
  tabContent = $('.tab-content', app);
  tabbar = $('.tabbar', app);

  app.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]');
    if (!t || !actions[t.dataset.act]) return;
    e.preventDefault();
    actions[t.dataset.act]({ ...t.dataset });
  });
  app.addEventListener('input', (e) => {
    const k = e.target.dataset.input;
    if (k && inputs[k]) inputs[k](e.target.value);
  });
  app.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-submit]');
    if (!f) return;
    e.preventDefault();
    send({ ...f.dataset });
  });
  show('');
}

if (new URLSearchParams(location.search).has('embed')) document.body.classList.add('embed');
document.querySelector('.statusbar .time').textContent = '9:41';
if (new URLSearchParams(location.search).has('skip')) {
  state.profile = { name: '访客', headline: '', coins: 120, achievements: [] };
  startApp();
} else {
  showOnboarding();
}

// Back gesture: Escape / browser-style edge swipe isn't available in a frame, so support Esc.
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && tabContent && document.activeElement?.tagName !== 'INPUT') back(); });
