/* =========================================================================
   未济 · 个人成长工作台   |  中国人民大学视觉体系
   明道（学业备考） + 集义（日常成长）
   纯前端 · 本地永久存储 · 每日自动更新 · 多端适配
   ========================================================================= */
'use strict';

/* ---------- 1. 日期与工具 ---------- */
const pad = n => String(n).padStart(2, '0');
function fmtDate(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function parseDate(s){ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
function todayStr(){ return fmtDate(new Date()); }
function addDays(s,n){ const d=parseDate(s); d.setDate(d.getDate()+n); return fmtDate(d); }
function weekdayOf(s){ return parseDate(s).getDay(); }              // 0=周日
function daysBetween(a,b){ return Math.round((parseDate(b)-parseDate(a))/86400000); }
function monthKey(s){ return s.slice(0,7); }
function weekKeyOf(s){ return addDays(s, -weekdayOf(s)); }          // 该周周日
function isMonthEnd(s){ return monthKey(addDays(s,1)) !== monthKey(s); }
const WD_CN = ['周日','周一','周二','周三','周四','周五','周六'];
const CN_DATE = s => { const d=parseDate(s); return `${d.getMonth()+1}月${d.getDate()}日 ${WD_CN[d.getDay()]}`; };
function escapeHTML(t){ return (t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ---------- 2. 计划总配置 ---------- */
const PLAN = {
  start:   '2026-08-08',   // 明日起
  p1End:   '2027-01-15',   // 第一阶段：综合夯实
  p2Start: '2027-01-16',   // 第二阶段：法硕专项冲刺
  p2End:   '2027-12-30',
  restWeekday: 0,          // 每周固定休息日（周日）
};
function phaseOf(s){
  if(s < PLAN.start) return 'pre';
  if(s <= PLAN.p1End) return 'p1';
  if(s <= PLAN.p2End) return 'p2';
  return 'done';
}
function phaseLabel(s){
  return {pre:'尚未开始',p1:'第一阶段 · 综合夯实',p2:'第二阶段 · 法硕专项冲刺',done:'备考周期已完成'}[phaseOf(s)];
}

/* 政治梯度时长（第二阶段） */
function politicsHours(s){
  if(s < '2027-04-01') return 1;      // 4月前 1h
  if(s <= '2027-08-31') return 2;     // 4月至8月 2h
  return 3;                           // 8月之后 3h
}
/* 专业课内容与时长（第二阶段） */
function zhuanyeItems(s){
  const remain = 14 - 3 - politicsHours(s);   // 总14 - 英语3 - 政治
  const SUBS = ['刑法','民法','法理学','宪法学','法制史'];
  // 4月15日前：分科独立学习（先法律基础，后法律综合）
  if(s <= '2027-04-14'){
    if(s <= '2027-03-01') return [{n:'法律基础 学习', h:remain}];
    return [{n:'法律综合 学习', h:remain}];
  }
  // 4月15日—6月15日：五科集中背诵 + 已背诵科目穿插复盘
  if(s <= '2027-06-15'){
    const total = daysBetween('2027-04-15','2027-06-15')+1;
    const per = Math.ceil(total/5);
    const idx = Math.min(4, Math.floor(daysBetween('2027-04-15',s)/per));
    const cur = SUBS[idx];
    if(idx > 0) return [
      {n:`${cur} 背诵`, h:Math.max(1,remain-1)},
      {n:`${SUBS.slice(0,idx).join('、')} 复盘`, h:1},
    ];
    return [{n:`${cur} 背诵`, h:remain}];
  }
  // 6月16—19日：过渡综合复盘
  if(s <= '2027-06-19') return [{n:'专业课 综合复盘', h:remain}];
  // 6月20日后：葫芦丝背书法（保留法律基础/法律综合组合逻辑，滚动叠加）
  const idx = daysBetween('2027-06-20', s) % 5;
  return [{n:`${SUBS[idx]} 背诵（葫芦丝背书法 · 滚动叠加）`, h:remain}];
}

/* 生成某日明道任务 */
function mingdaoTasks(s){
  const ph = phaseOf(s);
  if(ph==='pre')  return {rest:false, note:`备考自 ${CN_DATE(PLAN.start)} 正式开启`, tasks:[]};
  if(ph==='done') return {rest:false, note:'备考周期已圆满完成，未济而终有济。', tasks:[]};
  // 每周固定休息日
  if(weekdayOf(s)===PLAN.restWeekday){
    return {rest:true, note:'每周固定休息日 · 张弛有度', tasks:[
      {id:'week_sum', name:'每周总结', cat:'复盘', h:0, type:'week'},
    ]};
  }
  let tasks=[];
  if(ph==='p1'){
    tasks=[
      {id:'en', name:'英语 学习', cat:'英语', h:2},
      {id:'fs', name:'法硕 学习', cat:'法硕', h:3},
      {id:'pd', name:'判断推理 学习', cat:'公考', h:0.75},
      {id:'sl', name:'数量关系 学习', cat:'公考', h:0.75},
      {id:'zl', name:'资料分析 学习', cat:'公考', h:0.75},
      {id:'sw', name:'申论 学习', cat:'公考', h:0.75},
    ];
  } else { // p2
    tasks=[
      {id:'en',  name:'英语 学习', cat:'英语', h:3},
      {id:'pol', name:'政治 学习', cat:'政治', h:politicsHours(s)},
    ];
    zhuanyeItems(s).forEach((it,i)=> tasks.push({id:'zy'+i, name:it.n, cat:'专业课', h:it.h}));
  }
  tasks.push({id:'rev_prev', name:'回看昨日复盘', cat:'复盘', h:0, type:'review-view'});
  tasks.push({id:'rev_day',  name:'当日学习复盘', cat:'复盘', h:0, type:'day'});
  if(isMonthEnd(s)) tasks.push({id:'month_sum', name:'每月总结', cat:'复盘', h:0, type:'month'});
  return {rest:false, note:phaseLabel(s), tasks};
}
function studyHours(s){
  const {rest,tasks}=mingdaoTasks(s);
  if(rest) return 0;
  return tasks.reduce((a,t)=>a+(t.h||0),0);
}

/* ---------- 3. 集义 · 健身计划（每周4练，每天两个部位，错开不连续；非健身日跳绳） ----------
   周一：胸 + 手臂(三头)   周三：背 + 手臂(二头)   周五：肩 + 腹   周日：腿 + 腹
   周二 / 周四 / 周六：非健身日 → 跳绳 200 个                                        */
const FITNESS = {
  1:{title:'胸 + 手臂（三头）', emoji:'💪', items:[
     '跳绳热身 5 分钟',
     '标准俯卧撑（俯卧撑辅助器） 4 组 × 12–15',
     '哑铃平板卧推（地面/长凳） 4 组 × 10–12',
     '哑铃上斜飞鸟 3 组 × 12–15',
     '仰卧哑铃臂屈伸（三头） 4 组 × 10–12',
     '哑铃颈后臂屈伸（三头） 3 组 × 12',
     '窄距钻石俯卧撑 3 组 × 力竭',
     '胸部 + 手臂拉伸 5 分钟']},
  3:{title:'背 + 手臂（二头）', emoji:'🌊', items:[
     '跳绳热身 5 分钟',
     '哑铃单臂划船 4 组 × 10–12/侧',
     '哑铃俯身划船 4 组 × 10–12',
     '哑铃直腿硬拉 4 组 × 10–12',
     '哑铃站姿弯举（二头） 4 组 × 10–12',
     '哑铃锤式弯举（二头） 3 组 × 12',
     '哑铃耸肩 3 组 × 15',
     '背部 + 手臂拉伸 5 分钟']},
  5:{title:'肩 + 腹', emoji:'🏔️', items:[
     '跳绳热身 5 分钟',
     '哑铃站姿推举 4 组 × 10–12',
     '哑铃侧平举 4 组 × 15',
     '哑铃前平举 3 组 × 12',
     '哑铃俯身飞鸟（后束） 3 组 × 15',
     '仰卧起坐（辅助器） 4 组 × 20',
     '哑铃俄罗斯转体 3 组 × 20',
     '平板支撑 3 组 × 60 秒']},
  0:{title:'腿 + 腹', emoji:'🦵', items:[
     '跳绳热身 5 分钟',
     '哑铃高脚杯深蹲 4 组 × 12–15',
     '哑铃箭步蹲 3 组 × 12/腿',
     '哑铃罗马尼亚硬拉 4 组 × 12',
     '站姿提踵 4 组 × 20',
     '仰卧起坐（辅助器） 4 组 × 25',
     '登山跑 3 组 × 30 秒',
     '腿部 + 腰腹拉伸 5 分钟']},
  2:null, // 周二：跳绳日
  4:null, // 周四：跳绳日
  6:null, // 周六：跳绳日
};
function fitnessOf(s){ return FITNESS[weekdayOf(s)]; }
function isFitnessDay(s){ return !!FITNESS[weekdayOf(s)]; }

/* 集义打卡项定义（饮水 / 健身或跳绳 / 文科 / 理科 / AI；文理AI含专属记录空间） */
const JIYI_ITEMS = [
  {key:'water',   name:'每日饮水', emoji:'💧', desc:'完成 2000ml 及以上饮水量', rec:false},
  {key:'fitness', name:'规律健身', emoji:'🏋️', desc:'每周 4 练 · 每日两个部位', rec:false, fitness:true},
  {key:'rope',    name:'跳绳打卡', emoji:'🪢', desc:'非健身日完成跳绳 200 个', rec:false, rope:true},
  {key:'liberal', name:'文科积累', emoji:'📖', desc:'每日了解 5 个文科知识点', rec:true, noteType:'liberal'},
  {key:'science', name:'理科积累', emoji:'🔬', desc:'每日了解 5 个理科知识点', rec:true, noteType:'science'},
  {key:'ai',      name:'AI 学习',  emoji:'🤖', desc:'每日预留 30 分钟学习 AI', rec:true, noteType:'ai'},
];
/* 当日实际显示的集义打卡项：健身日显示健身、非健身日显示跳绳 */
function jiyiItemsFor(date){
  return JIYI_ITEMS.filter(it=>{
    if(it.fitness) return isFitnessDay(date);
    if(it.rope)    return !isFitnessDay(date);
    return true;
  });
}
const REC_CATS = [
  {key:'inspiration', name:'灵感记录', emoji:'💡', sub:'通灵 · 突发想法与创意'},
  {key:'excerpt',     name:'借鉴摘抄', emoji:'✍️', sub:'优质内容与经典摘抄'},
  {key:'reading',     name:'阅读笔记', emoji:'📚', sub:'书籍文章心得笔记'},
  {key:'reflection',  name:'有感抒怀', emoji:'🌾', sub:'日常感悟与随笔'},
];
/* 全屏记录空间元信息（复盘三类 + 文理AI） */
const NOTE_META = {
  reviewDay:  {n:'当日学习复盘', e:'📝'},
  reviewWeek: {n:'每周总结',    e:'🗓️'},
  reviewMonth:{n:'每月总结',    e:'📅'},
  liberal:    {n:'文科积累',    e:'📖'},
  science:    {n:'理科积累',    e:'🔬'},
  ai:         {n:'AI 学习',     e:'🤖'},
};

/* ---------- 4. 本地存储 ---------- */
const KEY='weiji_v2';
const NOTE_TYPES=['reviewDay','reviewWeek','reviewMonth','liberal','science','ai'];
function blankNotes(){ const o={}; NOTE_TYPES.forEach(k=>o[k]={}); return o; }
function blank(){ return {checkins:{}, records:{}, notes:blankNotes(), meta:{created:todayStr()}}; }
let DB = (()=>{
  let d; try{ d=JSON.parse(localStorage.getItem(KEY))||{}; }catch(e){ d={}; }
  d=Object.assign(blank(), d);
  d.notes=Object.assign(blankNotes(), d.notes||{});
  migrate(d);
  return d;
})();
function migrate(d){
  // 旧版：content[date][key] 单条文本 → notes[key][date] 多条
  if(d.content){ Object.keys(d.content).forEach(date=>{
    Object.keys(d.content[date]).forEach(k=>{ const txt=d.content[date][k];
      if(txt&&txt.trim()){ d.notes[k]=d.notes[k]||{}; (d.notes[k][date]=d.notes[k][date]||[]).push({t:'',text:txt}); } });
  }); delete d.content; }
  if(!d.reviews) return;
  // 旧版：reviews.day[date] 单条文本 → notes.reviewDay[date] 多条
  if(d.reviews.day){ Object.keys(d.reviews.day).forEach(date=>{ const txt=d.reviews.day[date];
    if(txt&&txt.trim()){ (d.notes.reviewDay[date]=d.notes.reviewDay[date]||[]).push({t:'',text:txt}); } }); }
  // 旧版：reviews.week[weekKey] 单条 → notes.reviewWeek[weekKey] 多条
  if(d.reviews.week){ Object.keys(d.reviews.week).forEach(k=>{ const txt=d.reviews.week[k];
    if(txt&&txt.trim()){ (d.notes.reviewWeek[k]=d.notes.reviewWeek[k]||[]).push({t:'',text:txt}); } }); }
  // 旧版：reviews.month['YYYY-MM'] 单条 → notes.reviewMonth['YYYY-MM-01'] 多条
  if(d.reviews.month){ Object.keys(d.reviews.month).forEach(k=>{ const txt=d.reviews.month[k];
    const dk=/^\d{4}-\d{2}$/.test(k)?k+'-01':k;
    if(txt&&txt.trim()){ (d.notes.reviewMonth[dk]=d.notes.reviewMonth[dk]||[]).push({t:'',text:txt}); } }); }
  delete d.reviews;
}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(DB)); }catch(e){ toast('存储空间不足'); } snapshotBackup(); }

/* 自动备份：每次保存写入当日全量快照，仅保留最新一份，旧备份自动清理；
   仅轮换备份副本，绝不触碰主数据(KEY)，故不影响全部数据的完整性。 */
const BAK_PREFIX='weiji_bak_';
function hasData(){
  if(Object.keys(DB.checkins).length>0) return true;
  if(Object.keys(DB.records).length>0) return true;
  return Object.values(DB.notes).some(arr=>Object.keys(arr).length>0);
}
function snapshotBackup(){
  if(!hasData()) return;            // 空数据（如刚清空）不写备份、也不清理旧备份
  try{
    const t=todayStr();
    localStorage.setItem(BAK_PREFIX+t, JSON.stringify(DB));
    for(let i=localStorage.length-1;i>=0;i--){
      const k=localStorage.key(i);
      if(k && k.startsWith(BAK_PREFIX) && k!==BAK_PREFIX+t) localStorage.removeItem(k);
    }
  }catch(e){ /* 配额不足时忽略 */ }
}
function latestBackupKey(){
  let best=null;
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k && k.startsWith(BAK_PREFIX)){ const d=k.slice(BAK_PREFIX.length); if(!best||d>best) best=k; }
  }
  return best;
}
function restoreBackup(){
  const k=latestBackupKey(); if(!k) return false;
  try{ const data=JSON.parse(localStorage.getItem(k)); DB=Object.assign(blank(),data); save(); return true; }
  catch(e){ return false; }
}

function ci(date){ return (DB.checkins[date] ||= {mingdao:{}, jiyi:{}}); }
function toggleMingdao(date,id){ const c=ci(date); c.mingdao[id]=!c.mingdao[id]; if(!c.mingdao[id]) delete c.mingdao[id]; save(); }
function toggleJiyi(date,key){ const c=ci(date); c.jiyi[key]=!c.jiyi[key]; if(!c.jiyi[key]) delete c.jiyi[key]; save(); }
function recs(date){ return (DB.records[date] ||= {inspiration:[],excerpt:[],reading:[],reflection:[]}); }
/* 笔记类（复盘 / 文科 / 理科 / AI）统一多条记录模型 */
function noteStore(type){ return (DB.notes[type] ||= {}); }
function noteList(type,date){ return (noteStore(type)[date] ||= []); }
function noteHas(type,date){ return noteList(type,date).length>0; }
function noteAll(type){
  const out=[]; const store=DB.notes[type]||{};
  Object.keys(store).sort().reverse().forEach(date=> store[date].forEach(it=>out.push({date, i:store[date].indexOf(it), t:it.t||'', text:it.text})));
  return out;
}

/* ---------- 5. 统计 ---------- */
function studyDoneDays(){ return Object.keys(DB.checkins).filter(d=>{const m=DB.checkins[d].mingdao;return m&&Object.keys(m).length>0;}); }
function studyStreak(){
  let s=0, cur=todayStr();
  // 若今日尚无打卡，从昨天起算
  const has = d => { const c=DB.checkins[d]; return c&&c.mingdao&&Object.keys(c.mingdao).length>0; };
  if(!has(cur)) cur=addDays(cur,-1);
  while(has(cur)){ s++; cur=addDays(cur,-1); }
  return s;
}
function todayMingdaoRate(){
  const t=todayStr(), {rest,tasks}=mingdaoTasks(t);
  if(rest||tasks.length===0) return {done:0,total:0,pct:100};
  const c=ci(t).mingdao; const done=tasks.filter(x=>c[x.id]).length;
  return {done,total:tasks.length,pct:Math.round(done/tasks.length*100)};
}
function todayJiyiRate(){
  const items=jiyiItemsFor(todayStr());
  const c=ci(todayStr()).jiyi; const done=items.filter(x=>c[x.key]).length;
  return {done,total:items.length,pct:items.length?Math.round(done/items.length*100):100};
}
function totalStudyHours(){
  let h=0; studyDoneDays().forEach(d=>{ const {tasks}=mingdaoTasks(d); const c=DB.checkins[d].mingdao;
    tasks.forEach(t=>{ if(c[t.id]) h+=(t.h||0); }); }); return h;
}

/* ---------- 6. SVG 图表 ---------- */
const C = ['#8B1E24','#C7A15A','#A8353B','#6E141A','#D9B77A','#B5686C','#8FA98C'];
function ringSVG(pct,sub){
  const r=50,c=2*Math.PI*r,off=c*(1-Math.max(0,Math.min(100,pct))/100);
  return `<svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="#EDE4D5" stroke-width="12"/>
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="#8B1E24" stroke-width="12" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 60 60)"/>
    <text x="60" y="57" text-anchor="middle" font-family="serif" font-size="27" fill="#8B1E24">${Math.round(pct)}%</text>
    <text x="60" y="77" text-anchor="middle" font-size="11" fill="#6B5F58">${sub||''}</text></svg>`;
}
function barSVG(labels,values,unit){
  const n=labels.length, w=Math.max(300,n*44), h=190, pad=30, bw=22;
  const max=Math.max(1,...values), gap=(w-pad*2)/n;
  let s='';
  labels.forEach((lb,i)=>{
    const v=values[i]||0, bh=(h-pad*2)*(v/max), x=pad+gap*i+gap/2-bw/2, y=h-pad-bh;
    s+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw}" height="${Math.max(0,bh).toFixed(1)}" rx="4" fill="url(#gr)"/>`;
    s+=`<text x="${(x+bw/2).toFixed(1)}" y="${h-pad+15}" text-anchor="middle" font-size="10" fill="#6B5F58">${lb}</text>`;
    if(v>0) s+=`<text x="${(x+bw/2).toFixed(1)}" y="${(y-4).toFixed(1)}" text-anchor="middle" font-size="10" fill="#8B1E24">${v}${unit||''}</text>`;
  });
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" preserveAspectRatio="xMidYMid meet">
    <defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A8353B"/><stop offset="1" stop-color="#8B1E24"/></linearGradient></defs>
    <line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}" stroke="#E7DDCF"/>${s}</svg>`;
}
function doughnutSVG(segs){
  const total=segs.reduce((a,b)=>a+b.value,0);
  if(total===0) return `<svg viewBox="0 0 180 180" width="160" height="160"><circle cx="90" cy="90" r="64" fill="none" stroke="#EDE4D5" stroke-width="24"/><text x="90" y="95" text-anchor="middle" font-size="12" fill="#6B5F58">暂无数据</text></svg>`;
  const cx=90,cy=90,r=64,ir=42; let a=-Math.PI/2, p='';
  segs.forEach((sg,i)=>{
    if(sg.value<=0) return;
    const a2=a+2*Math.PI*(sg.value/total);
    const x1=cx+r*Math.cos(a),y1=cy+r*Math.sin(a),x2=cx+r*Math.cos(a2),y2=cy+r*Math.sin(a2);
    const xi2=cx+ir*Math.cos(a2),yi2=cy+ir*Math.sin(a2),xi1=cx+ir*Math.cos(a),yi1=cy+ir*Math.sin(a);
    const large=(a2-a)>Math.PI?1:0;
    p+=`<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} L${xi2.toFixed(1)} ${yi2.toFixed(1)} A${ir} ${ir} 0 ${large} 0 ${xi1.toFixed(1)} ${yi1.toFixed(1)} Z" fill="${sg.color}"/>`;
    a=a2;
  });
  return `<svg viewBox="0 0 180 180" width="160" height="160">${p}<text x="90" y="88" text-anchor="middle" font-family="serif" font-size="22" fill="#8B1E24">${total}</text><text x="90" y="104" text-anchor="middle" font-size="10" fill="#6B5F58">合计</text></svg>`;
}
function heatSVG(levelFn,weeks){
  weeks=weeks||14;
  const cell=14,gap=3,padL=4,padT=16;
  const end=todayStr();
  const startBase=addDays(end,-(weeks*7-1));
  const start=addDays(startBase,-weekdayOf(startBase));
  const cols=Math.floor(daysBetween(start,end)/7)+1;
  const w=padL+cols*(cell+gap), h=padT+7*(cell+gap);
  const colors=['#ECE4D6','#E7C9A0','#D79E77','#B65A57','#8B1E24'];
  let s='';
  for(let d=start; d<=end; d=addDays(d,1)){
    const col=Math.floor(daysBetween(start,d)/7), row=weekdayOf(d);
    const lv=Math.max(0,Math.min(4,levelFn(d)));
    const x=padL+col*(cell+gap), y=padT+row*(cell+gap);
    s+=`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="3" fill="${colors[lv]}"><title>${d} · ${lv}</title></rect>`;
  }
  ['日','','二','','四','','六'].forEach((t,i)=>{ if(t) s+=`<text x="0" y="${padT+i*(cell+gap)+11}" font-size="9" fill="#6B5F58">${t}</text>`; });
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" preserveAspectRatio="xMidYMid meet" style="max-width:${w}px">${s}</svg>`;
}

/* ---------- 7. 通用 UI（弹窗 / Toast） ---------- */
let toastT=null;
function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.hidden=false;
  clearTimeout(toastT); toastT=setTimeout(()=>t.hidden=true,1800); }
function openModal(title,body,foot){
  const safeTitle = title || '未济';
  const safeBody = body ? String(body) : '<div class="modal-empty">内容加载失败，请关闭后重试。</div>';
  const safeFoot = foot || '<button class="btn" id="mFallbackClose">关闭</button>';
  document.getElementById('modalTitle').innerHTML=safeTitle;
  document.getElementById('modalBody').innerHTML=safeBody;
  document.getElementById('modalFoot').innerHTML=safeFoot;
  document.getElementById('modalMask').hidden=false;
  // 兜底关闭按钮
  const fb=document.getElementById('mFallbackClose'); if(fb) fb.onclick=closeModal;
}
function closeModal(){ document.getElementById('modalMask').hidden=true; }

/* ---------- 8. 视图渲染 ---------- */
const V = {}; // renderers

/* 任务项 HTML */
function taskHTML(date,t,done){
  let action='';
  if(t.type==='day') action=`<button class="note-btn ${noteHas('reviewDay',date)?'has':''}" data-note="reviewDay" data-date="${date}">${noteHas('reviewDay',date)?'查看复盘':'填写复盘'}</button>`;
  else if(t.type==='week') action=`<button class="note-btn ${noteHas('reviewWeek',weekKeyOf(date))?'has':''}" data-note="reviewWeek" data-date="${weekKeyOf(date)}">每周总结</button>`;
  else if(t.type==='month') action=`<button class="note-btn ${noteHas('reviewMonth',monthKey(date)+'-01')?'has':''}" data-note="reviewMonth" data-date="${monthKey(date)+'-01'}">每月总结</button>`;
  else if(t.type==='review-view') action=`<button class="note-btn ${noteHas('reviewDay',addDays(date,-1))?'has':''}" data-note="reviewDay" data-date="${addDays(date,-1)}">查看昨日</button>`;
  const meta = t.h>0 ? `<span class="tag">${t.cat}</span><span>${t.h} 小时</span>` : `<span class="tag gold">${t.cat}</span>`;
  return `<div class="task ${done?'done':''}">
    <button class="chk" data-md="${t.id}" data-date="${date}">${done?'✓':''}</button>
    <div class="tinfo"><div class="tname">${escapeHTML(t.name)}</div><div class="tmeta">${meta}</div></div>
    ${action}</div>`;
}
function renderTodayTasks(date){
  const {rest,note,tasks}=mingdaoTasks(date);
  if(phaseOf(date)==='pre'||phaseOf(date)==='done') return `<div class="rest-banner"><div class="big">${note}</div></div>`;
  if(rest) return `<div class="rest-banner"><div class="big">🌿 ${note}</div><div>今日无学习任务，别忘了完成【每周总结】与集义日常成长。</div>
    <div class="btn-row" style="justify-content:center"><button class="btn ghost sm note-btn" data-note="reviewWeek" data-date="${weekKeyOf(date)}">${noteHas('reviewWeek',weekKeyOf(date))?'查看每周总结':'填写每周总结'}</button></div></div>`;
  const c=ci(date).mingdao;
  return tasks.map(t=>taskHTML(date,t,!!c[t.id])).join('');
}

/* ===== 今日总览 ===== */
V.today = ()=>{
  const t=todayStr(), md=todayMingdaoRate(), jy=todayJiyiRate();
  const el=document.getElementById('view-today');
  el.innerHTML=`
  <div class="card" style="background:linear-gradient(135deg,#fff, #FBF3E6);border-color:var(--ruc-gold-soft)">
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <span class="hexagram" style="font-size:44px;color:var(--ruc-red)">䷿</span>
      <div style="flex:1;min-width:200px">
        <div class="serif" style="font-size:22px;color:var(--ruc-red)">${CN_DATE(t)}</div>
        <div style="color:var(--ink-soft);font-size:13px;margin-top:4px">${phaseLabel(t)} · 未济，事业未竟，日进不止</div>
      </div>
    </div>
  </div>

  <div class="grid grid-auto" style="margin-top:14px">
    <div class="stat"><div class="k">今日 · 明道完成</div><div class="v">${md.done}<span class="u">/${md.total} 项</span></div><span class="deco">道</span></div>
    <div class="stat"><div class="k">今日 · 集义完成</div><div class="v">${jy.done}<span class="u">/${jy.total} 项</span></div><span class="deco">义</span></div>
    <div class="stat"><div class="k">连续学习</div><div class="v">${studyStreak()}<span class="u">天</span></div><span class="deco">恒</span></div>
    <div class="stat"><div class="k">累计学习</div><div class="v">${studyDoneDays().length}<span class="u">天</span></div><span class="deco">积</span></div>
  </div>

  <div class="section-title"><span class="bar"></span><h2>明道 · 今日学习任务</h2><span class="sub">每日自动生成 · 逐项打卡</span></div>
  <div class="card"><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:6px">
    ${ringSVG(md.total?md.pct:100,'完成度')}
    <div style="flex:1;min-width:180px">
      <div class="hint" style="margin-top:0">今日有效学习目标：<b style="color:var(--ruc-red)">${studyHours(t)} 小时</b></div>
      <div class="pbar"><i style="width:${md.total?md.pct:100}%"></i></div>
      <div class="btn-row"><button class="btn sm" data-go="mingdao">进入明道 · 复盘与数据 →</button></div>
    </div></div>
    <div id="todayTaskList">${renderTodayTasks(t)}</div>
  </div>

  <div class="section-title"><span class="bar"></span><h2>集义 · 今日日常打卡</h2><span class="sub">水 / 练 / 文 / 理 / AI</span></div>
  <div class="checkin" id="todayJiyi">${jiyiCardsHTML(t)}</div>
  `;
  bindTasks(el); bindJiyi(el);
};

/* 集义打卡卡片 HTML */
function jiyiCardsHTML(date){
  const c=ci(date).jiyi;
  return jiyiItemsFor(date).map(it=>{
    const on=!!c[it.key];
    let extra='';
    if(it.fitness){ const f=fitnessOf(date);
      extra = `<div class="ci-desc">今日部位：<b>${f.emoji} ${f.title}</b> · <a href="#" data-fit="${date}" style="color:var(--ruc-red)">查看动作流程</a></div>`; }
    if(it.rope){ extra = `<div class="ci-desc">今日非健身日 🌿 · 跳绳 <b style="color:var(--ruc-red)">200 个</b>，保持有氧与协调</div>`; }
    let actions=`<button class="ci-btn ${on?'on':''}" data-jy="${it.key}" data-date="${date}">${on?'✓ 已打卡':'打卡'}</button>`;
    if(it.rec){ const has=noteHas(it.noteType,date);
      actions+=`<button class="ci-btn rec ${has?'has':''}" data-note="${it.noteType}" data-date="${date}">${has?'✎ 查看记录':'内容记录'}</button>`; }
    return `<div class="ci-card"><div class="ci-top"><div class="ci-name"><span class="em">${it.emoji}</span>${it.name}</div></div>
      <div class="ci-desc">${it.desc}</div>${extra}<div class="ci-actions">${actions}</div></div>`;
  }).join('');
}

/* ===== 明道（复盘中心 + 数据面板） ===== */
V.mingdao = ()=>{
  const t=todayStr(), el=document.getElementById('view-mingdao'), md=todayMingdaoRate();
  // 最近7天完成率
  const days=[],rate=[];
  for(let i=6;i>=0;i--){ const d=addDays(t,-i); days.push(WD_CN[weekdayOf(d)]);
    const {rest,tasks}=mingdaoTasks(d);
    if(rest||!tasks.length){ rate.push(0); continue; }
    const c=(DB.checkins[d]?.mingdao)||{}; rate.push(Math.round(tasks.filter(x=>c[x.id]).length/tasks.length*100)); }
  // 各科目累计打卡时长
  const catH={}; studyDoneDays().forEach(d=>{ const {tasks}=mingdaoTasks(d); const c=DB.checkins[d].mingdao;
    tasks.forEach(x=>{ if(c[x.id]) catH[x.cat]=(catH[x.cat]||0)+(x.h||0); }); });
  const segs=Object.keys(catH).map((k,i)=>({label:k,value:Math.round(catH[k]),color:C[i%C.length]}));

  el.innerHTML=`
  <div class="section-title"><span class="bar"></span><h2>明道 · 今日学习任务</h2><span class="sub">${phaseLabel(t)}</span></div>
  <div class="card"><div id="mdTaskList">${renderTodayTasks(t)}</div></div>

  <div class="section-title"><span class="bar"></span><h2>复盘闭环</h2><span class="sub">每日 · 每周 · 每月 · 全屏记录空间</span></div>
  <div class="grid grid-3">
    ${reviewCard('reviewDay', t,             '次日学习前请回看昨日复盘', '今日收获 / 薄弱点 / 明日待办')}
    ${reviewCard('reviewWeek', weekKeyOf(t), '周期：'+weekKeyOf(t)+' 起',   '本周整体进度 / 问题 / 下周计划')}
    ${reviewCard('reviewMonth', monthKey(t)+'-01', '周期：'+monthKey(t),    '本月阶段复盘 / 目标达成度')}
  </div>

  <div class="section-title"><span class="bar"></span><h2>学习数据面板</h2><span class="sub">智能统计 · 可视化</span></div>
  <div class="grid grid-auto">
    <div class="stat"><div class="k">今日完成度</div><div class="v">${md.total?md.pct:100}<span class="u">%</span></div><span class="deco">今</span></div>
    <div class="stat"><div class="k">连续学习天数</div><div class="v">${studyStreak()}<span class="u">天</span></div><span class="deco">恒</span></div>
    <div class="stat"><div class="k">累计学习天数</div><div class="v">${studyDoneDays().length}<span class="u">天</span></div><span class="deco">积</span></div>
    <div class="stat"><div class="k">累计有效学时</div><div class="v">${Math.round(totalStudyHours())}<span class="u">h</span></div><span class="deco">勤</span></div>
  </div>
  <div class="grid grid-2" style="margin-top:14px">
    <div class="card"><h3 class="serif" style="margin-bottom:10px">近 7 日完成率</h3><div class="chart-wrap">${barSVG(days,rate,'%')}</div></div>
    <div class="card"><h3 class="serif" style="margin-bottom:10px">各科目累计学时分布</h3>
      <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;justify-content:center">${doughnutSVG(segs)}
      <div class="legend" style="flex-direction:column">${segs.map(s=>`<span><i style="background:${s.color}"></i>${s.label} · ${s.value}h</span>`).join('')||'<span>暂无数据</span>'}</div></div></div>
  </div>`;
  bindTasks(el);
  // 「查看全部」→ 全屏；「＋写记录」→ 全屏并直接进入新建
  el.querySelectorAll('[data-all]').forEach(b=>b.onclick=()=>openFullView('note',{type:b.dataset.all}));
  el.querySelectorAll('[data-newnote]').forEach(b=>b.onclick=()=>{ openFullView('note',{type:b.dataset.newnote,date:b.dataset.date}); fvNew(); });
};

/* 复盘入口卡片：预览最新一条 + 总条数 + 写记录 / 查看全部（均走全屏可搜索空间） */
function reviewCard(type, dateKey, hint, placeholder){
  const meta=NOTE_META[type];
  const store=DB.notes[type]||{};
  const total=Object.values(store).reduce((a,arr)=>a+arr.length,0);
  const list=store[dateKey]||[];
  const latest=list[list.length-1];
  const preview = latest
    ? `<span class="rv-time">${latest.t?escapeHTML(String(latest.t).split(' ')[0]):CN_DATE(dateKey)}</span>${latest.title?`<b style="color:var(--ruc-red)">${escapeHTML(latest.title)}：</b>`:''}${escapeHTML(latest.text).slice(0,58)}${latest.text.length>58?'…':''}`
    : `<span style="color:var(--ink-soft)">${placeholder}…（尚未记录，点击开始）</span>`;
  return `<div class="card review-box">
    <h3 class="serif" style="color:var(--ruc-red);margin-bottom:6px">${meta.e} ${meta.n}</h3>
    <div class="hint">${hint} · 累计 ${total} 条</div>
    <div class="rv-preview">${preview}</div>
    <div class="btn-row">
      <button class="btn sm" data-newnote="${type}" data-date="${dateKey}">✎ 写${meta.n.replace('当日学习','')}</button>
      <button class="btn sm ghost" data-all="${type}">查看全部 →</button>
    </div></div>`;
}

/* ===== 集义（记录日历 + 打卡 + 数据） ===== */
let calMonth = todayStr().slice(0,7);
let selDate = todayStr();
V.jiyi = ()=>{
  const t=todayStr(), el=document.getElementById('view-jiyi');
  el.innerHTML=`
  <div class="section-title"><span class="bar"></span><h2>集义 · 今日日常打卡</h2><span class="sub">按日期永久归档</span></div>
  <div class="checkin" id="jyCheck">${jiyiCardsHTML(t)}</div>

  <div class="section-title"><span class="bar"></span><h2>四大记录 · 日历</h2><span class="sub">灵感 / 摘抄 / 阅读 / 抒怀</span></div>
  <div class="card">
    <div class="cal-head"><h3 id="calTitle"></h3>
      <div class="cal-nav"><button class="btn ghost sm" data-cal="-1">‹ 上月</button>
      <button class="btn ghost sm" data-cal="0">本月</button>
      <button class="btn ghost sm" data-cal="1">下月 ›</button></div></div>
    <div class="cal-grid" id="calGrid"></div>
  </div>
  <div class="card" id="recPanel"></div>

  <div class="section-title"><span class="bar"></span><h2>成长数据面板</h2><span class="sub">30 日打卡趋势</span></div>
  <div id="jyData"></div>`;
  bindJiyi(el);
  renderCalendar(); renderRecPanel(selDate); renderJiyiData();
  el.querySelectorAll('[data-cal]').forEach(b=>b.onclick=()=>{
    const v=+b.dataset.cal;
    if(v===0) calMonth=todayStr().slice(0,7);
    else{ const d=parseDate(calMonth+'-01'); d.setMonth(d.getMonth()+v); calMonth=fmtDate(d).slice(0,7); }
    renderCalendar();
  });
};
function renderCalendar(){
  const [y,m]=calMonth.split('-').map(Number);
  document.getElementById('calTitle').textContent=`${y} 年 ${m} 月`;
  const first=new Date(y,m-1,1), start=first.getDay(), days=new Date(y,m,0).getDate();
  let h=['日','一','二','三','四','五','六'].map(w=>`<div class="cal-wd">${w}</div>`).join('');
  for(let i=0;i<start;i++) h+=`<div class="cal-cell empty"></div>`;
  for(let d=1;d<=days;d++){
    const ds=`${y}-${pad(m)}-${pad(d)}`;
    const r=DB.records[ds]; const cnt=r?REC_CATS.reduce((a,c)=>a+(r[c.key]?.length||0),0):0;
    const dots=cnt?`<div class="cal-dots">${'<i></i>'.repeat(Math.min(4,cnt))}</div>`:'';
    const cls=['cal-cell']; if(ds===todayStr())cls.push('today'); if(ds===selDate)cls.push('sel');
    h+=`<div class="${cls.join(' ')}" data-day="${ds}"><span class="d">${d}</span>${dots}</div>`;
  }
  const g=document.getElementById('calGrid'); g.innerHTML=h;
  g.querySelectorAll('[data-day]').forEach(c=>c.onclick=()=>{ selDate=c.dataset.day; renderCalendar(); renderRecPanel(selDate); });
}
function renderRecPanel(date){
  const r=recs(date);
  document.getElementById('recPanel').innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:6px">
      <h3 class="serif" style="color:var(--ruc-red)">${CN_DATE(date)} · 记录</h3>
      <span class="hint" style="margin:0">点击分类查看全部记录</span></div>
    <div class="rec-cats">${REC_CATS.map(c=>`
      <div class="rec-cat" data-cat="${c.key}" data-date="${date}">
        <span class="rc-em">${c.emoji}</span><span class="rc-name">${c.name}</span>
        <span class="rc-cnt">${c.sub} · ${r[c.key].length} 条</span></div>`).join('')}</div>`;
  document.querySelectorAll('.rec-cat').forEach(c=>c.onclick=()=>openFullView('rec',{cat:c.dataset.cat,date:c.dataset.date}));
}
/* 记录板块分类直接走全屏视图（与笔记类共用 openFullView） */
function renderJiyiData(){
  const t=todayStr(), keys=JIYI_ITEMS.map(i=>i.key), cnt=keys.map(()=>0);
  for(let i=0;i<30;i++){ const d=addDays(t,-i); const c=DB.checkins[d]?.jiyi||{};
    keys.forEach((k,j)=>{ if(c[k]) cnt[j]++; }); }
  // 记录数量
  const recCnt=REC_CATS.map(()=>0);
  Object.values(DB.records).forEach(r=>REC_CATS.forEach((c,i)=>recCnt[i]+=(r[c.key]?.length||0)));
  const recSegs=REC_CATS.map((c,i)=>({label:c.name,value:recCnt[i],color:C[i%C.length]}));
  document.getElementById('jyData').innerHTML=`
  <div class="grid grid-2">
    <div class="card"><h3 class="serif" style="margin-bottom:10px">近 30 日各项打卡次数</h3>
      <div class="chart-wrap">${barSVG(JIYI_ITEMS.map(i=>i.name.slice(0,2)),cnt,'')}</div></div>
    <div class="card"><h3 class="serif" style="margin-bottom:10px">每日打卡热力图（近 14 周）</h3>
      <div class="chart-wrap">${heatSVG(d=>{const c=DB.checkins[d]?.jiyi||{};return keys.filter(k=>c[k]).length;},14)}</div>
      <div class="legend"><span>颜色越深，当日完成项越多（0–5）</span></div></div>
  </div>
  <div class="card" style="margin-top:14px"><h3 class="serif" style="margin-bottom:10px">四大记录累计条数</h3>
    <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;justify-content:center">${doughnutSVG(recSegs)}
    <div class="legend" style="flex-direction:column">${recSegs.map(s=>`<span><i style="background:${s.color}"></i>${s.label} · ${s.value} 条</span>`).join('')}</div></div></div>`;
}

/* 每月数据总结：明道（学习任务 + 复盘撰写统计，按月份聚合） + 集义（打卡/记录按月统计） */
function countNotesMonth(type,m){
  const store=DB.notes[type]||{};
  return Object.keys(store).filter(k=>monthKey(k)===m).reduce((a,k)=>a+store[k].length,0);
}
function monthlyMingdaoSummary(n){
  n=n||6; const out=[]; const t=todayStr();
  for(let i=0;i<n;i++){ const d=parseDate(t); d.setMonth(d.getMonth()-i);
    const m=fmtDate(d).slice(0,7);
    let studyDays=0, hours=0, totalTasks=0, doneTasks=0;
    Object.keys(DB.checkins).forEach(date=>{ if(monthKey(date)!==m) return;
      const c=DB.checkins[date].mingdao||{}; const {rest,tasks}=mingdaoTasks(date);
      if(rest||!tasks.length) return;
      const study=tasks.filter(x=>x.h>0);
      const done=study.filter(x=>c[x.id]).length;
      if(done>0) studyDays++;
      totalTasks+=study.length; doneTasks+=done;
      study.forEach(x=>{ if(c[x.id]) hours+=(x.h||0); });
    });
    const reviews=countNotesMonth('reviewDay',m)+countNotesMonth('reviewWeek',m)+countNotesMonth('reviewMonth',m);
    out.push({month:m, studyDays, hours:Math.round(hours), avgPct: totalTasks?Math.round(doneTasks/totalTasks*100):0, reviews});
  }
  return out;
}
function mdMonthSummaryHTML(){
  const rows=monthlyMingdaoSummary(6);
  return '<table class="mini-table"><thead><tr><th>月份</th><th>学习天数</th><th>累计学时</th><th>日均完成</th><th>复盘篇数</th></tr></thead><tbody>'
    + rows.map(r=>`<tr><td>${r.month}</td><td>${r.studyDays} 天</td><td>${r.hours} h</td><td>${r.avgPct}%</td><td>${r.reviews} 篇</td></tr>`).join('')
    + '</tbody></table>'
    + '<div class="hint" style="margin-top:8px;font-size:12px">学习天数 = 当月有明道任务打卡的天数；累计学时 = 已打卡任务的学时总和；日均完成 = 当月所有学习日的平均完成率；复盘篇数 = 日复盘 / 周总结 / 月总结累计撰写数。</div>';
}
function monthlyJiyiSummary(n){
  n=n||6; const out=[]; const t=todayStr();
  for(let i=0;i<n;i++){ const d=parseDate(t); d.setMonth(d.getMonth()-i);
    const m=fmtDate(d).slice(0,7); let cd=0, rec=0;
    Object.keys(DB.checkins).forEach(date=>{ if(monthKey(date)===m){ const jy=DB.checkins[date].jiyi; if(jy&&Object.keys(jy).length>0) cd++; } });
    Object.keys(DB.records).forEach(date=>{ if(monthKey(date)===m){ const r=DB.records[date]; rec+=REC_CATS.reduce((a,c)=>a+(r[c.key]?.length||0),0); } });
    out.push({month:m, checkinDays:cd, recCnt:rec});
  }
  return out;
}
function jyMonthSummaryHTML(){
  const rows=monthlyJiyiSummary(6);
  return '<table class="mini-table"><thead><tr><th>月份</th><th>打卡天数</th><th>记录条数</th></tr></thead><tbody>'
    + rows.map(r=>`<tr><td>${r.month}</td><td>${r.checkinDays} 天</td><td>${r.recCnt} 条</td></tr>`).join('')
    + '</tbody></table>'
    + '<div class="hint" style="margin-top:8px;font-size:12px">打卡天数为当月有集义打卡记录的天数；记录条数为四大记录累计。</div>';
}

/* ===== 数据看板（综合） ===== */
V.data = ()=>{
  const el=document.getElementById('view-data'), t=todayStr();
  // 近30天学习完成率折线（用bar近似）
  const days=[],rate=[];
  for(let i=29;i>=0;i-=3){ const d=addDays(t,-i); days.push(`${parseDate(d).getMonth()+1}/${parseDate(d).getDate()}`);
    const {rest,tasks}=mingdaoTasks(d); if(rest||!tasks.length){rate.push(0);continue;}
    const c=DB.checkins[d]?.mingdao||{}; rate.push(Math.round(tasks.filter(x=>c[x.id]).length/tasks.length*100)); }
  const jy=todayJiyiRate(), md=todayMingdaoRate();
  el.innerHTML=`
  <div class="section-title"><span class="bar"></span><h2>综合数据看板</h2><span class="sub">明道 + 集义 全景</span></div>
  <div class="grid grid-auto">
    <div class="stat"><div class="k">累计学习天数</div><div class="v">${studyDoneDays().length}<span class="u">天</span></div><span class="deco">积</span></div>
    <div class="stat"><div class="k">连续学习</div><div class="v">${studyStreak()}<span class="u">天</span></div><span class="deco">恒</span></div>
    <div class="stat"><div class="k">累计学时</div><div class="v">${Math.round(totalStudyHours())}<span class="u">h</span></div><span class="deco">勤</span></div>
    <div class="stat"><div class="k">记录总条数</div><div class="v">${(Object.values(DB.records).reduce((a,r)=>a+REC_CATS.reduce((x,c)=>x+(r[c.key]?.length||0),0),0))+(Object.values(DB.notes).reduce((a,t)=>a+Object.values(t).reduce((x,arr)=>x+arr.length,0),0))}<span class="u">条</span></div><span class="deco">录</span></div>
  </div>
  <div class="grid grid-2" style="margin-top:14px">
    <div class="card"><h3 class="serif" style="margin-bottom:10px">近 30 日学习完成率走势</h3><div class="chart-wrap">${barSVG(days,rate,'%')}</div></div>
    <div class="card"><h3 class="serif" style="margin-bottom:10px">学习打卡热力图（近 14 周）</h3>
      <div class="chart-wrap">${heatSVG(d=>{const c=DB.checkins[d]?.mingdao||{};const {tasks}=mingdaoTasks(d);if(!tasks.length)return 0;const r=Object.keys(c).length/tasks.length;return r>=1?4:r>=.75?3:r>=.5?2:r>0?1:0;},14)}</div></div>
  </div>
  <div class="grid grid-2" style="margin-top:14px">
    <div class="card" style="text-align:center"><h3 class="serif" style="margin-bottom:10px">今日明道</h3>${ringSVG(md.total?md.pct:100,`${md.done}/${md.total}`)}</div>
    <div class="card" style="text-align:center"><h3 class="serif" style="margin-bottom:10px">今日集义</h3>${ringSVG(jy.pct,`${jy.done}/${jy.total}`)}</div>
  </div>

  <div class="section-title" style="margin-top:18px"><span class="bar"></span><h2>每月数据总结</h2><span class="sub">明道学习 · 集义成长 月度数据回顾</span></div>
  <div class="grid grid-2">
    <div class="card">
      <h3 class="serif" style="margin-bottom:8px">📅 明道 · 每月数据总结</h3>
      <div id="mdMonthSummary"></div>
    </div>
    <div class="card">
      <h3 class="serif" style="margin-bottom:8px">🌾 集义 · 每月数据总结</h3>
      <div id="jyMonthSummary"></div>
    </div>
  </div>`;
  document.getElementById('mdMonthSummary').innerHTML=mdMonthSummaryHTML();
  document.getElementById('jyMonthSummary').innerHTML=jyMonthSummaryHTML();
  el.querySelectorAll('[data-note]').forEach(b=>b.onclick=()=>openFullView('note',{type:b.dataset.note,date:b.dataset.date}));
};

/* ===== 计划总览 ===== */
let planMonth = todayStr().slice(0,7);
V.plan = ()=>{
  const el=document.getElementById('view-plan');
  const months=[]; let d=PLAN.start.slice(0,7);
  while(d<=PLAN.p2End.slice(0,7)){ months.push(d); const dt=parseDate(d+'-01'); dt.setMonth(dt.getMonth()+1); d=fmtDate(dt).slice(0,7); }
  el.innerHTML=`
  <div class="section-title"><span class="bar"></span><h2>备考计划总览</h2><span class="sub">两阶段 · 精确到每日</span></div>
  <div class="card">
    <div class="phase-card"><h3>第一阶段 · 综合夯实阶段</h3>
      <div class="pc-date">${CN_DATE(PLAN.start)} — 2027年1月15日 · 每日有效学习 8 小时</div>
      <ul><li>英语 学习（零基础系统） 2h</li><li>法硕 学习（非法学专业基础） 3h</li>
      <li>公考四模块：判断推理 / 数量关系 / 资料分析 / 申论 各 0.75h</li>
      <li>每日复盘 + 次日回看，每周固定休息一天（周日）</li></ul></div>
    <div class="phase-card"><h3>第二阶段 · 法硕专项冲刺阶段</h3>
      <div class="pc-date">2027年1月16日 — 2027年12月30日 · 每日有效学习 14 小时</div>
      <ul><li>英语：全年恒定 3h/日，不间断</li>
      <li>政治：4月前 1h · 4–8月 2h · 8月后 3h</li>
      <li>专业课（4/15前）：先完成法律基础全部学习，再开启法律综合，不交叉</li>
      <li>专业课（4/15–6/15）：刑法→民法→法理学→宪法学→法制史 逐本背诵，穿插复盘</li>
      <li>专业课（6/20后）：葫芦丝背书法滚动叠加，保留法律基础/法律综合组合逻辑</li>
      <li>每日复盘 + 次日回看 + 每周总结 + 每月总结</li></ul></div>
  </div>

  <div class="section-title"><span class="bar"></span><h2>逐日计划表</h2><span class="sub">选择月份查看每日安排</span></div>
  <div class="card">
    <div class="month-nav"><span>月份：</span>
      <select id="planSel">${months.map(m=>`<option value="${m}" ${m===planMonth?'selected':''}>${m.replace('-',' 年 ')} 月</option>`).join('')}</select>
      <button class="btn ghost sm" id="planPrint">🖨️ 打印/导出本月</button></div>
    <div style="overflow:auto;max-height:70vh"><table class="plan-table" id="planTable"></table></div>
  </div>`;
  document.getElementById('planSel').onchange=e=>{ planMonth=e.target.value; renderPlanTable(); };
  document.getElementById('planPrint').onclick=()=>window.print();
  renderPlanTable();
};
function renderPlanTable(){
  const [y,m]=planMonth.split('-').map(Number), days=new Date(y,m,0).getDate();
  let rows='';
  for(let d=1;d<=days;d++){
    const ds=`${y}-${pad(m)}-${pad(d)}`;
    if(ds<PLAN.start||ds>PLAN.p2End) continue;
    const {rest,tasks}=mingdaoTasks(ds);
    const f=fitnessOf(ds);
    const study = rest ? '<span class="tag rest">明道休息日 · 每周总结</span>'
      : tasks.filter(t=>t.h>0).map(t=>`${escapeHTML(t.name)}<span style="color:#999">(${t.h}h)</span>`).join('、') || '—';
    const fit = f?`${f.emoji}${f.title}`:'🪢 跳绳 200 个';
    rows+=`<tr class="${rest?'rest':''}"><td class="pd">${m}/${d}<br><span style="color:#999;font-weight:400">${WD_CN[weekdayOf(ds)]}</span></td>
      <td>${study}</td><td>饮水2000ml · 文科5 · 理科5 · AI30min</td><td>${fit}</td></tr>`;
  }
  document.getElementById('planTable').innerHTML=
    `<thead><tr><th>日期</th><th>明道 · 学习任务</th><th>集义 · 每日固定</th><th>健身</th></tr></thead><tbody>${rows}</tbody>`;
}

/* ---------- 9. 事件绑定 ---------- */
function bindTasks(scope){
  scope.querySelectorAll('[data-md]').forEach(b=>b.onclick=()=>{
    toggleMingdao(b.dataset.date,b.dataset.md); refreshCurrent(); toast('已更新打卡');
  });
  scope.querySelectorAll('[data-note]').forEach(b=>b.onclick=()=>openFullView('note',{type:b.dataset.note,date:b.dataset.date}));
}
function bindJiyi(scope){
  scope.querySelectorAll('[data-jy]').forEach(b=>b.onclick=()=>{
    toggleJiyi(b.dataset.date,b.dataset.jy); refreshCurrent(); toast('已更新打卡');
  });
  scope.querySelectorAll('[data-note]').forEach(b=>b.onclick=()=>openFullView('note',{type:b.dataset.note,date:b.dataset.date}));
  scope.querySelectorAll('[data-fit]').forEach(b=>b.onclick=e=>{e.preventDefault();openFitness(b.dataset.fit);});
}
function openFitness(date){
  const f=fitnessOf(date);
  if(!f){ openModal('非健身日 · 跳绳','<div class="rest-banner"><div class="big">🪢 今日跳绳 200 个</div>每周 4 练（周一/三/五/日），其余日子以跳绳保持有氧与恢复。</div>',`<button class="btn" id="mCancel">好的</button>`);
    document.getElementById('mCancel').onclick=closeModal; return; }
  openModal(`${f.emoji} ${f.title} · ${WD_CN[weekdayOf(date)]}`,
    `<div class="hint">器材：哑铃 / 跳绳 / 仰卧起坐辅助器 / 俯卧撑辅助器 · 身体：185cm / 80kg · 今日训练两个部位</div>
     ${f.items.map((x,i)=>`<div class="rec-item"><div class="ri-text"><b style="color:var(--ruc-red)">${i+1}.</b> ${escapeHTML(x)}</div></div>`).join('')}`,
    `<button class="btn" id="mCancel">开始训练</button>`);
  document.getElementById('mCancel').onclick=closeModal;
}

/* ---------- 全屏记录视图（复盘 / 文科 / 理科 / AI / 四大记录，支持搜索查找） ---------- */
let fv={mode:null,type:null,cat:null,date:null,filter:'',editing:null};
function openFullView(mode,opt){
  const t=todayStr();
  let newDate = opt.date || t;
  if(!opt.date){
    if(opt.type==='reviewWeek') newDate=weekKeyOf(t);
    else if(opt.type==='reviewMonth') newDate=monthKey(t)+'-01';
  }
  fv={mode, type:opt.type||null, cat:opt.cat||null, date:opt.date||null, newDate, filter:'', editing:null};
  const title = mode==='note'
    ? `${(NOTE_META[opt.type]||{}).e||'📝'} ${(NOTE_META[opt.type]||{}).n||'记录'} · 全部记录`
    : `${REC_CATS.find(c=>c.key===opt.cat)?.emoji||'📖'} ${REC_CATS.find(c=>c.key===opt.cat)?.name||'记录'} · 全部记录`;
  document.getElementById('fvTitle').innerHTML=title;
  document.getElementById('fvSearch').value='';
  document.getElementById('fvDate').value=opt.date||'';
  document.getElementById('fvEditor').hidden=true;
  document.getElementById('fullView').hidden=false;
  renderFullList();
}
function fvData(){
  let out=[];
  if(fv.mode==='note'){
    const store=DB.notes[fv.type]||{};
    Object.keys(store).sort().reverse().forEach(date=> store[date].forEach((it,i)=> out.push({date,i,t:it.t||'',title:it.title||'',text:it.text})));
  } else {
    Object.keys(DB.records).sort().reverse().forEach(date=> (DB.records[date][fv.cat]||[]).forEach((it,i)=> out.push({date,i,t:it.t||'',title:it.title||'',text:it.text})));
  }
  if(fv.date) out=out.filter(x=>x.date===fv.date);
  return out;
}
function renderFullList(){
  const q=fv.filter.trim().toLowerCase();
  let data=fvData();
  if(q) data=data.filter(x=> x.text.toLowerCase().includes(q) || (x.title||'').toLowerCase().includes(q) || x.date.includes(q));
  const el=document.getElementById('fvList');
  if(!data.length){ el.innerHTML='<div class="hint" style="padding:24px;text-align:center">暂无记录，点击右下角「＋ 新建记录」开始。</div>'; return; }
  el.innerHTML=data.map((it,idx)=>`<div class="rec-item">
    <div class="ri-time">${CN_DATE(it.date)}${it.t?' · '+escapeHTML(it.t):''}</div>
    ${it.title?`<div class="ri-title">${escapeHTML(it.title)}</div>`:''}
    <div class="ri-text">${escapeHTML(it.text)}</div>
    <div class="ri-actions"><button class="ri-edit" data-edit="${idx}">编辑</button><button class="ri-del" data-del="${idx}">删除</button></div></div>`).join('');
  el.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{
    const it=data[+b.dataset.del];
    if(fv.mode==='note'){ const arr=DB.notes[fv.type][it.date]; arr.splice(it.i,1); if(!arr.length) delete DB.notes[fv.type][it.date]; }
    else { DB.records[it.date][fv.cat].splice(it.i,1); }
    save(); renderFullList(); renderCalendar(); refreshCurrent(); toast('已删除');
  });
  el.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{
    const it=data[+b.dataset.edit]; fv.editing=it;
    document.getElementById('fvTitleInput').value=it.title||'';
    document.getElementById('fvInput').value=it.text;
    document.getElementById('fvEditor').hidden=false;
    document.getElementById('fvTitleInput').focus();
  });
}
function fvSave(){
  const title=(document.getElementById('fvTitleInput').value||'').trim();
  const text=document.getElementById('fvInput').value;
  const date=fv.editing?.date||fv.date||fv.newDate||todayStr();
  if(fv.mode==='note'){
    const arr=noteList(fv.type,date);
    if(fv.editing && fv.editing.date===date && fv.editing.i<arr.length){ arr[fv.editing.i].text=text; arr[fv.editing.i].title=title; arr[fv.editing.i].t=new Date().toLocaleString('zh-CN'); }
    else arr.push({t:new Date().toLocaleString('zh-CN'),title,text});
  } else {
    const arr=recs(date)[fv.cat];
    if(fv.editing && fv.editing.date===date && fv.editing.i<arr.length){ arr[fv.editing.i].text=text; arr[fv.editing.i].title=title; arr[fv.editing.i].t=new Date().toLocaleString('zh-CN'); }
    else arr.push({t:new Date().toLocaleString('zh-CN'),title,text});
  }
  save(); document.getElementById('fvEditor').hidden=true; fv.editing=null;
  document.getElementById('fvTitleInput').value=''; document.getElementById('fvInput').value='';
  renderFullList(); renderCalendar(); refreshCurrent(); toast('已保存');
}
function fvNew(){
  fv.editing=null;
  document.getElementById('fvTitleInput').value='';
  document.getElementById('fvInput').value='';
  document.getElementById('fvEditor').hidden=false;
  document.getElementById('fvTitleInput').focus();
}
function closeFullView(){ document.getElementById('fullView').hidden=true; fv={mode:null}; refreshCurrent(); }

/* ---------- 10. 设置 / 数据管理 ---------- */
function openSettings(){
  const size=(JSON.stringify(DB).length/1024).toFixed(1);
  const bakKey=latestBackupKey();
  const bakInfo = bakKey ? `已自动备份至 <b>${bakKey.slice(BAK_PREFIX.length)}</b>（每次保存自动滚动更新，仅保留最新一份）` : '尚未生成自动备份';
  openModal('⚙ 设置与数据管理',
    `<div class="hint">本地已存储数据约 <b>${size} KB</b>，自 ${DB.meta.created||'—'} 起累计。所有数据保存在本设备浏览器，永久留存。</div>
     <div class="rec-item"><div class="ri-text"><b>自动备份：</b>${bakInfo}。它与实时数据分开存放，恢复前不影响全部数据的完整性。</div></div>
     <div class="btn-row">
       <button class="btn" id="stRestore">♻ 从自动备份恢复</button>
       <button class="btn gold" id="stExport">⬇ 导出数据（迁移用）</button>
       <label class="btn ghost" style="cursor:pointer">⬆ 导入数据<input type="file" id="stImport" accept="application/json" hidden></label>
       <button class="btn ghost" id="stInstall">📱 安装到桌面/手机</button>
     </div>
     <div class="rec-item" style="margin-top:6px"><div class="ri-text" style="color:var(--ink-soft);font-size:12.5px">说明：自动备份会在每次「保存」时生成当日全量快照，并自动删除前一天旧备份，避免重复占用空间。需要换设备/长期归档时，用「导出数据」另存一份 JSON 即可。</div></div>
     <div class="hint" style="margin-top:14px">危险操作：清空将删除全部本地记录，不可恢复。</div>
     <div class="btn-row"><button class="btn ghost" id="stClear" style="color:#b00">🗑 清空全部数据</button></div>`,
    `<button class="btn" id="mCancel">关闭</button>`);
  document.getElementById('mCancel').onclick=closeModal;
  document.getElementById('stRestore').onclick=()=>{
    if(!bakKey){ toast('暂无可恢复的自动备份'); return; }
    if(confirm('将从自动备份恢复全部记录，覆盖当前未保存的更改。继续？')){
      if(restoreBackup()){ closeModal(); show('today'); toast('已从自动备份恢复'); } else toast('恢复失败'); }
  };
  document.getElementById('stExport').onclick=exportData;
  document.getElementById('stImport').onchange=importData;
  document.getElementById('stInstall').onclick=()=>{ if(deferredPrompt){deferredPrompt.prompt();} else toast('可用浏览器菜单「添加到主屏幕」'); };
  document.getElementById('stClear').onclick=()=>{
    if(confirm('确定清空全部数据？此操作不可恢复！')){ localStorage.removeItem(KEY); DB=blank(); save(); closeModal(); show('today'); toast('已清空'); }
  };
}
function exportData(){
  const blob=new Blob([JSON.stringify(DB,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=`未济数据备份_${todayStr()}.json`; a.click(); toast('已导出备份');
}
function importData(e){
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{ try{ const data=JSON.parse(r.result); DB=Object.assign(blank(),data); save(); closeModal(); show('today'); toast('导入成功'); }catch(err){ toast('文件格式错误'); } };
  r.readAsText(f);
}

/* ---------- 11. 导航与初始化 ---------- */
function show(view){
  document.querySelectorAll('.view').forEach(v=>v.hidden=true);
  document.getElementById('view-'+view).hidden=false;
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  V[view](); window.scrollTo({top:0,behavior:'smooth'});
  window.__view=view;
}
function refreshCurrent(){ V[window.__view||'today'](); }

document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>show(b.dataset.view));
document.getElementById('btnSettings').onclick=openSettings;
document.getElementById('modalClose').onclick=closeModal;
document.getElementById('modalMask').onclick=e=>{ if(e.target.id==='modalMask') closeModal(); };
document.getElementById('appMain').addEventListener('click',e=>{ const g=e.target.closest('[data-go]'); if(g) show(g.dataset.go); });
/* 全屏记录视图事件绑定 */
document.getElementById('fvBack').onclick=closeFullView;
document.getElementById('fvNew').onclick=fvNew;
document.getElementById('fvSave').onclick=fvSave;
document.getElementById('fvCancel').onclick=()=>{ document.getElementById('fvEditor').hidden=true; fv.editing=null; };
document.getElementById('fvSearch').oninput=e=>{ fv.filter=e.target.value; renderFullList(); };
document.getElementById('fvDate').onchange=e=>{ fv.date=e.target.value||null; renderFullList(); };
document.getElementById('fvAll').onclick=()=>{ fv.date=null; document.getElementById('fvDate').value=''; renderFullList(); };
/* 确保弹窗初始关闭 + ESC 关闭（脚本位于 body 末尾，DOM 已就绪） */
document.getElementById('modalMask').hidden=true;
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ if(!document.getElementById('fullView').hidden) closeFullView(); else closeModal(); } });

/* 时钟 + 每日自动更新 */
let lastDay=todayStr();
function tick(){
  const now=new Date();
  document.getElementById('clockDate').textContent=CN_DATE(fmtDate(now));
  document.getElementById('clockTime').textContent=`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const td=fmtDate(now);
  if(td!==lastDay){ lastDay=td; selDate=td; calMonth=td.slice(0,7); refreshCurrent(); toast('已自动更新至新的一天'); }
}
setInterval(tick,1000); tick();

/* PWA */
let deferredPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); deferredPrompt=e; });
if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{})); }

show('today');
