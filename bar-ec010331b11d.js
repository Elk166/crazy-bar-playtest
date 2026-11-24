const nightAsset = name => 'assets/night/' + name + '.webp';
for (const key of ['cover','room','walnut','lounge','bench']) {
  document.documentElement.style.setProperty('--night-'+key,'url("'+nightAsset(key)+'")');
}
function serviceIcon(step,method){
  const paths=[
    'M5 14l6-8 4 3-6 8z M12 6l2-3 4 3-2 3z M17 12l2 4-2 1-1-2z',
    method==='shake'?'M7 9l7-3 5 10-7 4z M6 7l6-3 2 2-7 3z':'M5 12h13l-2 8H7z M12 12l5-10 2 1-5 9z',
    'M4 6h16l-7 7v6l-2 2v-8z',
    'M3 15h18v2H3z M7 7h9l-3 5h-3z M11 12h2v3h-2z'
  ];
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="'+paths[step]+'"/></svg>';
}

const SaloonGuest=(()=>{
  const stage=document.getElementById('saloonGuest');
  let current=null, actor=null;
  function show(order){
    if(!order){
      stage.replaceChildren();stage.hidden=true;current=null;actor=null;return;
    }
    if(current===order)return;
    const previous=actor;
    if(previous){
      previous.classList.add('guest-out');
      setTimeout(()=>previous.remove(),440);
    }
    current=order;stage.hidden=false;
    actor=document.createElement('div');actor.className='guest-actor guest-in';
    const pose=document.createElement('div');pose.className='guest-pose';
    for(const state of ['idle','sip']){
      const image=new Image();image.alt='';image.className='pose-'+state;
      image.src=nightAsset(order.npc+'-'+state);pose.appendChild(image);
    }
    const bubble=document.createElement('div');bubble.className='guest-request';
    bubble.textContent=({少酸:'我喜欢酸少一点。',更酸:'我喜欢再酸一点。',不要太甜:'别太甜，谢谢。'})[order.note] || (order.note+'。');
    actor.append(pose,bubble);stage.appendChild(actor);
  }
  function taste(order){
    show(order);actor.classList.add('guest-tasting');
  }
  return {show,taste};
})();

function remindWaitingGuest(){
  const guest=D.order;
  if(!guest || guest.served || D.tasting || !['prep','bar'].includes(D.screen))return;
  const age=elapsedShift()-guest.arrived;
  const urgency=age>=65?2:age>=35?1:0;
  if(urgency<=guest.reminders)return;
  guest.reminders=urgency;
  toast(guest.npc+(urgency===2?' 又催了一声：「我的酒呢？」':' 出声催单：「快好了吗？」'));
}

function stockArt(id){
  return `<img class="stock-art" draggable="false" src="${nightAsset('stock-'+id)}" alt="">`;
}

;
/* =========================================================
   疯狂吧台 · DEMO 数据层
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const fmt = n => Math.round(n * 10) / 10;

const SPIRITS = {
  bourbon: { id:'bourbon', name:'波本威士忌', short:'波本', en:'BOURBON', liquid:'#C9772E', deep:'#8F4516', label:'#E9D3AC', band:'#7A2F18', cap:'#6B3A1C', bottle:'bourbon' },
  gin:     { id:'gin',     name:'金酒',       short:'金酒', en:'DRY GIN', liquid:'#DCEBF4', deep:'#AFCAD6', label:'#E8F3F1', band:'#2F6B62', cap:'#9AA7AD', bottle:'gin' },
  rum:     { id:'rum',     name:'白朗姆',     short:'朗姆', en:'WHITE RUM', liquid:'#EFF4F8', deep:'#C9D7DE', label:'#F3E6C8', band:'#B08A3E', cap:'#C8A24B', bottle:'rum' }
};

const AUX = {
  lemon:    { id:'lemon',    name:'柠檬汁', short:'柠檬汁', role:'acid',    unit:'ml', color:'#E8C93C', bottle:'lemon',   label:'LEMON' },
  lime:     { id:'lime',     name:'青柠汁', short:'青柠汁', role:'acid',    unit:'ml', color:'#A9C94E', bottle:'lime',    label:'LIME' },
  syrup:    { id:'syrup',    name:'单糖浆', short:'糖浆',   role:'sweet',   unit:'ml', color:'#E2BE78', bottle:'syrup',   label:'SYRUP' },
  tonic:    { id:'tonic',    name:'汤力水', short:'汤力水', role:'fizz',    unit:'ml', color:'#CFE9EE', bottle:'tonic',   label:'TONIC' },
  egg:      { id:'egg',      name:'蛋清',   short:'蛋清',   role:'egg',     unit:'份', color:'#F6EBDD', bottle:'egg',     label:'EGG' },
  mint:     { id:'mint',     name:'薄荷叶', short:'薄荷',   role:'mint',    unit:'片', color:'#5FAE67', bottle:'mint',    label:'MINT' },
  limewedge:{ id:'limewedge',name:'青柠角', short:'青柠角', role:'garnish', unit:'块', color:'#8CC152', bottle:'limewedge',label:'LIME' },
  bitters:  { id:'bitters',  name:'安格斯特拉苦精', short:'苦精', role:'bitter', unit:'滴', color:'#7A2E1E', bottle:'bitters', label:'BITTERS' },
  sugar:    { id:'sugar',    name:'方糖',   short:'方糖',   role:'sweet',   unit:'块', color:'#F7F1E4', bottle:'sugar',   label:'SUGAR' }
};

const ICES = {
  big:     { id:'big',     name:'大方冰', short:'大方冰' },
  spear:   { id:'spear',   name:'长条冰', short:'长条冰' },
  crushed: { id:'crushed', name:'碎冰',   short:'碎冰' }
};

const GLASSES = {
  coupe:   { id:'coupe',   name:'文香杯', short:'文香杯', en:'COUPE' },
  highball:{ id:'highball',name:'高球杯', short:'高球杯', en:'HIGHBALL' },
  collins: { id:'collins', name:'长饮杯', short:'长饮杯', en:'COLLINS' },
  rocks:   { id:'rocks',   name:'古典杯', short:'古典杯', en:'ROCKS' },
  shaker:  { id:'shaker',  name:'摇酒壶', short:'摇酒壶', en:'SHAKER' }
};
const GLASS_ORDER = ['rocks','collins','highball','coupe'];

const RECIPES = {
  sour: {
    id:'sour', name:'威士忌酸', en:'Whisky Sour', glass:'coupe', ice:'big', method:'shake', methodName:'Shake 摇和',
    pool:'sour', garnish:'cherry',
    ingredients:[
      { id:'bourbon', role:'spirit', unit:'ml', tiers:[35,45,55] },
      { id:'lemon',   role:'acid',   unit:'ml', tiers:[16,22,28] },
      { id:'syrup',   role:'sweet',  unit:'ml', tiers:[10,15,20] },
      { id:'egg',     role:'egg',    unit:'份', tiers:[0,1,2] }
    ],
    notes:['更酸','少酸','想要泡沫','不要蛋清','甜一点','不要太甜','清淡一点'],
    tip:'摇和到壶身结霜，滤进文香杯，蛋清泡沫是这杯酒的灵魂。'
  },
  gin: {
    id:'gin', name:'金汤力', en:'Gin & Tonic', glass:'highball', ice:'spear', method:'build', methodName:'杯中直调',
    pool:'gin', garnish:'lime',
    ingredients:[
      { id:'gin',      role:'spirit', unit:'ml', tiers:[35,45,55] },
      { id:'tonic',    role:'fizz',   unit:'ml', tiers:[90,120,150] },
      { id:'limewedge',role:'garnish',unit:'块', tiers:[0,1,2] }
    ],
    notes:['少气泡','度数低一点','酒味重一点'],
    tip:'汤力水最后沿杯壁注入，保住气泡，青柠角轻轻一挤。'
  },
  mojito: {
    id:'mojito', name:'莫吉托', en:'Mojito', glass:'collins', ice:'crushed', method:'stir', methodName:'画圈搅拌',
    pool:'mojito', garnish:'mint',
    ingredients:[
      { id:'rum',   role:'spirit', unit:'ml', tiers:[35,45,55] },
      { id:'lime',  role:'acid',   unit:'ml', tiers:[14,20,26] },
      { id:'syrup', role:'sweet',  unit:'ml', tiers:[10,15,20] },
      { id:'mint',  role:'mint',   unit:'片', tiers:[2,4,6] }
    ],
    notes:['少薄荷','不要太甜','清爽','更酸','少酸'],
    tip:'薄荷只轻捣出香，别捣烂；碎冰装满杯，气泡才挂得住。'
  },
  of: {
    id:'of', name:'老式鸡尾酒', en:'Old Fashioned', glass:'rocks', ice:'big', method:'stir', methodName:'Stir 搅拌',
    pool:'of', garnish:'orange',
    ingredients:[
      { id:'bourbon', role:'spirit', unit:'ml', tiers:[35,45,55] },
      { id:'sugar',   role:'sweet',  unit:'块', tiers:[0,1,2] },
      { id:'bitters', role:'bitter', unit:'滴', tiers:[1,2,4] }
    ],
    notes:['少苦','清淡一点','浓郁一点','不要糖','更苦'],
    tip:'慢慢搅，让冰化开一点；苦精点到为止，橙皮油是最后一笔。'
  }
};

const NOTE_RULES = {
  '更酸':[{role:'acid',t:2}],
  '少酸':[{role:'acid',t:0}],
  '甜一点':[{role:'sweet',t:2}],
  '更甜':[{role:'sweet',t:2}],
  '不甜':[{role:'sweet',t:0}],
  '不要太甜':[{role:'sweet',t:0}],
  '不要糖':[{role:'sweet',t:0}],
  '清淡一点':[{role:'spirit',t:0}],
  '清爽':[{role:'sweet',t:0},{role:'mint',t:2}],
  '想要泡沫':[{role:'egg',t:2}],
  '不要蛋清':[{role:'egg',t:0}],
  '少气泡':[{role:'fizz',t:0}],
  '更苦':[{role:'bitter',t:'up'}],
  '少苦':[{role:'bitter',t:0}],
  '少薄荷':[{role:'mint',t:0}],
  '浓郁一点':[{role:'spirit',t:2}],
  '酒味重一点':[{role:'spirit',t:2}],
  '度数低一点':[{role:'spirit',t:0}],
  '淡一点':[{role:'spirit',t:0}]
};

const TIER_NAME = ['轻','中','重'];

/* 演示用订单顺序：四种酒各来一次 */
const DEMO_SEQUENCE = ['sour','gin','mojito','of'];

const ANIMAL_NAMES = {
  fox:'fox', cat:'cat', bear:'bear', panda:'panda', rabbit:'rabbit',bison:'bison',heron:'heron',armadillo:'armadillo',rooster:'rooster',opossum:'opossum',moose:'moose',badger:'badger',frog:'frog',goat:'goat',vulture:'vulture'
};
const HAPPY_LINES = ['good good good','yes yes yes','这杯有灵魂！','完美，就是这个味！'];
const SAD_LINES = ['有点淡…','杯型不太对','再练练？','嗯…还差一点'];

const SPIRIT_NAME = id => SPIRITS[id] ? SPIRITS[id].name : '没拿';
const AUX_NAME = id => AUX[id] ? AUX[id].short : id;

function makeOrder(recipeId, note){
  const R = RECIPES[recipeId];
  const n = note || pick(R.notes);
  const rules = NOTE_RULES[n] || [];
  const ingredients = R.ingredients.map(ing => {
    let tier = 1;
    for(const r of rules){
      if(r.role === ing.role){
        tier = r.t === 'up' ? 2 : r.t;
      }
    }
    const target = ing.unit === 'ml' ? ing.tiers[tier] : ing.tiers[tier];
    return { ...ing, tier, target, name: SPIRITS[ing.id] ? SPIRITS[ing.id].name : AUX[ing.id].name,
             short: SPIRITS[ing.id] ? SPIRITS[ing.id].short : AUX[ing.id].short,
             color: SPIRITS[ing.id] ? SPIRITS[ing.id].liquid : AUX[ing.id].color };
  });
  return {
    recipeId, note:n, name:R.name, en:R.en, glass:R.glass, ice:R.ice, method:R.method,
    methodName:R.methodName, garnish:R.garnish, tip:R.tip, ingredients,
    tierName: TIER_NAME[ingredients.find(i=>i.role==='spirit').tier]
  };
}

function orderCardHTML(order, compact){
  const rows = order.ingredients.map(i => {
    const amount = i.target > 0 ? `<b>${i.target}${i.unit}</b>` : `<b class="void">不加</b>`;
    return `<div class="req-row"><span class="req-dot" data-ing="${i.id}"></span><span class="req-name">${i.short}</span>${amount}</div>`;
  }).join('');
  return `<div class="order-card ${compact?'compact':''}">
    <div class="oc-head">
      <div><div class="oc-kicker">ORDER · 第 ${order.no||1} 杯</div>
      <div class="oc-title">${order.name}<span>${order.en}</span></div></div>
      <div class="oc-tier">${order.tierName}</div>
    </div>
    ${order.note?`<div class="oc-note"><i>“</i>${order.note}<i>”</i><span class="oc-note-tip">客人要求</span></div>`:''}
    <div class="oc-grid">${rows}</div>
    <div class="oc-foot">
      <span class="tag">${GLASSES[order.glass].name}</span>
      <span class="tag">${ICES[order.ice].name}</span>
      <span class="tag">${order.method==='shake'?'Shake 摇和':'Stir 搅拌'}</span>
      ${order.garnish?`<span class="tag">装饰 · ${order.garnish==='lime'?'青柠':order.garnish==='mint'?'薄荷':order.garnish==='orange'?'橙皮':'樱桃'}</span>`:''}
    </div>
  </div>`;
}

/* ===== v2 关卡 ===== */
const LEVELS2 = [
  {id:1, drink:'gin', name:'金汤力', sub:'金酒 · 高球杯 · 直调', unlock:'bourbon'},
  {id:2, drink:'sour', name:'威士忌酸', sub:'波本 · 文香杯 · 摇和', unlock:'rum'},
  {id:3, drink:'mojito', name:'莫吉托', sub:'白朗姆 · 长饮杯 · 搅拌', unlock:null}
];
const SAVE_KEY2='crazy_bar_v2_save';
let SAVE={muted:false,unlocked:1,stars:{},coins:0};
try{ const raw=localStorage.getItem(SAVE_KEY2); if(raw) SAVE=Object.assign(SAVE,JSON.parse(raw)); }catch(e){}
function saveGame(){ try{ localStorage.setItem(SAVE_KEY2,JSON.stringify(SAVE)); }catch(e){} }

SAVE.unlocked=Math.max(1,Math.min(3,Number(SAVE.unlocked)||1));

;
const BGM=(()=>{
  const player=new Audio();
  player.loop=true;
  player.preload='auto';
  player.setAttribute('playsinline','');
  let mixContext,musicGain,duckUntil=0;
  function mix(){
    const level=(SAVE.musicVolume??.35)*.42;
    const target=performance.now()<duckUntil?level*.27:level;
    if(musicGain)musicGain.gain.setTargetAtTime(target,mixContext.currentTime,target<level?.018:.15);
    else player.volume=target;
  }
  let restore;
  function duck(seconds){
    duckUntil=Math.max(duckUntil,performance.now()+seconds*1000);mix();
    clearTimeout(restore);restore=setTimeout(mix,Math.ceil(duckUntil-performance.now())+5);
  }
  let started=false;
  function sync(){
    mix();
    if(SAVE.muted||document.hidden||SAVE.musicVolume===0)player.pause();
    else if(started && player.paused)player.play().catch(()=>{});
  }
  function start(){
    started=true;
    if(!player.src)player.src=new URL('music/bar.mp3',location.href.includes('/src/dev.html')?new URL('../',location.href):location.href).href;
    sync();
  }
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('pagehide',()=>player.pause());
  return {start,sync,duck};
})();
// Recorded instrument samples arranged for the saloon. Credits travel with the HTML.
const SFX=(()=>{
  const credits='Instrument recordings edited by nbrosowsky, https://github.com/nbrosowsky/tonejs-instruments (CC BY 3.0, https://creativecommons.org/licenses/by/3.0/). Violin, bassoon and xylophone: VSO2. Cello: flcellogrl. Acoustic guitar: Iowa. Repitched and arranged for Crazy Bar.';
  const instruments={cello:['cello-A2',45],guitar:['guitar-acoustic-A3',57],wood:['xylophone-G4',67]};

  const buffers={}, voices=new Set();
  let ctx,loading;
  let pending=null;
  const url=name=>'assets/audio/'+name+'.mp3';
  function preload(){
    const C=window.AudioContext||window.webkitAudioContext;
    if(!C)return Promise.resolve();
    ctx??=new C();
    loading??=Promise.all(Object.values(instruments).map(async ([name])=>{
      if(buffers[name])return;
      const response=await fetch(url(name));
      if(!response.ok)throw Error('音效加载失败 '+response.status);
      buffers[name]=await ctx.decodeAudioData(await response.arrayBuffer());
    })).catch(error=>{loading=null;console.warn(error);});
    return loading;
  }
  function unlock(){
    BGM.start();
    const ready=preload();
    if(ctx && ctx.state!=='running')ctx.resume().catch(()=>{});
    return ready;
  }
  function play(instrument,note,length,volume,delay=0,offset=0){
    const [name,root]=instruments[instrument];
    if(SAVE.muted||document.hidden)return;
    if(!ctx||!buffers[name]){
      pending={args:[instrument,note,length,volume,delay,offset],at:performance.now()};
      unlock().then(()=>{
        const request=pending;pending=null;
        if(request && buffers[name] && performance.now()-request.at<1200)play(...request.args);
      });
      return;
    }
    if((SAVE.effectsVolume??1)>0)BGM.duck(length+delay+.28);
    const s=ctx.createBufferSource(),g=ctx.createGain(),t=ctx.currentTime+delay;
    s.buffer=buffers[name];s.playbackRate.value=2**((note-root)/12);
    g.gain.setValueAtTime(volume*(SAVE.effectsVolume??1),t);g.gain.setTargetAtTime(.0001,t+length,.045);
    s.connect(g);g.connect(ctx.destination);voices.add(s);
    s.onended=()=>{voices.delete(s);s.disconnect();g.disconnect();};
    s.start(t,Math.min(offset,s.buffer.duration*.35));s.stop(t+length+.25);
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)for(const s of voices)s.stop();});
  const hit=(n=64)=>play('wood',n,.095,.31);
  const pluck=(n,delay=0)=>play('guitar',n,.24,.24,delay);
  return {unlock,preload,credits,tick:()=>hit(55),pick:()=>pluck(57),ding:()=>pluck(69),ice:()=>{hit(79);play('wood',84,.13,.19,.065);},
    pour:(d=.7)=>play('cello',50,Math.min(d,.43),.13),shake:()=>{hit(56);play('wood',63,.08,.24,.07);},
    stir:()=>play('wood',75,.18,.22),whoosh:()=>play('cello',43,.19,.13),
    happy:()=>{pluck(60);pluck(64,.11);pluck(69,.23);},sad:()=>{play('cello',53,.22,.26);play('cello',50,.4,.22,.23);}
  };
})();

;
/* =========================================================
   疯狂吧台 · DEMO 模型库（全部内联 SVG）
   ========================================================= */
let _uid = 0;
const gid = () => 'm' + (++_uid);

function grad(id, stops, x1='0%', y1='0%', x2='0%', y2='100%'){
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${
    stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2]!==undefined?` stop-opacity="${s[2]}"`:''}/>`).join('')
  }</linearGradient>`;
}
function rgrad(id, stops){
  return `<radialGradient id="${id}" cx="50%" cy="50%" r="50%">${
    stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2]!==undefined?` stop-opacity="${s[2]}"`:''}/>`).join('')
  }</radialGradient>`;
}

const ICON = {
  coin: `<svg viewBox="0 0 24 24" class="ico"><circle cx="12" cy="12" r="9" fill="#F0B64C" stroke="#8B5A18" stroke-width="1.6"/><circle cx="12" cy="12" r="6.2" fill="none" stroke="#FFE1A0" stroke-width="1.4" opacity=".9"/><path d="M9.6 9.4h4.8M12 9.4v5.2" stroke="#7A4A12" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  star: `<svg viewBox="0 0 24 24" class="ico"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z" fill="#FFC24B" stroke="#8B5A18" stroke-width="1.2" stroke-linejoin="round"/></svg>`,
  starOff: `<svg viewBox="0 0 24 24" class="ico"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.28)" stroke-width="1.2"/></svg>`,
  check: `<svg viewBox="0 0 24 24" class="ico"><path d="M4 12.5l5 5L20 6.8" fill="none" stroke="#8FE0B0" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" class="ico"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  arrowR: `<svg viewBox="0 0 24 24" class="ico"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  sound: `<svg viewBox="0 0 24 24" class="ico"><path d="M4 9h3l4-4v14l-4-4H4z" fill="currentColor"/><path d="M15 8.5a5 5 0 010 7M17.8 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  mute: `<svg viewBox="0 0 24 24" class="ico"><path d="M4 9h3l4-4v14l-4-4H4z" fill="currentColor"/><path d="M15 9l6 6M21 9l-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  info: `<svg viewBox="0 0 24 24" class="ico"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 10.5v6M12 7.3v.2" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>`,
  hand: `<svg viewBox="0 0 24 24" class="ico"><path d="M8 13V6.5a1.5 1.5 0 013 0V12m0-6.2a1.5 1.5 0 013 0V12m0-4.4a1.5 1.5 0 013 0v8.2c0 3.4-2.5 5.6-5.8 5.6-2.4 0-3.7-1-5-2.7L4.4 15a1.6 1.6 0 012.5-2L8 14.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`
};

/* ---------------------------------------------------------
   玻璃 / 金属 / 液体基础渐变
   --------------------------------------------------------- */
function glassDefs(){
  const a=gid(), b=gid(), c=gid(), d=gid(), e=gid();
  return {
    glass: grad(a,[[0,'rgba(255,255,255,.38)'],[.18,'rgba(255,255,255,.12)'],[.55,'rgba(255,255,255,.05)'],[1,'rgba(255,255,255,.18)']],'0%','0%','100%','0%'),
    glassSide: grad(b,[[0,'rgba(255,255,255,.5)'],[.1,'rgba(255,255,255,.06)'],[.85,'rgba(255,255,255,.02)'],[1,'rgba(255,255,255,.22)']],'0%','0%','100%','0%'),
    metal: grad(c,[[0,'#7C8B93'],[.12,'#EAF1F4'],[.32,'#B9C6CC'],[.5,'#F7FBFD'],[.72,'#96A5AC'],[.9,'#DCE6EA'],[1,'#6C7A82']],'0%','0%','100%','0%'),
    metalV: grad(d,[[0,'#F4F9FB'],[.25,'#A9B7BE'],[.55,'#E6EEF1'],[.8,'#83929A'],[1,'#D7E1E5']],'0%','0%','0%','100%'),
    shadow: rgrad(e,[[0,'rgba(0,0,0,.42)'],[.7,'rgba(0,0,0,.16)'],[1,'rgba(0,0,0,0)']]),
    ids:{a,b,c,d,e}
  };
}

/* ---------------------------------------------------------
   酒瓶 / 配料瓶 独立建模
   --------------------------------------------------------- */
function bottleSVG(kind, opt={}){
  if(kind==='egg'||kind==='mint'||kind==='sugar'||kind==='limewedge') return itemSVG(kind);
  const S = SPIRITS[kind];
  const A = AUX[kind];
  const v = kind==='bourbon'? 'bourbon' : kind==='gin'? 'gin' : kind==='rum'? 'rum'
          : kind==='tonic'? 'tonic' : kind==='syrup'? 'syrup' : kind==='bitters'? 'bitters'
          : kind==='egg'? 'egg' : kind==='mint'? 'mint' : kind==='sugar'? 'sugar'
          : kind==='limewedge'? 'limewedge' : 'juice';
  const liquid = S ? S.liquid : A ? A.color : '#D9A441';
  const deep = S ? S.deep : shade(liquid, -.28);
  const label = S ? S.label : '#F3E5C8';
  const band = S ? S.band : '#8B5A22';
  const cap = S ? S.cap : '#C8A24B';
  const en = S ? S.en : (A ? A.label : '');
  const nm = S ? S.short : (A ? A.short : '');
  const id = gid(), cl = gid(), lid = gid(), lg = gid(), capid = gid();
  const defs = `<defs>
    ${grad(id,[[0,'rgba(255,255,255,.30)'],[.14,'rgba(255,255,255,.08)'],[.62,'rgba(255,255,255,.03)'],[.86,'rgba(255,255,255,.05)'],[1,'rgba(255,255,255,.26)']],'0%','0%','100%','0%')}
    ${grad(lid,[[0,shade(liquid,.1)],[.55,liquid],[1,deep]])}
    ${grad(lg,[[0,'rgba(255,255,255,.55)'],[1,'rgba(255,255,255,.02)']],'0%','0%','100%','0%')}
    ${grad(capid,[[0,shade(cap,.25)],[.4,cap],[1,shade(cap,-.3)]],'0%','0%','100%','0%')}
    <clipPath id="${cl}"><path d="${bottleBodyPath(v)}"/></clipPath>
  </defs>`;

  const body = bottleBodyPath(v);
  const liquidTop = v==='bourbon'?132 : v==='gin'?150 : v==='rum'?146 : v==='tonic'?168
                   : v==='syrup'?150 : v==='bitters'?186 : v==='juice'?150 : 300;

  let inner = '';
  if(false){
  } else {
    /* 玻璃瓶体 */
    inner = `<g clip-path="url(#${cl})">
      <rect x="0" y="${liquidTop}" width="120" height="${300-liquidTop}" fill="url(#${lid})" opacity=".92"/>
      <rect x="0" y="${liquidTop}" width="120" height="9" fill="${shade(liquid,.22)}" opacity=".65"/>
      <path d="M19 77L47 95L55 293Z M85 78L96 291L68 272Z" fill="#ffe4bc" opacity=".28"/>
      <path d="M38 280L61 190L83 282Z" fill="#402838" opacity=".18"/>
      <rect x="0" y="270" width="120" height="30" fill="${shade(liquid,-.22)}" opacity=".55"/>
      <path d="M${v==='bourbon'?32:34} 90 Q${v==='bourbon'?32:34} 290 40 290" stroke="rgba(255,255,255,.5)" stroke-width="5" fill="none" opacity=".55"/>
      <path d="M${v==='bourbon'?88:86} 120 L${v==='bourbon'?88:86} 275" stroke="rgba(255,255,255,.24)" stroke-width="4" fill="none"/>
    </g>`;
    /* 标签 */
    const ly = v==='bitters'?208 : v==='tonic'?205 : v==='syrup'?196 : 186;
    const lh = v==='bitters'?46 : v==='tonic'?54 : v==='syrup'?58 : 66;
    const lx = v==='bourbon'?32 : v==='tonic'?40 : 36;
    const lw = v==='bourbon'?56 : v==='tonic'?40 : 48;
    inner += `<g>
      <rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" rx="4" fill="${label}" stroke="rgba(70,40,18,.25)" stroke-width="1"/>
      <rect x="${lx}" y="${ly}" width="${lw}" height="7" fill="${band}" opacity=".9"/>
      <text x="${lx+lw/2}" y="${ly+22}" text-anchor="middle" font-family="Georgia,serif" font-size="8.5" font-weight="700" fill="${band}" letter-spacing="1">${en}</text>
      <text x="${lx+lw/2}" y="${ly+36}" text-anchor="middle" font-family="sans-serif" font-size="5.2" fill="rgba(50,30,16,.7)" letter-spacing=".6">${nm}</text>
      <path d="M${lx+5} ${ly+lh-9} H${lx+lw-5}" stroke="${band}" stroke-width=".7" opacity=".5"/>
    </g>`;
  }

  let capMark = '';
  if(v==='bitters'){
    capMark = `<rect x="52" y="46" width="16" height="16" rx="3" fill="url(#${capid})"/>
      <rect x="55" y="34" width="10" height="14" rx="3" fill="url(#${capid})"/>
      <g fill="rgba(40,25,15,.6)">${[0,1,2].map(i=>`<circle cx="${57+i*3}" cy="37" r=".8"/>`).join('')}</g>`;
  } else if(v==='syrup'){
    capMark = `<path d="M54 62 L66 62 L66 50 L62 44 L58 44 L54 50Z" fill="url(#${capid})"/>
      <path d="M57 44 L63 44 L61 28 L59 28Z" fill="#B9C3C7"/>
      <rect x="51" y="60" width="18" height="10" rx="3" fill="#9AA7AD"/>`;
  } else if(v==='tonic'){
    capMark = `<rect x="46" y="94" width="28" height="14" rx="3" fill="url(#${capid})"/>
      <g stroke="rgba(60,70,74,.5)" stroke-width=".8">${[0,1,2,3,4,5,6].map(i=>`<path d="M${48+i*4} 95 L${48+i*4} 107"/>`).join('')}</g>`;
  } else {
    capMark = `<rect x="${v==='bourbon'?46:46}" y="${v==='bourbon'?48:46}" width="${v==='bourbon'?28:28}" height="24" rx="4" fill="url(#${capid})"/>
      <rect x="${v==='bourbon'?45:45}" y="${v==='bourbon'?44:42}" width="30" height="8" rx="4" fill="${shade(cap,.3)}" opacity=".9"/>`;
  }

  return `<svg class="model bottle bottle-${v}" viewBox="0 0 120 300" xmlns="http://www.w3.org/2000/svg">
    ${defs}
    <ellipse cx="60" cy="290" rx="38" ry="8" fill="rgba(0,0,0,.30)"/>
    <path d="${body}" fill="url(#${id})" stroke="rgba(255,255,255,.42)" stroke-width="1.6"/>
    ${inner}
    <path d="${body}" fill="none" stroke="rgba(255,255,255,.30)" stroke-width="1.2"/>
    <path d="${bottleShine(v)}" fill="rgba(255,255,255,.30)" filter="blur(.5px)"/>
    ${capMark}
    <rect x="${v==='bourbon'?46:46}" y="${v==='bourbon'?70:66}" width="28" height="4" fill="rgba(255,255,255,.5)" opacity=".5"/>
    <ellipse cx="60" cy="${v==='bourbon'?52:50}" rx="14" ry="3.4" fill="rgba(255,255,255,.55)" opacity=".7"/>
  </svg>`;
}

function bottleBodyPath(v){
  if(v==='bourbon') return 'M42 286 L34 286 Q30 286 30 280 L30 152 C30 128 44 120 46 96 L46 62 Q46 56 54 56 L66 56 Q74 56 74 62 L74 96 C76 120 90 128 90 152 L90 280 Q90 286 86 286 L78 286 Z';
  if(v==='gin') return 'M40 286 L34 286 Q30 286 30 280 L30 118 Q30 108 38 104 L44 101 L44 64 Q44 56 52 56 L68 56 Q76 56 76 64 L76 101 L82 104 Q90 108 90 118 L90 280 Q90 286 86 286 Z';
  if(v==='rum') return 'M42 286 L34 286 Q30 286 30 280 L30 140 C30 118 45 112 47 92 L47 60 Q47 54 55 54 L65 54 Q73 54 73 60 L73 92 C75 112 90 118 90 140 L90 280 Q90 286 86 286 Z';
  if(v==='tonic') return 'M48 286 L42 286 Q38 286 38 280 L38 176 C38 160 46 154 48 140 L48 112 Q48 106 54 106 L66 106 Q72 106 72 112 L72 140 C74 154 82 160 82 176 L82 280 Q82 286 78 286 Z';
  if(v==='syrup') return 'M46 286 L38 286 Q34 286 34 280 L34 170 C34 150 42 144 44 126 L44 84 Q44 78 50 78 L70 78 Q76 78 76 84 L76 126 C78 144 86 150 86 170 L86 280 Q86 286 82 286 Z';
  if(v==='bitters') return 'M48 286 L40 286 Q36 286 36 280 L36 210 C36 194 44 190 46 178 L46 78 Q46 72 52 72 L68 72 Q74 72 74 78 L74 178 C76 190 84 194 84 210 L84 280 Q84 286 80 286 Z';
  if(v==='juice') return 'M46 286 L38 286 Q34 286 34 280 L34 158 C34 140 42 134 44 120 L44 88 Q44 82 50 82 L70 82 Q76 82 76 88 L76 120 C78 134 86 140 86 158 L86 280 Q86 286 82 286 Z';
  return 'M42 286 L34 286 Q30 286 30 280 L30 140 C30 120 44 114 46 96 L46 60 Q46 54 54 54 L66 54 Q74 54 74 60 L74 96 C76 114 90 120 90 140 L90 280 Q90 286 86 286 Z';
}
function bottleShine(v){
  const x = v==='bitters'||v==='tonic' ? 44 : 38;
  return `M${x} 120 Q${x-2} 230 ${x+4} 274 L${x+9} 274 Q${x+4} 220 ${x+7} 120 Z`;
}

function shade(hex, amt){
  const h = hex.replace('#','');
  const n = h.length===3 ? h.split('').map(c=>c+c).join('') : h;
  let r=parseInt(n.slice(0,2),16), g=parseInt(n.slice(2,4),16), b=parseInt(n.slice(4,6),16);
  const f = v => amt>=0 ? Math.round(v+(255-v)*amt) : Math.round(v*(1+amt));
  r=clamp(f(r),0,255); g=clamp(f(g),0,255); b=clamp(f(b),0,255);
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function leaf(cx, cy, rot, len, color){
  return `<ellipse cx="${cx}" cy="${cy}" rx="${len/2}" ry="4.2" fill="${color}" transform="rotate(${rot} ${cx} ${cy})"/>
    <path d="M${cx-len/2} ${cy} L${cx+len/2} ${cy}" stroke="rgba(255,255,255,.3)" stroke-width=".8" transform="rotate(${rot} ${cx} ${cy})"/>`;
}

/* 非瓶装配料：蛋清 / 薄荷 / 方糖 / 青柠角 */
function itemSVG(kind){
  if(kind==='egg'){
    return `<svg class="model item item-egg" viewBox="0 0 120 300">
      <ellipse cx="60" cy="270" rx="38" ry="9" fill="rgba(0,0,0,.3)"/>
      <path d="M24 236 Q24 252 60 252 Q96 252 96 236 L92 224 L28 224Z" fill="#EFE2CC" stroke="#C9B89C" stroke-width="1.5"/>
      <ellipse cx="60" cy="224" rx="32" ry="9" fill="#FFF7E9"/>
      <ellipse cx="60" cy="226" rx="25" ry="6" fill="#F8E7CE"/>
      <path d="M45 214 Q45 190 60 188 Q75 190 75 214 Q75 226 60 226 Q45 226 45 214Z" fill="#FBF3E6" stroke="#E2D2BC" stroke-width="1.2"/>
      <path d="M49 210 Q52 196 60 195" stroke="#fff" stroke-width="2.4" fill="none" opacity=".8" stroke-linecap="round"/>
      <ellipse cx="83" cy="218" rx="10" ry="13" fill="#FBF3E6" stroke="#E2D2BC" stroke-width="1.2" transform="rotate(18 83 218)"/>
      <path d="M60 244 Q60 232 60 226" stroke="#F7C34E" stroke-width="0" fill="none"/>
      <circle cx="60" cy="236" r="5" fill="#F7C34E" opacity=".45"/>
    </svg>`;
  }
  if(kind==='mint'){
    return `<svg class="model item item-mint" viewBox="0 0 120 300">
      <ellipse cx="60" cy="276" rx="36" ry="8" fill="rgba(0,0,0,.3)"/>
      <g transform="translate(0,-6)">
        <path d="M60 276 Q58 220 60 160" stroke="#3E7C46" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M60 240 Q38 226 30 202" stroke="#3E7C46" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <path d="M60 230 Q82 216 90 192" stroke="#3E7C46" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        ${leaf(32,198,-40,30,'#5FAE67')}${leaf(90,188,38,28,'#69BB72')}
        ${leaf(48,170,-34,26,'#7CCB84')}${leaf(72,158,30,26,'#4F9A58')}
        ${leaf(60,144,0,24,'#8BD492')}${leaf(38,226,-58,20,'#6CB974')}
        ${leaf(84,228,54,20,'#74C27C')}
        <rect x="55" y="246" width="10" height="12" rx="3" fill="#C8A24B" opacity=".9"/>
      </g>
    </svg>`;
  }
  if(kind==='sugar'){
    return `<svg class="model item item-sugar" viewBox="0 0 120 300">
      <ellipse cx="60" cy="272" rx="36" ry="8" fill="rgba(0,0,0,.3)"/>
      <path d="M32 176 L88 176 L84 266 Q84 276 74 276 L46 276 Q36 276 36 266Z" fill="rgba(255,255,255,.13)" stroke="rgba(255,255,255,.45)" stroke-width="1.5"/>
      <rect x="40" y="190" width="40" height="70" rx="6" fill="#F3EAD8" opacity=".92"/>
      ${[[48,200],[62,198],[72,206],[52,214],[66,218],[44,228],[58,234],[74,230],[50,246],[68,248]].map(([x,y])=>`<rect x="${x-6}" y="${y-6}" width="12" height="12" rx="2.5" fill="#FFFDF7" stroke="#D8CBB4" stroke-width=".8"/>`).join('')}
      <rect x="30" y="164" width="60" height="16" rx="6" fill="url(#mcapSugar)" stroke="#8B5A18" stroke-width="1"/>
      <defs><linearGradient id="mcapSugar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E8C37A"/><stop offset=".5" stop-color="#C8A24B"/><stop offset="1" stop-color="#8B6524"/></linearGradient></defs>
      <path d="M42 182 Q42 250 48 264" stroke="rgba(255,255,255,.6)" stroke-width="3" fill="none" opacity=".6"/>
    </svg>`;
  }
  return `<svg class="model item item-limewedge" viewBox="0 0 120 300">
    <ellipse cx="60" cy="272" rx="40" ry="9" fill="rgba(0,0,0,.3)"/>
    <rect x="22" y="246" width="76" height="12" rx="5" fill="#8B5A2B" stroke="#5E3A1A" stroke-width="1"/>
    <g transform="translate(-6,4)">
      <path d="M34 244 A34 34 0 0 1 102 244 Z" fill="#8CC152" stroke="#5E8F2E" stroke-width="1.6"/>
      <path d="M39 244 A29 29 0 0 1 97 244 Z" fill="#D7EC9A"/>
      ${[0,1,2,3,4,5].map(i=>`<path d="M68 244 L${40+i*8.6} 216 L${45+i*8.6} 244" stroke="#F2FAD8" stroke-width="1.2" opacity=".85" fill="none"/>`).join('')}
      <path d="M36 244 Q68 256 100 244" stroke="#EAF6C2" stroke-width="2.2" fill="none"/>
      <path d="M42 238 Q42 216 60 210" stroke="rgba(255,255,255,.5)" stroke-width="3" fill="none" stroke-linecap="round"/>
    </g>
    <g transform="translate(30,-26) scale(.72) rotate(18 60 240)">
      <path d="M34 244 A34 34 0 0 1 102 244 Z" fill="#9BCB5C" stroke="#5E8F2E" stroke-width="1.6"/>
      <path d="M39 244 A29 29 0 0 1 97 244 Z" fill="#E1F2B4"/>
      ${[0,1,2,3,4].map(i=>`<path d="M68 244 L${40+i*10.3} 220 L${46+i*10.3} 244" stroke="#F6FBE8" stroke-width="1.2" opacity=".8" fill="none"/>`).join('')}
    </g>
  </svg>`;
}

/* ---------------------------------------------------------
   杯型 + 成品鸡尾酒（液体 / 冰 / 泡沫 / 气泡 / 装饰）
   --------------------------------------------------------- */
const GLASS_GEO = {
  coupe: { outer:'M32 76 C32 114 54 136 80 136 C106 136 128 114 128 76 Z',
           inner:'M40 80 C40 110 58 128 80 128 C102 128 120 110 120 80 Z',
           top:80, bottom:128, rim:76, rimRx:48, rimRy:9, stem:true },
  highball: { outer:'M48 54 L112 54 L107 210 Q107 220 97 220 L63 220 Q53 220 53 210 Z',
              inner:'M55 58 L105 58 L100 208 Q100 214 94 214 L66 214 Q60 214 60 208 Z',
              top:58, bottom:214, rim:54, rimRx:32, rimRy:6 },
  collins: { outer:'M46 30 L114 30 L108 212 Q108 222 98 222 L62 222 Q52 222 52 212 Z',
             inner:'M53 34 L107 34 L101 210 Q101 216 95 216 L65 216 Q59 216 59 210 Z',
             top:34, bottom:216, rim:30, rimRx:34, rimRy:7 },
  rocks: { outer:'M36 108 Q36 100 44 100 L116 100 Q124 100 124 108 L122 208 Q122 222 110 222 L50 222 Q38 222 38 208 Z',
           inner:'M45 108 L115 108 L112 205 Q112 214 103 214 L57 214 Q48 214 48 205 Z',
           top:108, bottom:214, rim:102, rimRx:40, rimRy:8 },
  mixing: { outer:'M48 50 L112 50 L107 212 Q107 224 95 224 L65 224 Q53 224 53 212 Z',
            inner:'M55 56 L105 56 L100 208 Q100 216 94 216 L66 216 Q60 216 60 208 Z',
            top:56, bottom:216, rim:50, rimRx:32, rimRy:6 }
};

function glassSVG(type, opt={}){
  const g = GLASS_GEO[type] || GLASS_GEO.rocks;
  const ratio = clamp(opt.ratio==null?0.72:opt.ratio, 0, 1);
  const color = opt.color || '#D9A441';
  const deep = opt.deep || shade(color, -.25);
  const ice = opt.ice || null;
  const foam = !!opt.foam;
  const fizz = !!opt.fizz;
  const garnish = opt.garnish || null;
  const rimY = g.rim, top = g.top, bottom = g.bottom;
  const innerH = bottom - top;
  const surface = bottom - innerH * ratio;
  const id = gid(), innerClip = gid(), liqGrad = gid(), glassGrad = gid(), rimGrad = gid();
  const widthAt = y => { // 估算杯内宽度，用于液面/泡沫
    if(type==='coupe') return 40 * Math.sqrt(clamp(1-((y-top)/innerH)**2,0,1)) + 30;
    return 46;
  };
  const lw = Math.max(24, widthAt(surface));
  const bubbles = fizz ? Array.from({length:14},(_,i)=>{
    const x = 56 + (i*13.7)%48, d = 2.2+(i%3)*.7, delay=(i*.31)%2.4, dur=1.5+(i%4)*.45;
    return `<circle class="bub" cx="${x}" cy="${surface+8}" r="${d}" fill="rgba(255,255,255,.72)"
      style="--rise:${Math.round(bottom-surface-8)}px;animation-delay:-${delay}s;animation-duration:${dur}s"/>`;
  }).join('') : '';

  let iceSVG = '';
  if(ice==='big'){
    const s = type==='rocks'?38:30;
    iceSVG = `<g transform="translate(${80-s/2},${surface-s*.45}) rotate(-8 80 ${surface})">
      <rect x="0" y="0" width="${s}" height="${s}" rx="${s*.2}" fill="rgba(232,247,252,.55)" stroke="rgba(255,255,255,.8)" stroke-width="1.2"/>
      <rect x="${s*.12}" y="${s*.1}" width="${s*.5}" height="${s*.5}" rx="${s*.1}" fill="rgba(255,255,255,.5)"/>
      <path d="M${s*.15} ${s*.85} L${s*.8} ${s*.2}" stroke="rgba(255,255,255,.65)" stroke-width="1"/>
      <rect x="0" y="0" width="${s}" height="${s}" rx="${s*.2}" fill="none" stroke="rgba(160,205,220,.55)" stroke-width="3"/>
    </g>`;
  } else if(ice==='spear'){
    iceSVG = `<g transform="translate(64,${surface-50}) rotate(7 80 ${surface})">
      <rect x="0" y="0" width="16" height="94" rx="7" fill="rgba(232,247,252,.5)" stroke="rgba(255,255,255,.75)" stroke-width="1.2"/>
      <rect x="4" y="6" width="4" height="74" rx="2" fill="rgba(255,255,255,.55)"/>
      <path d="M2 8 L14 82" stroke="rgba(255,255,255,.5)" stroke-width="1"/>
    </g>`;
  } else if(ice==='crushed'){
    iceSVG = `<g opacity=".9">${
      Array.from({length:26},(_,i)=>{
        const x = 48 + (i*17)%64, y = surface - 6 + (i*13)%46, r = 5 + (i%4)*3;
        return `<path d="M${x} ${y} l${r} ${-r*.5} l${r*.7} ${r*.6} l${-r*.5} ${r*.8} l${-r*.9} ${-r*.4}Z"
          fill="rgba(240,251,255,.48)" stroke="rgba(255,255,255,.6)" stroke-width=".6"/>`;
      }).join('')
    }</g>`;
  }

  const foamSVG = foam ? `
    <g>
      <ellipse cx="80" cy="${surface}" rx="${lw*.58}" ry="${Math.max(5,lw*.12)}" fill="#F8F0E2" opacity=".96"/>
      <ellipse cx="80" cy="${surface-2}" rx="${lw*.5}" ry="${Math.max(4,lw*.1)}" fill="#FFFBF3" opacity=".9"/>
      ${Array.from({length:9},(_,i)=>{ const x=80-((lw*.5))+i*(lw/10); return `<circle cx="${x}" cy="${surface-1-(i%3)*1.6}" r="${1.6+(i%3)*1.3}" fill="rgba(255,255,255,.95)"/>`; }).join('')}
      <path d="M${80-lw*.42} ${surface+1} Q80 ${surface+8} ${80+lw*.42} ${surface+1}" stroke="rgba(210,180,140,.35)" stroke-width="1.4" fill="none"/>
    </g>` : '';

  const garnishSVG = garnish==='lime' ? limeOnRim(type==='highball'?108:112, type==='highball'?62:60)
                   : garnish==='mint' ? mintOnGlass(type==='collins'?34:42)
                   : garnish==='orange' ? orangeOnRim(type==='rocks'?118:116, type==='rocks'?104:96)
                   : garnish==='cherry' ? cherryOnRim(rimY-6)
                   : '';

  return `<svg class="model glass glass-${type}" viewBox="0 -60 160 320" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${grad(glassGrad,[[0,'rgba(255,255,255,.34)'],[.1,'rgba(255,255,255,.1)'],[.55,'rgba(255,255,255,.04)'],[.88,'rgba(255,255,255,.10)'],[1,'rgba(255,255,255,.30)']],'0%','0%','100%','0%')}
      ${grad(liqGrad,[[0,shade(color,.3)],[.2,color],[.72,color],[1,deep]])}
      ${grad(rimGrad,[[0,'rgba(255,255,255,.9)'],[.5,'rgba(255,255,255,.35)'],[1,'rgba(255,255,255,.8)']])}
      <clipPath id="${innerClip}"><path d="${g.inner}"/></clipPath>
    </defs>
    <ellipse cx="80" cy="240" rx="${g.stem?34:44}" ry="7" fill="rgba(0,0,0,.32)"/>
    <image href="${nightAsset('stock-'+(type==='mixing'?'highball':type))}" x="${80-g.rimRx}" y="${rimY-g.rimRy}" width="${g.rimRx*2}" height="${(g.stem?230:g.bottom+6)-rimY+g.rimRy}" preserveAspectRatio="none"/>
    <g clip-path="url(#${innerClip})">
      <rect x="0" y="${surface}" width="160" height="${bottom-surface}" fill="url(#${liqGrad})"/>
      <rect x="0" y="${surface}" width="160" height="3" fill="${shade(color,.36)}" opacity=".7"/>
      <ellipse visibility="${ratio>0?'visible':'hidden'}" cx="80" cy="${surface}" rx="${lw*.52}" ry="${Math.max(2.2,lw*.08)}" fill="${shade(color,.4)}" opacity=".55"/>
      ${iceSVG}
      <path d="M30 ${top} L65 ${top} L77 ${bottom} Z M101 ${top} L124 ${top} L86 ${bottom} Z" fill="#ffe4be" opacity=".19"/>
      <path d="M48 ${bottom} L68 ${top} L79 ${bottom} L97 ${top} L112 ${bottom}" fill="none" stroke="#f9deb5" stroke-opacity=".4" stroke-width="1"/>
      ${bubbles}
      ${foamSVG}
      <path d="M${80-lw*.34} ${bottom-10} Q80 ${bottom-2} ${80+lw*.34} ${bottom-10}" stroke="rgba(0,0,0,.12)" stroke-width="5" fill="none"/>
    </g>
    <ellipse cx="80" cy="${rimY}" rx="${g.rimRx}" ry="${g.rimRy}" fill="none" stroke="url(#${rimGrad})" stroke-width="2.2"/>
    <ellipse cx="80" cy="${rimY+1.4}" rx="${g.rimRx-2.4}" ry="${g.rimRy-1.2}" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1"/>
    <path d="M${type==='coupe'?44:56} ${rimY+6} L${type==='coupe'?56:64} ${bottom-8}" stroke="rgba(255,255,255,.55)" stroke-width="3.4" opacity=".55" stroke-linecap="round"/>
    <path d="M${type==='coupe'?112:102} ${rimY+18} L${type==='coupe'?108:98} ${bottom-24}" stroke="rgba(255,255,255,.28)" stroke-width="2" opacity=".6" stroke-linecap="round"/>
    <path d="M${80-g.rimRx*.55} ${rimY+3} Q${80-g.rimRx*.2} ${rimY-3} ${80} ${rimY-2}" stroke="rgba(255,255,255,.65)" stroke-width="1.6" fill="none" opacity=".7"/>
    ${condensation(color)}
    ${garnishSVG}
  </svg>`;
}

function condensation(color){
  const dots = [[52,150,1.6],[60,176,1.2],[98,162,1.5],[104,188,1.1],[70,196,1.4],[88,142,1]];
  return `<g fill="rgba(255,255,255,.4)">${dots.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`;
}
function limeOnRim(x,y){
  return `<g transform="translate(${x-22},${y-20}) rotate(24 22 20)">
    <path d="M2 22 A22 22 0 0 1 46 22 Z" fill="#8CC152" stroke="#527F29" stroke-width="1.6"/>
    <path d="M6 22 A18 18 0 0 1 42 22 Z" fill="#CFE98B"/>
    ${[0,1,2,3,4].map(i=>`<path d="M24 22 L${7+i*8.5} 4 L${10+i*8.5} 22" stroke="#F2FAD8" stroke-width="1" fill="none"/>`).join('')}
    <path d="M3 22 Q24 30 45 22" stroke="#EAF6C2" stroke-width="2" fill="none"/>
    <path d="M8 16 Q12 2 24 0" stroke="rgba(255,255,255,.55)" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  </g>`;
}
function mintOnGlass(y){
  return `<g transform="translate(80,${y})">
    <path d="M0 0 Q-2 -26 4 -58" stroke="#3E7C46" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    ${leaf(-6,-30,-42,24,'#5FAE67')}${leaf(10,-38,38,24,'#69BB72')}
    ${leaf(-4,-48,-30,20,'#7CCB84')}${leaf(12,-54,30,20,'#4F9A58')}
    ${leaf(4,-64,4,18,'#8BD492')}
    <circle cx="5" cy="-60" r="2" fill="#A9DC8C"/>
  </g>`;
}
function orangeOnRim(x,y){
  return `<g transform="translate(${x-30},${y-26})">
    <path d="M2 24 C10 4 26 2 38 8 C52 15 48 32 34 32 C22 32 20 20 30 18 C38 16 40 24 34 26"
      fill="none" stroke="#E8892F" stroke-width="7" stroke-linecap="round"/>
    <path d="M2 24 C10 4 26 2 38 8 C52 15 48 32 34 32 C22 32 20 20 30 18" fill="none" stroke="#FFC46B" stroke-width="3" stroke-linecap="round" opacity=".8"/>
    <path d="M4 24 C12 8 26 6 36 11" stroke="rgba(255,255,255,.55)" stroke-width="1.4" fill="none"/>
  </g>`;
}
function cherryOnRim(y){
  return `<g transform="translate(80,${y-34})">
    <path d="M0 22 L10 0" stroke="#D8B25C" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="1" cy="26" r="9" fill="#C22F35"/>
    <circle cx="1" cy="26" r="9" fill="url(#cherryGrad)"/>
    <circle cx="-2" cy="23" r="3" fill="rgba(255,255,255,.5)"/>
    <path d="M-7 33 Q1 38 9 32" stroke="#8F1D22" stroke-width="2" fill="none"/>
    <defs><radialGradient id="cherryGrad" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FF7A76"/><stop offset=".55" stop-color="#C22F35"/><stop offset="1" stop-color="#7C1318"/></radialGradient></defs>
  </g>`;
}

/* ---------------------------------------------------------
   动物 NPC（Q 版两套表情：happy / sad）
   --------------------------------------------------------- */
const NPC_STYLE = {
  fox:   { fur:'#E8843C', fur2:'#B9541D', cream:'#F9EAD5', jacket:'#2E5B4E', scarf:'#E8B35B', ear:'fox', tail:'#E8843C' },
  cat:   { fur:'#E6B36E', fur2:'#B07A3C', cream:'#FBF1DE', jacket:'#5A3E5E', scarf:'#F0C46A', ear:'cat', tail:'#E6B36E' },
  bear:  { fur:'#9A6A45', fur2:'#6E4527', cream:'#F2DFC8', jacket:'#3D5B7A', scarf:'#D98A5F', ear:'bear', tail:'#9A6A45' },
  panda: { fur:'#F2ECE2', fur2:'#D6CBBC', cream:'#FFFFFF', jacket:'#344E41', scarf:'#E0715B', ear:'panda', patch:'#2E2B2B', tail:'#F2ECE2' },
  rabbit:{ fur:'#EFE2D0', fur2:'#C9B49A', cream:'#FFF9EF', jacket:'#7A4A5A', scarf:'#9FD3B4', ear:'rabbit', tail:'#EFE2D0' }
};

function animalSVG(kind,mood){
  /* v11.12：统一走 flatAvatarSVG，与 3D / DOM 头像同一规范 */
  return flatAvatarSVG(kind||'fox',mood||'neutral');
}
function shakerSVG(opt={}){
  const key=opt.cap?'shaker':'tin';
  return `<svg class="model" viewBox="0 0 160 250"><image href="${nightAsset(key)}" x="28" y="${opt.cap?38:62}" width="104" height="${opt.cap?196:172}" preserveAspectRatio="xMidYMax meet"/></svg>`;
}

function iceBucketSVG(opt={}){
  const id = gid();
  return `<svg class="model bucket" viewBox="0 0 220 210" xmlns="http://www.w3.org/2000/svg">
    <defs>${grad(id,[[0,'#5F6D74'],[.08,'#EAF2F5'],[.24,'#A4B2B9'],[.5,'#F6FAFC'],[.76,'#8D9CA3'],[1,'#D6E0E4']],'0%','0%','100%','0%')}</defs>
    <ellipse cx="110" cy="196" rx="70" ry="10" fill="rgba(0,0,0,.34)"/>
    <path d="M42 78 L178 78 L164 184 Q164 194 152 194 L68 194 Q56 194 56 184Z" fill="url(#${id})" stroke="#5E6B72" stroke-width="1.6"/>
    <ellipse cx="110" cy="78" rx="68" ry="12" fill="#D9E3E7" stroke="#5E6B72" stroke-width="1.6"/>
    <ellipse cx="110" cy="78" rx="60" ry="8" fill="#8FA0A7"/>
    <g>
      ${[[78,62],[102,58],[126,62],[90,70],[114,72],[140,68]].map(([x,y],i)=>`<g transform="translate(${x-14},${y-14}) rotate(${i*23-20} 14 14)">
        <rect width="28" height="26" rx="6" fill="rgba(235,248,252,.82)" stroke="rgba(255,255,255,.9)" stroke-width="1"/>
        <path d="M5 5 L23 21 M18 4 L8 18" stroke="rgba(255,255,255,.5)" stroke-width="1"/>
      </g>`).join('')}
    </g>
    <path d="M52 90 L62 178" stroke="rgba(255,255,255,.55)" stroke-width="4" opacity=".6"/>
    <g transform="translate(150,40) rotate(18)">
      <path d="M0 0 L42 0 M0 8 L42 8" stroke="#B9C6CC" stroke-width="4" stroke-linecap="round"/>
      <path d="M0 0 Q-10 22 2 42 Q14 22 4 8" fill="#DCE6EA" stroke="#7C8B93" stroke-width="1.2"/>
      <path d="M42 0 Q52 22 40 42 Q28 22 38 8" fill="#DCE6EA" stroke="#7C8B93" stroke-width="1.2"/>
    </g>
  </svg>`;
}

function jiggerSVG(){
  const id = gid();
  return `<svg class="model jigger" viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg">
    <defs>${grad(id,[[0,'#F5FAFC'],[.25,'#AEBCC3'],[.5,'#F8FCFE'],[.8,'#89989F'],[1,'#DCE6EA']],'0%','0%','100%','0%')}</defs>
    <ellipse cx="60" cy="188" rx="34" ry="7" fill="rgba(0,0,0,.3)"/>
    <path d="M28 44 L92 44 L82 94 L38 94Z" fill="url(#${id})" stroke="#66757C" stroke-width="1.3"/>
    <path d="M38 94 L52 120 L68 120 L82 94Z" fill="url(#${id})" stroke="#66757C" stroke-width="1.3"/>
    <path d="M52 120 L44 174 L76 174 L68 120Z" fill="url(#${id})" stroke="#66757C" stroke-width="1.3"/>
    <ellipse cx="60" cy="44" rx="32" ry="7" fill="#DCE6EA" stroke="#66757C" stroke-width="1.2"/>
    <ellipse cx="60" cy="44" rx="27" ry="5" fill="#8E9DA4"/>
    <path d="M36 52 L42 88" stroke="rgba(255,255,255,.8)" stroke-width="3" opacity=".7"/>
  </svg>`;
}

function strainerSVG(){
  return `<svg class="model strainer" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="70" cy="58" rx="46" ry="34" fill="rgba(220,232,236,.35)" stroke="#C7D4D9" stroke-width="2"/>
    <g fill="none" stroke="#B7C5CB" stroke-width="2">
      ${Array.from({length:6},(_,i)=>`<ellipse cx="70" cy="58" rx="${12+i*6}" ry="${9+i*4.6}"/>`).join('')}
    </g>
    <path d="M112 58 Q150 52 186 44" stroke="#C7D4D9" stroke-width="7" stroke-linecap="round"/>
    <path d="M112 58 Q150 52 186 44" stroke="rgba(255,255,255,.7)" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`;
}

function barSpoonSVG(){
  return `<svg class="model spoon" viewBox="0 0 60 260" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 34 L30 214" stroke="#C7D4D9" stroke-width="5"/>
    <path d="M30 34 Q18 58 30 78 Q42 58 30 34Z" fill="#DCE6EA" stroke="#8E9DA4" stroke-width="1.4"/>
    <path d="M30 94 L30 200" stroke="rgba(255,255,255,.75)" stroke-width="1.4" stroke-dasharray="4 6"/>
    <ellipse cx="30" cy="20" rx="13" ry="14" fill="#DCE6EA" stroke="#8E9DA4" stroke-width="1.4"/>
    <ellipse cx="30" cy="18" rx="8" ry="9" fill="#F7FBFD"/>
  </svg>`;
}

function iceSVG(kind='big', opt={}){
  if(kind==='crushed'){
    return `<svg class="model ice ice-crushed" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <g>${Array.from({length:14},(_,i)=>{
        const x=20+(i*29)%82, y=40+(i*17)%60, r=7+(i%4)*4;
        return `<path d="M${x} ${y} l${r} ${-r*.4} l${r*.55} ${r*.65} l${-r*.7} ${r*.8} l${-r*.85} ${-r*.5}Z" fill="rgba(228,245,250,.7)" stroke="rgba(255,255,255,.85)" stroke-width="1"/>`;
      }).join('')}</g>
    </svg>`;
  }
  if(kind==='spear'){
    return `<svg class="model ice ice-spear" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(14 60 60)">
        <rect x="46" y="8" width="28" height="104" rx="12" fill="rgba(228,245,250,.62)" stroke="rgba(255,255,255,.9)" stroke-width="1.6"/>
        <rect x="52" y="16" width="6" height="84" rx="3" fill="rgba(255,255,255,.65)"/>
        <path d="M49 20 L74 96" stroke="rgba(255,255,255,.5)" stroke-width="1.2"/>
        <path d="M56 14 L56 104" stroke="rgba(180,220,232,.4)" stroke-width="1"/>
      </g>
    </svg>`;
  }
  return `<svg class="model ice ice-big" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <g transform="rotate(-7 60 60)">
      <rect x="18" y="20" width="84" height="80" rx="14" fill="rgba(228,245,250,.55)" stroke="rgba(255,255,255,.9)" stroke-width="1.6"/>
      <rect x="26" y="26" width="38" height="34" rx="8" fill="rgba(255,255,255,.42)"/>
      <path d="M24 86 L64 36 L94 88" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.4"/>
      <path d="M30 30 L92 92" stroke="rgba(255,255,255,.4)" stroke-width="1.2"/>
      <rect x="18" y="20" width="84" height="80" rx="14" fill="none" stroke="rgba(150,200,216,.5)" stroke-width="4"/>
    </g>
  </svg>`;
}

function handSVG(opt={}){
  const id = gid(), id2 = gid(), id3 = gid();
  const sleeve = opt.sleeve || '#2F5B4C';
  return `<svg class="model hand" viewBox="0 0 300 360" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${grad(id,[[0,'#F9D6B8'],[.45,'#EFBE97'],[.8,'#D99A72'],[1,'#C07E58']],'0%','0%','100%','0%')}
      ${grad(id2,[[0,'#FBE3CC'],[.5,'#F1C6A4'],[1,'#D89B73']],'0%','0%','0%','100%')}
      ${grad(id3,[[0,shade(sleeve,.18)],[1,shade(sleeve,-.3)]],'0%','0%','100%','0%')}
    </defs>
    <path d="M150 360 L142 286 Q140 250 168 238 L236 224 Q266 220 272 248 L300 360Z" fill="url(#${id3})" stroke="${shade(sleeve,-.35)}" stroke-width="2"/>
    <path d="M148 286 Q170 270 202 268 L236 262" stroke="rgba(255,255,255,.22)" stroke-width="10" fill="none"/>
    <path d="M128 250 Q168 220 220 226 Q244 230 244 256 L242 286 Q240 306 220 306 L158 306 Q128 300 122 274Z" fill="url(#${id2})" stroke="#C9895F" stroke-width="2"/>
    <g stroke="#C9895F" stroke-width="1.6">
      <path d="M92 200 Q130 186 160 192 Q174 196 172 210 Q170 224 154 226 L100 236 Q80 238 76 222 Q72 206 92 200Z" fill="url(#${id})"/>
      <path d="M86 228 Q126 218 158 224 Q174 228 172 242 Q170 256 152 258 L96 266 Q76 268 72 252 Q68 236 86 228Z" fill="url(#${id})"/>
      <path d="M82 256 Q120 248 154 252 Q170 256 168 270 Q166 284 148 286 L94 292 Q74 294 70 278 Q66 262 82 256Z" fill="url(#${id})"/>
      <path d="M92 282 Q124 276 150 280 Q164 284 162 296 Q160 308 144 310 L100 314 Q82 316 78 302 Q74 288 92 282Z" fill="url(#${id})"/>
    </g>
    <g fill="rgba(255,255,255,.28)">
      <ellipse cx="104" cy="204" rx="12" ry="4"/><ellipse cx="100" cy="232" rx="12" ry="4"/>
      <ellipse cx="96" cy="260" rx="12" ry="4"/><ellipse cx="106" cy="286" rx="11" ry="3.6"/>
    </g>
    <path d="M118 300 Q100 280 106 256 Q110 236 130 236 Q148 236 150 254 Q152 272 138 286 Q130 296 118 300Z" fill="url(#${id})" stroke="#C9895F" stroke-width="2"/>
    <path d="M122 292 Q112 274 120 256" stroke="rgba(255,255,255,.35)" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M170 220 Q196 210 212 224" stroke="rgba(255,255,255,.3)" stroke-width="2" fill="none"/>
  </svg>`;
}

function towelSVG(){
  return `<svg class="model towel" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="tw1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2E9DA"/><stop offset="1" stop-color="#D8C8B0"/></linearGradient></defs>
    <path d="M14 34 L166 22 L184 92 L30 104Z" fill="url(#tw1)" stroke="#C7B69C" stroke-width="1.4"/>
    <path d="M30 60 L170 46" stroke="#C9B79C" stroke-width="3" stroke-dasharray="8 6"/>
    <path d="M36 78 L176 64" stroke="#E3D5C0" stroke-width="2"/>
    <path d="M14 34 L30 104" stroke="#B9A488" stroke-width="4"/>
  </svg>`;
}


function paperFigure(svg){
  return `<div class="paper-figure"><div class="pf-main">${svg}</div></div>`;
}

;
/* ============================================================
   低多边形纸模 NPC：Canvas 2.5D 折纸渲染
   面部五官用投影锚点做 2D 收尾，身体/头/耳/手是带厚度的
   多边形折面，能看出受光面、背光面、折线和纸边。
   ============================================================ */
const NPC_CACHE = new Map();
const LP_LIGHT = (()=>{ const v=[-0.42,0.62,0.66]; const l=Math.hypot(...v); return v.map(x=>x/l); })();

function lpShade(hex, amt){ return shade(hex, amt); }

function lpNormal(a,b,c){
  const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];
  const v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
  let n=[u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
  const l=Math.hypot(...n)||1; n=n.map(x=>x/l);
  if(n[2]<0) n=n.map(x=>-x);
  return n;
}

function drawPaperNPC(kind, mood, scale=2){
  const S = NPC_STYLE[kind] || NPC_STYLE.fox;
  const W=300, H=360;
  const cv=document.createElement('canvas'); cv.width=W*scale; cv.height=H*scale;
  const ctx=cv.getContext('2d'); ctx.scale(scale,scale);
  const yaw=0.23, pitch=-0.075;
  const CAM=900, FOC=880;

  const P=(p)=>{
    let x=p[0]*Math.cos(yaw)+p[2]*Math.sin(yaw);
    let z=-p[0]*Math.sin(yaw)+p[2]*Math.cos(yaw);
    let y=p[1]*Math.cos(pitch)-z*Math.sin(pitch);
    z=p[1]*Math.sin(pitch)+z*Math.cos(pitch);
    const s=FOC/(CAM-z);
    return [150+x*s, 368-y*s*0.96, z];
  };

  const faces=[];
  const add=(pts,color,opt={})=>{
    if(pts.length<3) return;
    const pp=pts.map(P);
    const depth=pp.reduce((s,p)=>s+p[2],0)/pp.length;
    let fill=color, lit=0;
    if(!opt.flat){
      const n=lpNormal(pts[0],pts[1],pts[2]);
      lit=0.52+0.55*Math.max(0,n[0]*LP_LIGHT[0]+n[1]*LP_LIGHT[1]+n[2]*LP_LIGHT[2]);
      lit=Math.round(lit*5)/5;
      fill=lpShade(color,(lit-0.78)*0.52);
    }
    faces.push({pp,fill,depth,lit,edge:opt.edge!==false,edgeA:opt.edgeA??.22,lightEdge:opt.lightEdge!==false});
  };
  const quad=(a,b,c,d,color,opt)=>add([a,b,c,d],color,opt);
  const tri=(a,b,c,color,opt)=>add([a,b,c],color,opt);

  const ellipsoid=(cx,cy,cz,rx,ry,rz,su,sv,color,opt={})=>{
    const pt=(v,u)=>{
      const t=-Math.PI/2+Math.PI*v/sv, lon=2*Math.PI*u/su;
      return [cx+rx*Math.cos(t)*Math.cos(lon), cy+ry*Math.sin(t), cz+rz*Math.cos(t)*Math.sin(lon)];
    };
    for(let v=0;v<sv;v++) for(let u=0;u<su;u++){
      quad(pt(v,u),pt(v,u+1),pt(v+1,u+1),pt(v+1,u),color,opt);
    }
  };

  const tube=(rings,su,color,opt={})=>{
    for(let i=0;i<rings.length-1;i++){
      const A=rings[i], B=rings[i+1];
      for(let u=0;u<su;u++){
        const a0=2*Math.PI*u/su, a1=2*Math.PI*(u+1)/su;
        quad(
          [Math.cos(a0)*A.r, A.y, Math.sin(a0)*A.r],
          [Math.cos(a1)*A.r, A.y, Math.sin(a1)*A.r],
          [Math.cos(a1)*B.r, B.y, Math.sin(a1)*B.r],
          [Math.cos(a0)*B.r, B.y, Math.sin(a0)*B.r],
          color,opt
        );
      }
    }
  };

  const limb=(A,B,r1,r2,su,color)=>{
    const d=[B[0]-A[0],B[1]-A[1],B[2]-A[2]];
    const dl=Math.hypot(...d)||1; const dir=d.map(x=>x/dl);
    let up=Math.abs(dir[1])>.9?[0,0,1]:[0,1,0];
    let side=[dir[1]*up[2]-dir[2]*up[1],dir[2]*up[0]-dir[0]*up[2],dir[0]*up[1]-dir[1]*up[0]];
    const sl=Math.hypot(...side)||1; side=side.map(x=>x/sl);
    up=[side[1]*dir[2]-side[2]*dir[1],side[2]*dir[0]-side[0]*dir[2],side[0]*dir[1]-side[1]*dir[0]];
    const ring=(p,r)=>{const arr=[];for(let u=0;u<su;u++){const a=2*Math.PI*u/su;arr.push([p[0]+(side[0]*Math.cos(a)+up[0]*Math.sin(a))*r,p[1]+(side[1]*Math.cos(a)+up[1]*Math.sin(a))*r,p[2]+(side[2]*Math.cos(a)+up[2]*Math.sin(a))*r]);}return arr;};
    const R1=ring(A,r1),R2=ring(B,r2);
    for(let u=0;u<su;u++) quad(R1[u],R1[(u+1)%su],R2[(u+1)%su],R2[u],color);
  };

  /* 身体：外套 + 纸围裙 */
  tube([{y:38,r:90},{y:78,r:86},{y:122,r:76},{y:166,r:68}],9,S.jacket);
  // 前胸奶油纸围裙
  add([[-46,168,50],[46,168,50],[54,70,70],[-54,70,70]],'#F7EAD3',{edgeA:.16});
  add([[-38,166,56],[0,126,66],[38,166,56]],'#FFF8EC',{edgeA:.12});
  // 领巾
  add([[-42,170,54],[0,186,60],[42,170,54],[0,158,56]],S.scarf,{edgeA:.18});
  add([[-8,164,60],[8,164,60],[0,134,64]],S.scarf,{edgeA:.16});
  // 手臂
  limb([-66,156,12],[-92,92,30],18,13,6,S.jacket);
  limb([66,156,12],[92,92,30],18,13,6,S.jacket);
  ellipsoid(-94,76,34,18,16,16,6,3,S.cream);
  ellipsoid(94,76,34,18,16,16,6,3,S.cream);
  // 腿/脚被吧台挡住，省略

  /* 头 */
  ellipsoid(0,238,0,94,86,80,10,6,S.fur);
  // 口鼻
  ellipsoid(0,218,60,42,32,32,7,4,S.cream);
  ellipsoid(0,230,86,10,8,8,5,3,'#3A2418');
  // 腮红
  add([[-64,226,58],[-38,218,68],[-34,236,70],[-58,244,60]],'#E88E86',{flat:true,edge:false,lightEdge:false});
  add([[64,226,58],[38,218,68],[34,236,70],[58,244,60]],'#E88E86',{flat:true,edge:false,lightEdge:false});

  /* 耳朵 */
  if(kind==='rabbit'){
    const ear=(sx)=>{
      const b1=[sx*26,296,4], b2=[sx*56,302,0], tip=[sx*58,362,-16], mid=[sx*40,330,18];
      tri(b1,b2,tip,S.fur); tri(b1,tip,mid,S.fur); tri(tip,b2,mid,lpShade(S.fur,-.08));
      add([[sx*31,318,10],[sx*38,330,18],[sx*44,310,8]],S.cream,{flat:true,edge:false});
    };
    ear(1); ear(-1);
  } else if(kind==='bear'||kind==='panda'){
    const earColor = kind==='panda' ? '#2E2B2B' : S.fur;
    ellipsoid(-64,300,-2,32,30,15,6,3,earColor);
    ellipsoid(64,300,-2,32,30,15,6,3,earColor);
    ellipsoid(-64,302,8,18,17,6,6,3, kind==='panda'?'#4A4545':S.cream);
    ellipsoid(64,302,8,18,17,6,6,3, kind==='panda'?'#4A4545':S.cream);
  } else {
    const ear=(sx)=>{
      const A=[sx*96,286,-6], B=[sx*46,300,12], T=[sx*58,362,-12], F=[sx*76,326,26];
      tri(A,B,F,S.fur2,{edgeA:.24});
      tri(B,T,F,S.fur);
      tri(T,A,F,lpShade(S.fur,-.10));
      tri(A,T,B,lpShade(S.fur2,-.10),{edgeA:.2});
      add([[sx*68,306,8],[sx*60,338,10],[sx*80,320,14]],S.cream,{flat:true,edgeA:.12});
    };
    ear(-1); ear(1);
  }

  /* 熊猫眼斑 */
  if(kind==='panda'){
    ellipsoid(-32,250,72,28,24,8,6,3,'#2E2B2B',{flat:true,edge:false,lightEdge:false});
    ellipsoid(32,250,72,28,24,8,6,3,'#2E2B2B',{flat:true,edge:false,lightEdge:false});
  }

  /* 纸背层：先画背面厚度，再画面 */
  const sorted=faces.sort((a,b)=>a.depth-b.depth);
  const back=(dx,dy,color)=>{
    for(const f of sorted){
      ctx.beginPath();
      f.pp.forEach((p,i)=> i?ctx.lineTo(p[0]+dx,p[1]+dy):ctx.moveTo(p[0]+dx,p[1]+dy));
      ctx.closePath(); ctx.fillStyle=color; ctx.fill();
    }
  };
  back(6,8,'#D9BD96');
  back(3,4,'#F1DEBF');

  for(const f of sorted){
    ctx.beginPath();
    f.pp.forEach((p,i)=> i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
    ctx.closePath();
    ctx.fillStyle=f.fill; ctx.fill();
    if(f.edge){
      ctx.strokeStyle = (f.lit>0.95)?'rgba(255,248,230,.34)':`rgba(92,55,30,${f.edgeA})`;
      ctx.lineWidth=.62; ctx.lineJoin='round'; ctx.stroke();
    }
  }

  /* 五官：投影锚点 + 2D 收尾 */
  const eyeL=P([-32,250,86]), eyeR=P([32,250,86]);
  const mouth=P([0,204,90]);
  const dark='#3A2418';
  ctx.lineCap='round';
  if(mood==='sad'){
    for(const e of [eyeL,eyeR]){
      ctx.fillStyle=dark; ctx.beginPath(); ctx.ellipse(e[0],e[1],6.4,7.4,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.62)'; ctx.beginPath(); ctx.arc(e[0]-2,e[1]-2.5,2,0,Math.PI*2); ctx.fill();
    }
    ctx.strokeStyle=dark; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(eyeL[0]-9,eyeL[1]-11); ctx.lineTo(eyeL[0]+7,eyeL[1]-13); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(eyeR[0]-7,eyeR[1]-13); ctx.lineTo(eyeR[0]+9,eyeR[1]-11); ctx.stroke();
    ctx.beginPath(); ctx.arc(mouth[0],mouth[1]+10,8,Math.PI*1.15,Math.PI*1.85,true); ctx.stroke();
  } else {
    for(const e of [eyeL,eyeR]){
      ctx.strokeStyle=dark; ctx.lineWidth=3.4;
      ctx.beginPath(); ctx.arc(e[0],e[1]+3,8.2,Math.PI*1.08,Math.PI*1.92); ctx.stroke();
    }
    ctx.strokeStyle=dark; ctx.lineWidth=2.4;
    ctx.beginPath(); ctx.arc(mouth[0],mouth[1]-4,7.5,Math.PI*.12,Math.PI*.88); ctx.stroke();
  }
  // 鼻头高光
  const nose=P([0,230,92]);
  ctx.fillStyle='rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(nose[0]-2.5,nose[1]-2,3,2,0,0,Math.PI*2); ctx.fill();

  // 接触阴影
  const sh=P([0,30,0]);
  ctx.fillStyle='rgba(86,52,28,.16)';
  ctx.beginPath(); ctx.ellipse(sh[0],sh[1]+4,64,10,0,0,Math.PI*2); ctx.fill();

  return cv.toDataURL('image/png');
}

/* ============================================================
   v11.12 · DOM 头像统一规范
   与 scene3d.js customer() 使用同一套色板 / 耳朵形状 / 五官层级：
   耳朵抬出头部轮廓、圆眼+细弯眉、居中微笑、围裙带肩带；
   mood 真正驱动表情（neutral / happy / sad / thanks）。
   ============================================================ */
const FLAT_NPC={
  fox:   {fur:'#E8853C',fur2:'#C96A2A',cream:'#FFF3DA',jacket:'#2F7468',scarf:'#E8B44A',ear:'cone'},
  bear:  {fur:'#A9794E',fur2:'#8A5C36',cream:'#FFE8C8',jacket:'#3A6E9A',scarf:'#E0A24A',ear:'round'},
  rabbit:{fur:'#F4EAD8',fur2:'#D8CBB4',cream:'#FFF8EC',jacket:'#7A5688',scarf:'#8FBF9A',ear:'long'},
  panda: {fur:'#F2EEE4',fur2:'#D9D2C4',cream:'#FFFFFF',jacket:'#4C7D68',scarf:'#D96A5A',ear:'round',patch:'#2E2B2B'},
  cat:   {fur:'#E9B56A',fur2:'#C99245',cream:'#FFF5E2',jacket:'#8A5E68',scarf:'#6FA3A8',ear:'cone'}
};
function flatAvatarSVG(kind,mood){
  const s=FLAT_NPC[kind]||FLAT_NPC.fox;
  const dark='#3A2418', inner='#F3C9B4';
  /* v11.14：新增 angry（臭脸/生气），thanks 仍复用 happy */
  const k=(mood==='thanks')?'happy':(mood==='happy'||mood==='sad'||mood==='angry'?mood:'neutral');
  let ears='';
  if(s.ear==='long'){
    ears=`<ellipse cx="76" cy="38" rx="12" ry="34" fill="${s.fur}" stroke="${s.fur2}" stroke-width="3" transform="rotate(-9 76 38)"/>
      <ellipse cx="76" cy="38" rx="5" ry="25" fill="${inner}" transform="rotate(-9 76 38)"/>
      <ellipse cx="124" cy="38" rx="12" ry="34" fill="${s.fur}" stroke="${s.fur2}" stroke-width="3" transform="rotate(9 124 38)"/>
      <ellipse cx="124" cy="38" rx="5" ry="25" fill="${inner}" transform="rotate(9 124 38)"/>`;
  }else if(s.ear==='round'){
    ears=`<circle cx="56" cy="58" r="21" fill="${s.patch||s.fur}" stroke="${s.fur2}" stroke-width="3"/>
      <circle cx="56" cy="58" r="10" fill="${s.patch?'#4A4545':s.cream}"/>
      <circle cx="144" cy="58" r="21" fill="${s.patch||s.fur}" stroke="${s.fur2}" stroke-width="3"/>
      <circle cx="144" cy="58" r="10" fill="${s.patch?'#4A4545':s.cream}"/>`;
  }else{
    ears=`<path d="M58 78 L46 20 L98 62 Z" fill="${s.fur}" stroke="${s.fur2}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M64 72 L56 36 L88 64 Z" fill="${inner}"/>
      <path d="M142 78 L154 20 L102 62 Z" fill="${s.fur}" stroke="${s.fur2}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M136 72 L144 36 L112 64 Z" fill="${inner}"/>`;
  }
  const roundEyes=`<ellipse cx="78" cy="100" rx="12" ry="13" fill="${s.cream}" stroke="${dark}" stroke-width="2"/>
    <ellipse cx="122" cy="100" rx="12" ry="13" fill="${s.cream}" stroke="${dark}" stroke-width="2"/>
    <circle cx="78" cy="101" r="6" fill="${dark}"/><circle cx="122" cy="101" r="6" fill="${dark}"/>
    <circle cx="75" cy="97" r="2.2" fill="#FFFFFF"/><circle cx="119" cy="97" r="2.2" fill="#FFFFFF"/>`;
  let eyes, brows='', mouth, tear='', anger='';
  if(k==='happy'){
    eyes=`<path d="M66 102 Q78 88 90 102" fill="none" stroke="${dark}" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M110 102 Q122 88 134 102" fill="none" stroke="${dark}" stroke-width="3.4" stroke-linecap="round"/>`;
    mouth=`<path d="M88 140 Q100 154 112 140" fill="none" stroke="${dark}" stroke-width="3.2" stroke-linecap="round"/>`;
  }else{
    eyes=roundEyes;
    brows=k==='angry'
      ? `<path d="M64 74 Q78 84 92 94" fill="none" stroke="${dark}" stroke-width="3.6" stroke-linecap="round"/>
         <path d="M108 94 Q122 84 136 74" fill="none" stroke="${dark}" stroke-width="3.6" stroke-linecap="round"/>`
      : k==='sad'
      ? `<path d="M66 82 Q78 88 90 88" fill="none" stroke="${dark}" stroke-width="2.6" stroke-linecap="round"/>
         <path d="M110 88 Q122 88 134 82" fill="none" stroke="${dark}" stroke-width="2.6" stroke-linecap="round"/>`
      : `<path d="M66 83 Q78 78 90 83" fill="none" stroke="${dark}" stroke-width="2.4" stroke-linecap="round"/>
         <path d="M110 83 Q122 78 134 83" fill="none" stroke="${dark}" stroke-width="2.4" stroke-linecap="round"/>`;
    mouth=k==='angry'
      ? `<path d="M88 150 Q100 132 112 150 Z" fill="#7A2E25" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>`
      : k==='sad'
      ? `<path d="M90 148 Q100 138 110 148" fill="none" stroke="${dark}" stroke-width="3" stroke-linecap="round"/>`
      : `<path d="M89 141 Q100 152 111 141" fill="none" stroke="${dark}" stroke-width="3" stroke-linecap="round"/>`;
    if(k==='sad') tear=`<ellipse cx="126" cy="118" rx="3.4" ry="6" fill="#8FD6E8"/>`;
    if(k==='angry') anger=`<path d="M148 52 l12 -10 M160 52 l-12 -10 M148 42 h12 M148 42 v10" fill="none" stroke="#C2472F" stroke-width="3" stroke-linecap="round"/>`;
  }
  const pandaPatch=s.patch?`<ellipse cx="78" cy="100" rx="17" ry="19" fill="${s.patch}" opacity=".82"/>
    <ellipse cx="122" cy="100" rx="17" ry="19" fill="${s.patch}" opacity=".82"/>`:'';
  return `<svg class="model npc npc-${kind}" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="100" cy="231" rx="56" ry="7" fill="rgba(86,52,28,.16)"/>
    ${ears}
    <rect x="62" y="150" width="76" height="72" rx="18" fill="${s.jacket}"/>
    <path d="M78 152 h44 v50 a8 8 0 0 1 -8 8 h-28 a8 8 0 0 1 -8 -8 z" fill="#FFF1D8" stroke="#D8BE95" stroke-width="3"/>
    <path d="M80 156 L74 194 M120 156 L126 194" stroke="${s.scarf}" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="100" cy="104" rx="62" ry="58" fill="${s.fur}" stroke="${s.fur2}" stroke-width="3"/>
    ${pandaPatch}
    <rect x="66" y="154" width="68" height="13" rx="6.5" fill="${s.scarf}"/>
    <ellipse cx="100" cy="131" rx="30" ry="21" fill="${s.cream}"/>
    <ellipse cx="100" cy="126" rx="7" ry="5" fill="${dark}"/>
    <ellipse cx="56" cy="125" rx="10" ry="6" fill="#E8938B" opacity=".55"/>
    <ellipse cx="144" cy="125" rx="10" ry="6" fill="#E8938B" opacity=".55"/>
    ${brows}${eyes}${mouth}${tear}${anger}
  </svg>`;
}
function animalPaper(kind='fox', mood='neutral', cls=''){
  const svg=flatAvatarSVG(kind,mood);
  const url='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  return `<img class="npc-paper ${cls}" src="${url}" alt="" draggable="false">`;
}

;
/* ============================================================
   真 3D 小酒馆：一个相机、一间房间、每个客人独立纸模
   低多边形折面 + 纸边；Canvas 2D 软件渲染
   ============================================================ */
const canvasBar = (()=>{
  const W=480, H=940, F=430, CAMY=150;
  let cv, ctx, dpr=2;
  const cam={yaw:0,pitch:0,roll:0};
  let seats=[], active=0;
  const faces=[];
  const LIGHT=(()=>{const v=[-0.42,0.52,0.74];const l=Math.hypot(...v);return v.map(x=>x/l);})();

  const PAL={
    wall:'#38313e', wall2:'#3c3441', plank:'#D9B183',
    floor:'#724832', floor2:'#573b31', teal:'#513540', tealD:'#23584F',
    wood:'#C58A52', woodD:'#A96C3A', cream:'#FFF6E2', brass:'#D8A24A',
    dark:'#3A2418', shadow:'#6B4A32'
  };

  const art={};
  function loadArt(id,url){
    const image=new Image(); image.onload=()=>{art[id]=image;render();};image.src=url;
  }
  function init(){
    const host=document.getElementById('scene3d');
    cv=document.createElement('canvas');
    cv.style.cssText='width:100%;height:100%;display:block';
    host.replaceChildren(cv);
    dpr=Math.min(devicePixelRatio||1,1.5);
    cv.width=W*dpr; cv.height=H*dpr;
    ctx=cv.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0);
    loadArt('room',nightAsset('room'));loadArt('walnut',nightAsset('walnut'));
    for(const kind of ['fox','bear','rabbit','panda','cat'])loadArt(kind,patronAsset(kind));
    render();
  }
  function setCam(yaw,pitch,roll=0){ cam.yaw=yaw;cam.pitch=pitch;cam.roll=roll; render(); }
  function setSeats(list,idx){ seats=list||[]; active=idx||0; }
  function getCam(){ return cam; }

  function toCam(p){
    const yaw=cam.yaw*Math.PI/180, pitch=cam.pitch*Math.PI/180;
    const cy=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch);
    const x0=p[0], y0=p[1]-CAMY, z0=p[2];
    const x1=x0*cy + z0*sy;
    const z1=-x0*sy + z0*cy;
    const y1=y0*cp + z1*sp;
    const z2=-y0*sp + z1*cp;
    return [x1,y1,z2];
  }
  function projCam(c){
    const d=-c[2]; if(d<=18) return null;
    const s=F/d;
    let x=W/2 + c[0]*s;
    let y=H*0.48 - c[1]*s;
    if(cam.roll){
      const a=cam.roll*Math.PI/180, ca=Math.cos(a), sa=Math.sin(a);
      const dx=x-W/2, dy=y-H*0.48;
      x=W/2 + dx*ca - dy*sa; y=H*0.48 + dx*sa + dy*ca;
    }
    return [x,y,d];
  }
  function add(pts,color,opt={}){
    const cps=[]; for(const p of pts){ const c=toCam(p); if(!c) return; cps.push(c); }
    const pp=[]; for(const c of cps){ const q=projCam(c); if(!q) return; pp.push(q); }
    const u=[cps[1][0]-cps[0][0],cps[1][1]-cps[0][1],cps[1][2]-cps[0][2]];
    const v=[cps[2][0]-cps[0][0],cps[2][1]-cps[0][1],cps[2][2]-cps[0][2]];
    let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const nl=Math.hypot(...n)||1; n=n.map(x=>x/nl);
    if(n[2]<0) n=n.map(x=>-x);
    let fill=color, lit=0;
    if(!opt.flat){
      lit=0.58+0.46*Math.max(0,n[0]*LIGHT[0]+n[1]*LIGHT[1]+n[2]*LIGHT[2]);
      lit=Math.round(lit*40)/40;
      fill=shade(color,(lit-0.76)*0.26);
    }
    const depth=cps.reduce((s,c)=>s-c[2],0)/cps.length;
    faces.push({pp,fill,depth,edge:opt.edge!==false,edgeA:opt.edgeA??.045,lit});
  }
  function quad(a,b,c,d,color,opt){ add([a,b,c,d],color,opt); }
  function box(cx,cy,cz,w,h,d,color,opt={}){
    const x1=cx-w/2,x2=cx+w/2,y1=cy-h/2,y2=cy+h/2,z1=cz-d/2,z2=cz+d/2;
    quad([x1,y1,z2],[x2,y1,z2],[x2,y2,z2],[x1,y2,z2],color,opt);
    quad([x2,y1,z1],[x1,y1,z1],[x1,y2,z1],[x2,y2,z1],shade(color,-.1),opt);
    quad([x2,y1,z2],[x2,y1,z1],[x2,y2,z1],[x2,y2,z2],shade(color,-.06),opt);
    quad([x1,y1,z1],[x1,y1,z2],[x1,y2,z2],[x1,y2,z1],shade(color,-.12),opt);
    quad([x1,y2,z2],[x2,y2,z2],[x2,y2,z1],[x1,y2,z1],shade(color,.1),opt);
    quad([x1,y1,z1],[x2,y1,z1],[x2,y1,z2],[x1,y1,z2],shade(color,-.14),opt);
  }
  function cyl(cx,cy,cz,r,h,color,su=7,opt={}){
    const y1=cy-h/2,y2=cy+h/2;
    for(let u=0;u<su;u++){
      const a0=2*Math.PI*u/su,a1=2*Math.PI*(u+1)/su;
      quad([cx+Math.cos(a0)*r,y1,cz+Math.sin(a0)*r],[cx+Math.cos(a1)*r,y1,cz+Math.sin(a1)*r],
           [cx+Math.cos(a1)*r,y2,cz+Math.sin(a1)*r],[cx+Math.cos(a0)*r,y2,cz+Math.sin(a0)*r],color,opt);
    }
  }
  function ellip(cx,cy,cz,rx,ry,rz,su,sv,color,opt={}){
    const pt=(v,u)=>{const t=-Math.PI/2+Math.PI*v/sv,lon=2*Math.PI*u/su;
      return [cx+rx*Math.cos(t)*Math.cos(lon),cy+ry*Math.sin(t),cz+rz*Math.cos(t)*Math.sin(lon)];};
    for(let v=0;v<sv;v++) for(let u=0;u<su;u++) quad(pt(v,u),pt(v,u+1),pt(v+1,u+1),pt(v+1,u),color,opt);
  }

  function room(){
    // 地板长木板
    const NX=14, x0=-320,x1=320,z0=-400,z1=400;
    for(let i=0;i<NX;i++){
      const ax=x0+(x1-x0)*i/NX, bx=x0+(x1-x0)*(i+1)/NX;
      quad([ax,0,z0],[bx,0,z0],[bx,0,z1],[ax,0,z1], i%2?PAL.floor:PAL.floor2,{edgeA:.14});
      quad([bx-1.2,1,z0-2],[bx,1,z0-2],[bx,1,z1+2],[bx-1.2,1,z1+2],'rgba(90,55,30,.18)',{flat:true,edge:false});
    }
    // 天花板
    quad([-320,420,-400],[320,420,-400],[320,420,400],[-320,420,400],'#6B4630',{edgeA:.1});
    // 后墙（吧台墙）
    quad([-320,0,-400],[320,0,-400],[320,420,-400],[-320,420,-400],PAL.wall,{edgeA:.12});
    for(let x=-280;x<=280;x+=40) quad([x,0,-399],[x+2,0,-399],[x+2,420,-399],[x,420,-399],'rgba(170,125,80,.16)',{flat:true,edge:false});
    // 前墙（备料墙）
    quad([-320,0,400],[320,0,400],[320,420,400],[-320,420,400],PAL.wall,{edgeA:.12});
    for(let x=-280;x<=280;x+=40) quad([x,0,399],[x+2,0,399],[x+2,420,399],[x,420,399],'rgba(170,125,80,.16)',{flat:true,edge:false});
    // 左右墙
    quad([-320,0,-400],[-320,0,400],[-320,420,400],[-320,420,-400],PAL.wall2,{edgeA:.1});
    quad([320,0,400],[320,0,-400],[320,420,-400],[320,420,400],shade(PAL.wall2,-.04),{edgeA:.1});
    // 踢脚线
    box(0,36,-396,640,72,10,PAL.teal);
    box(0,36,396,640,72,10,PAL.teal);
    // 侧墙挂画（平面）
    for(const sx of [-1,1]){
      const wx=sx*318;
      quad([wx+sx*14,196,-72],[wx+sx*14,196,72],[wx+sx*14,304,72],[wx+sx*14,304,-72],'#F7E9D0',{flat:true,edgeA:.12});
      quad([wx+sx*15,208,-60],[wx+sx*15,208,60],[wx+sx*15,292,60],[wx+sx*15,292,-60],sx<0?'#3F8E82':'#D9C48A',{flat:true,edgeA:.12});
    }
    // 侧墙护墙板
    box(-316,42,0,8,84,760,PAL.wood);
    box(316,42,0,8,84,760,PAL.wood);
    box(-315,86,0,9,4,760,PAL.cream);
    box(315,86,0,9,4,760,PAL.cream);
    // 两侧窗（平面）
    for(const sx of [-1,1]){
      const wx=sx*318;
      quad([wx+sx*14,224,30],[wx+sx*14,224,210],[wx+sx*14,376,210],[wx+sx*14,376,30],'#F7E9D0',{flat:true,edgeA:.12});
      quad([wx+sx*15,232,38],[wx+sx*15,232,202],[wx+sx*15,368,202],[wx+sx*15,368,38],'#7FAAB4',{flat:true,edgeA:.12});
      quad([wx+sx*16,234,116],[wx+sx*16,234,124],[wx+sx*16,366,124],[wx+sx*16,366,116],'#FFF6E2',{flat:true,edgeA:.12});
      quad([wx+sx*16,296,40],[wx+sx*16,296,200],[wx+sx*16,304,200],[wx+sx*16,304,40],'#FFF6E2',{flat:true,edgeA:.12});
    }

    // 侧墙酒架
    for(const sx of [-1,1]){
      const wx=sx*298;
      box(wx,286,0,22,9,190,PAL.woodD);
      for(let i=0;i<3;i++){
        cyl(wx+sx*2,314,-60+i*60,7,46,['#8FAE8B','#D9A05B','#6E8FA8'][i],5,{edgeA:.16});
        cyl(wx+sx*2,340,-60+i*60,3,8,PAL.brass,5,{edgeA:.14});
      }
    }
    // 左墙壁灯
    box(-312,320,-120,14,6,26,PAL.brass);
    ellip(-312,306,-120,16,12,10,7,4,'#F2C878');
    // 右墙挂钩
    for(const z of [-40,0,40]) box(316,250,z,4,30,3,PAL.brass);
  }

  function backbar(){
    // 吧台后墙酒架
    box(0,340,-392,600,10,26,PAL.woodD);
    box(0,262,-392,600,10,26,PAL.woodD);
    // 层板暖灯
    for(const sy of [348,270]) box(0,sy,-378,560,3,3,'#F2C878',{flat:true,edge:false});
    for(const bx of [-240,-120,0,120,240]) box(bx,330,-384,6,14,10,PAL.brass,{edgeA:.06});
    // 酒瓶
    const cols=['#7A4A2A','#D9C089','#8FAE8B','#D9A05B','#B64A3A','#6E8FA8','#C9B27A','#8C5E8A'];
    for(let i=0;i<10;i++){
      const x=-250+i*56;
      cyl(x,366,-390,13,66,cols[i%cols.length],6,{edgeA:.16});
      cyl(x,404,-390,8,14,cols[i%cols.length],6,{edgeA:.16});
      cyl(x,414,-390,4,10,PAL.brass,5,{edgeA:.14});
      box(x,370,-371,13,17,2,'#FFF6E2',{edgeA:.04});
      
    }
    // 顶部木牌
    box(0,300,-396,210,40,5,PAL.woodD);
    box(0,300,-393,180,26,2,PAL.cream);
  }

  function bar(){
    // 前吧台
    box(0,58,-230,620,116,100,PAL.teal);
    box(0,122,-230,650,14,116,PAL.wood);
    box(0,16,-174,620,6,6,PAL.brass);
    // 台面垫
    box(-140,128,-225,190,4,62,PAL.tealD);
    // 果盘
    cyl(95,128,-236,32,8,PAL.cream,8,{edgeA:.15});
    ellip(80,144,-236,13,13,13,6,3,'#E08A3C');
    ellip(104,146,-236,11,11,11,6,3,'#B94A3C');
    ellip(92,148,-236,9,11,9,6,3,'#6FA35B');
    // 毛巾
    box(-205,126,-208,52,6,40,'#3F7D71');
    // 右侧植物
    cyl(180,142,-215,22,28,'#B9783F',6,{edgeA:.15});
    ellip(180,196,-215,32,38,30,7,4,'#3E7C5B');
    ellip(162,218,-215,20,24,18,6,3,'#4C8E68');
    ellip(196,220,-215,18,22,16,6,3,'#356B4D');
    // 吧台小工具
    cyl(-170,142,-214,12,42,'#DCE3E4',8,{edgeA:.08});
    cyl(-170,166,-214,8,9,'#CCD5D6',8,{edgeA:.08});
    cyl(-118,132,-214,6,20,'#DCE3E4',7,{edgeA:.08});
    // 前板木线条
    for(const x of [-240,-120,0,120,240]) box(x,64,-170,4,104,4,PAL.tealD);
    box(0,110,-170,650,6,5,PAL.wood);
    box(0,38,-170,650,4,4,PAL.brass);
        box(-120,66,-169,170,82,2,PAL.tealD);
    box(120,66,-169,170,82,2,PAL.tealD);
    for(const x of [-200,-80,80,200]) box(x,64,-168,5,132,3,shade(PAL.teal,-.14),{edgeA:.05});
    for(const y of [98,40]) box(0,y,-168,600,4,3,PAL.woodD,{edgeA:.06});
  }

  function prep(){
    // 备料墙四抽屉
    const cx=[150,50,-50,-150];
    for(let i=0;i<4;i++){
      box(cx[i],230,396,92,140,30,PAL.cream);
      box(cx[i],230,379,78,116,8,i===0?'#3F8E82':(i===1?'#9EC7D6':(i===2?'#D9C48A':'#BFD8D0')));
      cyl(cx[i],230,374,6,6,PAL.brass,6,{edgeA:.2});
    }
    // 备料台
    box(0,58,300,620,116,90,PAL.woodD);
    box(0,122,300,650,12,100,PAL.wood);
    // 台上砧板
    box(-120,122,300,150,6,60,PAL.woodD);
    // 侧边架子
    box(-300,260,300,20,260,90,PAL.woodD);
    box(300,260,300,20,260,90,PAL.woodD);
  }

  function place(p,x,z,s,rot){
    const c=Math.cos(rot||0), sn=Math.sin(rot||0);
    return [x+(p[0]*c+p[2]*sn)*s, p[1]*s, z+(-p[0]*sn+p[2]*c)*s];
  }

  function customer(kind,x,z,s,yaw,mood,active,blink){
    const S=NPC_STYLE[kind]||NPC_STYLE.fox;
    const g=(p)=>place(p,x,z,s,yaw);
    const addP=(pts,col,o)=>add(pts.map(g),col,o);
    addP([[-54,4,-2],[0,4,42],[54,4,-2],[0,4,-46]],'rgba(92,58,32,.16)',{flat:true,edge:false});
    // 躯干：上宽下窄的折纸筒
    for(let i=0;i<10;i++){
      const y0=100+i*15.2, y1=100+(i+1)*15.2, r0=62-i*1.2, r1=62-(i+1)*1.2;
      for(let u=0;u<18;u++){
        const a0=Math.PI*2*u/18, a1=Math.PI*2*(u+1)/18;
        addP([[Math.cos(a0)*r0,y0,Math.sin(a0)*r0],[Math.cos(a1)*r0,y0,Math.sin(a1)*r0],
              [Math.cos(a1)*r1,y1,Math.sin(a1)*r1],[Math.cos(a0)*r1,y1,Math.sin(a0)*r1]],S.jacket,{edge:false});
      }
    }
    // 肩线
    addP([[-64,248,18],[64,248,18],[62,230,38],[-62,230,38]],S.jacket,{edgeA:.14});
    // 前襟围裙
    addP([[-22,226,48],[22,226,48],[26,150,54],[-26,150,54]],'#F7E9D0',{edgeA:.16});
    addP([[-15,228,50],[0,206,56],[15,228,50]],'#FFF8EC',{edgeA:.12});
    // 围巾 + 领口
    addP([[-40,240,44],[0,252,50],[40,240,44],[0,228,48]],S.scarf,{edgeA:.16});
    addP([[-18,240,52],[-4,226,56],[-10,218,56],[-26,234,52]],'#2A635A',{flat:true,edge:false});
    addP([[18,240,52],[4,226,56],[10,218,56],[26,234,52]],'#2A635A',{flat:true,edge:false});
    // 围裙口袋
    addP([[-18,206,56],[18,206,56],[16,186,57],[-16,186,57]],'#F0DFC2',{flat:true,edgeA:.05});
    // 袖子
    for(const sx of [-1,1]){
      addP([[sx*34,242,64],[sx*60,238,58],[sx*76,158,52],[sx*54,150,58]],S.jacket);
      addP([[sx*58,238,58],[sx*74,232,50],[sx*86,164,44],[sx*76,158,52]],S.jacket2||S.jacket);
    }
    // 手
    ellip(...g([-82,146,58]),11,10,10,8,4,S.cream);
    ellip(...g([82,146,58]),11,10,10,8,4,S.cream);
    for(const sx of [-1,1]){
      ellip(g([sx*74,160,58])[0],160*s,g([0,0,0])[2]+58*s,13*s,7*s,12*s,10,5,'#FFF3DC',{flat:true,edgeA:.04});
      addP([[sx*56,238,58],[sx*62,238,56],[sx*78,164,50],[sx*72,164,52]],S.jacket2||S.jacket,{flat:true,edge:false});
    }
    // 头
    ellip(g([0,282,0])[0],282*s,g([0,0,0])[2],66*s,62*s,60*s,22,14,S.fur);
    // 口鼻
    const mz=g([0,0,0])[2];
    ellip(g([0,258,50])[0],258*s,mz+50*s,28*s,22*s,22*s,14,10,S.cream);
    ellip(g([0,266,70])[0],266*s,mz+70*s,8*s,7*s,7*s,8,5,'#3A2418');
    // 腮红
    addP([[-48,262,46],[-30,258,52],[-26,270,52],[-44,274,48]],'#E8938B',{flat:true,edge:false});
    addP([[48,262,46],[30,258,52],[26,270,52],[44,274,48]],'#E8938B',{flat:true,edge:false});
    // 耳朵
    if(kind==='rabbit'){
      for(const sx of [-1,1]){
        addP([[sx*24,318,2],[sx*42,322,0],[sx*48,386,-8]],S.fur);
        addP([[sx*26,318,6],[sx*38,358,4],[sx*30,326,8]],S.cream,{flat:true,edge:false});
      }
    } else if(kind==='bear'||kind==='panda'){
      const ec=kind==='panda'?'#2E2B2B':S.fur;
      ellip(g([-50,328,-4])[0],328*s,mz-4*s,25*s,23*s,12*s,9,5,ec);
      ellip(g([50,328,-4])[0],328*s,mz-4*s,25*s,23*s,12*s,9,5,ec);
      ellip(g([-50,332,6])[0],332*s,mz+6*s,13*s,12*s,5*s,8,4,kind==='panda'?'#4A4545':S.cream);
      ellip(g([50,332,6])[0],332*s,mz+6*s,13*s,12*s,5*s,8,4,kind==='panda'?'#4A4545':S.cream);
    } else {
      for(const sx of [-1,1]){
        addP([[sx*70,306,-4],[sx*38,314,8],[sx*50,374,-8]],S.fur);
        addP([[sx*70,306,-4],[sx*50,374,-8],[sx*64,334,12]],S.fur2);
        addP([[sx*56,322,2],[sx*46,322,6],[sx*50,356,0]],'#F3C9B4',{flat:true,edge:false});
      }
      addP([[-10,342,2],[0,356,6],[10,342,2]],S.fur2,{edgeA:.08});
      addP([[-64,300,18],[-76,290,14],[-62,282,22]],S.fur,{flat:true,edge:false});
      addP([[64,300,18],[76,290,14],[62,282,22]],S.fur,{flat:true,edge:false});
    }
    // 熊猫眼斑
    if(kind==='panda'){
      addP([[-50,286,50],[-17,282,56],[-15,300,56],[-44,302,52]],'#2E2B2B',{flat:true,edge:false});
      addP([[50,286,50],[17,282,56],[15,300,56],[44,302,52]],'#2E2B2B',{flat:true,edge:false});
    }
    // 五官：大眼白 + 瞳孔 + 高光，哑光卡通
    const zf=g([0,0,0])[2];
    for(const sx of [-1,1]){
      const ex=g([sx*23,290,60])[0];
      ellip(ex,290*s,zf+60*s,15*s,16*s*blink,2.2,12,8,'#FFFDF4',{flat:true,edgeA:.04});
      ellip(ex,288*s,zf+63*s,7.2*s,(mood==='sad'?8.5:7.6)*s*blink,2,9,6,'#3A2418',{flat:true,edge:false});
      ellip(ex-2.5*s,(290+2*blink)*s,zf+65*s,2.6*s,3.2*s*blink,1.2,6,4,'#FFFFFF',{flat:true,edge:false});
      // 眉毛
      addP([[sx*34,304,58],[sx*9,304,62],[sx*9,299,62],[sx*34,299,58]],'#7A5238',{flat:true,edge:false});
    }
    // 微笑弧
    addP([[-11,247,68],[0,240,70],[11,247,68],[0,244,70]],'#3A2418',{flat:true,edge:false});
    if(mood==='sad') addP([[-8,241,68],[0,246,70],[8,241,68],[0,243,70]],'#3A2418',{flat:true,edge:false});
  }

  function render(){
    if(!ctx) return;
    try{
    const front=Math.cos(cam.yaw*Math.PI/180);
    if(front>.8 && art.room){
      ctx.fillStyle='#181823';ctx.fillRect(0,0,W,H);
      const shift=Math.sin(cam.yaw*Math.PI/180)*250;
      ctx.drawImage(art.room,-160+shift,110,800,540);
      const guests=seats.map((order,i)=>({order,i})).filter(g=>g.order);
      const selected=guests.find(g=>g.i===active)||guests[0];
      const others=guests.filter(g=>g!==selected);
      for(const [index,guest] of [selected,...others].entries()){
        if(!guest)continue;
        const image=art[guest.order.npc];if(!image)continue;
        const height=index===0?410:330,width=height*image.width/image.height;
        const x=W/2+shift+(index===1?-160:index===2?160:0);
        ctx.drawImage(image,x-width/2,735-height+2*Math.sin(performance.now()/600+index),width,height);
      }
      if(art.walnut)ctx.drawImage(art.walnut,0,637,W,138);
      ctx.fillStyle='#aa8150';ctx.fillRect(0,738,W,3);return;
    }
    faces.length=0;
    try{
    room();
    backbar();
    bar();
    prep();
    const list=seats||[];
    for(let i=0;i<list.length;i++){
      const o=list[i]; if(!o) continue;
      const cur=i===0;
      const x=cur?0:(i===1?96:-84);
      const z=cur?-360:-368;
      const s=cur?.92:(i===1?.78:.74);
      const yaw=cur?0:(i===1?-.16:.16);
      const t=performance.now()/1000+(o.no||0)*1.37;
      const blink=Math.max(.05,Math.min(1,Math.abs(t%3.6-.18)/.18));
      customer(o.npc,x,z,s*(1+.012*Math.sin(t*2.4)),yaw+.085*Math.sin(t),o.mood||'neutral',cur,blink);
    }
    }catch(e){ ctx.fillStyle='#000'; ctx.font='11px monospace'; ctx.fillText('ERR '+String(e && e.stack || e).slice(0,260),16,300); return; }
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#1d1c28'; ctx.fillRect(0,0,W,H);
    // 远到近
    faces.sort((a,b)=>b.depth-a.depth);
    for(const f of faces){
      ctx.beginPath();
      f.pp.forEach((p,i)=> i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
      ctx.closePath();
      ctx.fillStyle=f.fill; ctx.fill();
      if(f.edge){
        ctx.strokeStyle=(f.lit>0.93)?`rgba(255,250,236,${f.edgeA*1.3})`:`rgba(80,48,26,${f.edgeA})`;
        ctx.lineWidth=.55; ctx.lineJoin='round'; ctx.stroke();
      }
    }
    // 吧台招牌文字
    const ay=((cam.yaw%360)+360)%360;
    if(ay<35 || ay>325){
      const q=projCam(toCam([0,64,-162]));
      if(q){ ctx.fillStyle='#F7E6C4'; ctx.font='900 12px Georgia,serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('C R A Z Y   B A R',q[0],q[1]); }
    }
    // 备料抽屉标签
    if(Math.abs(((cam.yaw%360)+360)%360-180)<50 && cam.pitch>-20){
      const labs=[['基酒',150],['辅料',50],['冰',-50],['杯具',-150]];
      ctx.textAlign='center'; ctx.textBaseline='middle';
      for(const [txt,x] of labs){
        const c=toCam([x,250,374]); if(!c) continue; const q=projCam(c); if(!q) continue;
        const w=46,h=18;
        ctx.fillStyle='rgba(255,248,232,.94)';
        ctx.beginPath(); ctx.roundRect(q[0]-w/2,q[1]-h/2,w,h,5); ctx.fill();
        ctx.fillStyle='#513540'; ctx.font='700 11px sans-serif'; ctx.fillText(txt,q[0],q[1]+.5);
      }
    }
    // 纸感暗角
    const vg=ctx.createRadialGradient(W/2,H*.46,120,W/2,H*.46,W*.8);
    vg.addColorStop(0,'rgba(60,35,20,0)'); vg.addColorStop(1,'rgba(60,35,20,.18)');
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    }catch(e){ ctx.fillStyle='#000'; ctx.fillRect(0,0,W,90); ctx.fillStyle='#f66'; ctx.font='11px monospace'; ctx.fillText('RENDER '+String(e && e.stack || e).slice(0,300),12,30); }
  }

  return {init,setCam,setSeats,getCam,render,animate:render,drink(mood){if(seats[active])seats[active].mood=mood;render();}};
})();

;
/* =========================================================
   场景构建 · 2.5D 酒吧
   ========================================================= */
const DECO_BOTTLES = ['gin','bourbon','tonic','rum','bitters','syrup','lemon','lime','gin','rum','bourbon','tonic'];

/* ---------- 小图标 ---------- */
function ziBottle(){return `<svg viewBox="0 0 24 24"><path d="M10 2h4v5l2 3v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10l2-3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 13h8" stroke="currentColor" stroke-width="1.6"/></svg>`;}
function ziFridge(){return `<svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 9h14M15 5v2M15 12v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;}
function ziGlass(){return `<svg viewBox="0 0 24 24"><path d="M7 3h10l-1.2 8.5a4 4 0 0 1-7.6 0z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 15v6M8 21h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;}
function ziIce(){return `<svg viewBox="0 0 24 24"><path d="M12 2v20M4 6l16 12M20 6L4 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;}

function pzPlate(icon, cn, en, sub){
  return `<div class="pz-plate">
    <span class="pz-ico">${icon}</span>
    <span class="pz-tt"><b>${cn}</b><em>${en}</em></span>
    <span class="pz-sub">${sub}</span>
  </div>`;
}
function prepItem(kind, id, label, art, cls=''){
  return `<div class="pickable pzi ${cls}" data-pick="${kind}:${id}">
    <span class="pz-art">${art}</span>
    <span class="pz-nm">${label}</span>
    <span class="badge"></span>
  </div>`;
}

/* =========================================================
   封面
   ========================================================= */
function liveCoverHTML(){
  return `<section class="live-cover">
    <div class="lc-shade"></div>
    <button class="sound-switch" id="soundSwitch">声音设置</button>
    <div class="lc-hero">
      <div class="kicker">WHISKEY SALOON</div>
      <h1>疯狂吧台</h1>
      <div class="sub">一分半钟营业，今晚你当班</div>
    </div>
    <div class="lc-cta">
      <button class="btn btn-start" id="startBtn">开始游戏<small>ENTER THE BAR</small></button>
      <button class="shift-guide" id="guideBtn">查看调酒手册</button>
    </div>
  </section>`;
}
function coverScene(){
  const shelf = (n, op) => `<div class="shelf s${n}"><div class="shelf-bottles">${
    Array.from({length:12},(_,i)=>{
      const k = DECO_BOTTLES[i%DECO_BOTTLES.length];
      return `<div class="sb" style="opacity:${op};transform:translateY(${(i%3)*2}px)">${bottleSVG(k)}</div>`;
    }).join('')
  }</div></div>`;
  return `<section class="scene cover enter" data-scene="cover">
    <div class="bg">
      <div class="wall"></div>
      ${shelf(1,.8)}
      <div class="mirror"></div>
      <div class="neon-cover">CRAZY BAR</div>
    </div>
    <div class="corner">2026 · CRAZY BAR · DEMO</div>
    <div class="hero">
      <div class="kicker">A COCKTAIL STORY</div>
      <h1><span>疯</span><span>狂</span><span>吧</span><span>台</span></h1>
      <div class="sub">调制你的第一杯人气鸡尾酒</div>
      <div class="titleLine"></div>
    </div>
    <div class="npc">${paperFigure(animalPaper('fox','happy'))}</div>
    <div class="counter"><div class="c-top"></div><div class="c-lip"></div><div class="c-front"></div></div>
    <div class="drinks">
      <div class="glass-item g1">${glassSVG('coupe',{color:'#E4AE55',deep:'#B9742C',ratio:.74,foam:true,garnish:'cherry'})}</div>
      <div class="glass-item g2">${glassSVG('highball',{color:'#D8EDE8',deep:'#B6D6CE',ratio:.82,ice:'spear',garnish:'lime',fizz:true})}</div>
      <div class="glass-item g3">${glassSVG('collins',{color:'#CFE39B',deep:'#9BBE63',ratio:.86,ice:'crushed',garnish:'mint'})}</div>
      <div class="glass-item g4">${glassSVG('rocks',{color:'#C56A2A',deep:'#8A3E13',ratio:.6,ice:'big',garnish:'orange'})}</div>
    </div>
    <div class="vignette"></div>
    <div class="cta">
      <button class="btn btn-start" id="startBtn">开始游戏<small>ENTER THE BAR</small></button>
      <div class="tip">选料 · 控量 · 摇杯 · 交付</div>
    </div>
  </section>`;
}

/* =========================================================
   吧台 · 多客人
   ========================================================= */
function barOrderCard(o, i){
  const active = i===D.active;
  return `<div class="ocard ${active?'active':''}" data-seat="${i}">
    <div class="oc-top">
      <span class="oc-av">${animalPaper(o.npc,'happy')}</span>
      <span class="oc-who">${ANIMAL_NAMES[o.npc]||'客人'}</span>
      <span class="oc-no">#${o.no}</span>
    </div>
    <div class="oc-name">${o.name}<small>${o.en}</small></div>
    ${o.note?`<div class="oc-note">“${o.note}”</div>`:'<div class="oc-note quiet">经典配方</div>'}
    <div class="oc-meta">
      <span>${GLASSES[o.glass].short}</span><span>${ICES[o.ice].short}</span><span>${o.method==='shake'?'摇和':'搅拌'}</span>
    </div>
    <div class="oc-cta">${active?'正在接单':'点击接单'}</div>
    <i class="oc-tail"></i>
  </div>`;
}
function barCustomer(o, i){
  const active = i===D.active;
  return `<div class="cust ${active?'active':''}" data-seat="${i}" id="cust-${i}">
    <span class="cust-shadow"></span>
    ${paperFigure(animalPaper(o.npc,'happy'))}
    <span class="cust-name">${ANIMAL_NAMES[o.npc]||'客人'}</span>
  </div>`;
}
function barScene(){
  const o = D.order;
  const cards = [0,1,2].map(i=>D.seats[i] ? barOrderCard(D.seats[i],i) : `<div class="ocard empty" data-seat="${i}"></div>`).join('');
  const npcs = [0,1,2].map(i=>D.seats[i] ? barCustomer(D.seats[i],i) : `<div class="cust empty" data-seat="${i}"></div>`).join('');
  return `<section class="scene bar enter" data-scene="bar">
    <div class="bar-wall">
      <div class="wall-planks"></div>
      <div class="neon"><span>CRAZY</span><b>BAR</b></div>
            <div class="plant"><i class="leaf"></i><i class="leaf"></i><i class="leaf"></i><i class="leaf"></i><i class="pot"></i></div>
      <div class="wall-note">TONIGHT · ${D.total} GUESTS</div>
    </div>
    <div class="hud-top">
      <button class="icon-btn light" id="homeBtn" aria-label="返回封面">${ICON.arrow}</button>
      <div class="title"><div class="t1">疯狂吧台</div><div class="t2">今晚 ${D.total} 位客人 · 已出杯 ${D.served}</div></div>
      <div class="coin-pill">${ICON.coin}<span id="coinNum">${D.coins}</span></div>
    </div>
    <div class="order-cards">${cards}</div>
    <div class="customers">${npcs}</div>
    <div class="counter">
      <div class="counter-top">
        <div class="mat"></div>
        <div class="bar-tools">
          <div class="bt bt1">${shakerSVG()}</div>
          <div class="bt bt2">${jiggerSVG()}</div>
          <div class="bt bt3">${glassSVG('rocks',{ratio:0})}</div>
          <div class="bt bt4">${strainerSVG()}</div>
        </div>
        <div class="candle"><div class="wax"></div><div class="flame"></div></div>
        <div class="bowl"><div class="b"></div><div class="fr" style="left:10px;top:-10px;background:#E8B33C"></div><div class="fr" style="left:26px;top:-12px;background:#8CC152"></div><div class="fr" style="left:20px;top:-4px;background:#D96A3B"></div></div>
      </div>
      <div class="counter-lip"></div>
      <div class="counter-front">
        <div class="front-panel p1"></div><div class="front-panel p2"></div><div class="front-panel p3"></div>
        <div class="bar-towel"></div>
        <div class="coasters"></div>
        <div class="foot-rail"></div>
      </div>
    </div>
    <div class="bottom">
      <div class="hintbox">
        <div class="step-k">ORDER ${o?o.no:1} / ${D.total}</div>
        <div class="hint" id="barHint">接单 <b>${o?o.name:''}</b> · ${o&&o.note?o.note:'经典'} · 还差 <b>${Math.max(0,needCount()-selectedCount())}</b> 样材料</div>
      </div>
      <button class="btn btn-main" id="toPrep">去备料区 →<span class="sub">BACK BAR</span></button>
    </div>
    ${makeLayerHTML()}
  </section>`;
}

/* =========================================================
   制作层（保持原结构）
   ========================================================= */
function makeLayerHTML(){
  const o = D.order;
  return `<div class="make-layer" id="makeLayer">
    <div class="make-bg"></div>
    <div class="make-shelf"><div class="ms-bottles">${Array.from({length:6},(_,i)=>`<div class="msb">${bottleSVG(DECO_BOTTLES[(i*2)%DECO_BOTTLES.length])}</div>`).join('')}</div><div class="ms-rail"></div></div>
    ${serviceHeader(o,true)}
    <div class="station" id="station">
      <div class="mat"></div>
      <div class="vessel-wrap" id="vesselWrap"></div>
      <div class="glass-wrap" id="glassWrap"></div>
      <div class="garnish-wrap" id="garnishWrap"></div>
      <div class="jigger">${jiggerSVG()}</div>
      <div class="strainer">${strainerSVG()}</div>

      <div class="towel">${towelSVG()}</div>
      <div class="stream" id="stream"></div>
      <div class="splash" id="splash"></div>
      <div class="pour-rig" id="pourRig"><div class="bottle" id="pourBottle"></div></div>
    </div>
    <div class="tap-hint" id="tapHint"><div class="arr">↑</div><div>向上推给客人</div></div>
    <div class="mix-controls">
      <div class="gauge" id="gauge"><div class="bar"><div class="band" id="gaugeBand"></div><div class="fill" id="gaugeFill"></div></div><div class="lbl" id="gaugeLbl">点材料开始倒入</div><div class="val" id="gaugeVal">绿区停手</div></div>
      <div class="ing-rail" id="ingRail"></div>
    </div>
    <div class="bottom">
      <div class="hintbox"><div class="step-k" id="stepK">STEP 1 / 4</div><div class="hint" id="makeHint">点材料开始倒酒，绿区停手。</div></div>
      <button class="btn btn-pause" id="pauseBtn" hidden>暂停</button>
      <button class="btn btn-act" id="actBtn">倒酒</button><button type="button" class="redo-btn" id="redoDrink" aria-label="重新调制整杯酒">↻ 重调</button>
    </div>
  </div>`;
}

/* =========================================================
   备料区 · 四区
   ========================================================= */
function prepOrderStrip(order){
  const chips = [];
  const sp = order.ingredients.find(i=>i.role==='spirit');
  if(sp) chips.push(sp.short);
  order.ingredients.forEach(i=>{ if(i.role!=='spirit' && i.target>0) chips.push(i.short); });
  chips.push(ICES[order.ice].short, GLASSES[order.glass].short, order.method==='shake'?'摇和':'搅拌');
  return `<div class="ostrip">
    <div class="os-tab">第 ${order.no} 单</div>
    <div class="os-main">
      <div class="os-name">${order.name}<span>${order.en}</span></div>
      <div class="os-note">${order.note?`“${order.note}”`:'经典配方'} <em>${order.tierName}</em></div>
    </div>
    <div class="os-chips">${chips.map(c=>`<span>${c}</span>`).join('')}</div>
  </div>`;
}

function prepSpiritZone(){
  const items = [
    ['bourbon','波本'],['gin','金酒'],['rum','白朗姆']
  ].map(([k,n])=>prepItem('spirit',k,n,bottleSVG(k),'pz-bottle')).join('')
  + prepItem('aux','bitters','苦精',bottleSVG('bitters'),'pz-small')
  + prepItem('aux','sugar','方糖',itemSVG('sugar'),'pz-small');
  return `<section class="pz pz-spirit">
    ${pzPlate(ziBottle(),'酒柜','SPIRITS','基酒与苦精')}
    <div class="pz-row">${items}</div>
  </section>`;
}

function prepFridgeZone(){
  const items = [
    ['lemon','柠檬汁',bottleSVG('lemon')],
    ['lime','青柠汁',bottleSVG('lime')],
    ['egg','蛋清',bottleSVG('egg')],
    ['mint','薄荷',itemSVG('mint')],
    ['limewedge','青柠角',itemSVG('limewedge')],
    ['syrup','糖浆',bottleSVG('syrup')],
    ['tonic','汤力水',bottleSVG('tonic')]
  ].map(([id,n,a])=>prepItem('aux',id,n,a)).join('');
  return `<section class="pz pz-fridge">
    ${pzPlate(ziFridge(),'冰箱','FRIDGE','果汁 · 蛋清 · 薄荷')}
    <div class="pz-row">${items}</div>
  </section>`;
}

function prepGlassZone(){
  const list = [['coupe','文香杯'],['highball','高球杯'],['collins','长饮杯'],['rocks','古典杯']];
  const items = list.map(([g,n])=>prepItem('glass',g,n,g==='shaker'?shakerSVG({cap:true}):glassSVG(g,{ratio:0}),'pz-glass')).join('');
  return `<section class="pz pz-glass">
    ${pzPlate(ziGlass(),'杯具','GLASSWARE','选一个成品杯')}
    <div class="pz-row">${items}</div>
  </section>`;
}

function prepIceZone(){
  const items = [['big','大方冰'],['spear','长条冰'],['crushed','碎冰']]
    .map(([k,n])=>prepItem('ice',k,n,iceSVG(k),'pz-ice')).join('');
  return `<section class="pz pz-ice">
    ${pzPlate(ziIce(),'冰台','ICE','冰型决定口感')}
    <div class="pz-row">${items}</div>
  </section>`;
}

function prepScene(){
  const o = D.order;
  return `<section class="scene prep enter" data-scene="prep">
    <div class="prep-wall"><div class="tiles"></div><div class="prep-neon">PREP STATION</div></div>
    <div class="hud-top">
      <button class="icon-btn light" id="prepBackBtn">${ICON.arrow}</button>
      <div class="title"><div class="t1">备料区</div><div class="t2">BACK BAR · 拿齐材料再回吧台</div></div>
      <div class="top-actions"><div class="lv-timer js-timer"><span class="lt-ico">⏱</span><span class="lt-val">01:30</span></div><div class="coin-pill"><span>${scoreLabel()}</span></div></div>
    </div>
    ${prepOrderStrip(o)}
    <div class="prep-zones">
      ${prepSpiritZone()}
      ${prepFridgeZone()}
      <div class="pz-pair">
        ${prepGlassZone()}
        ${prepIceZone()}
      </div>
    </div>
    <div id="tray"><span class="tr-label">已选</span><div class="chips" id="trayChips"><div class="empty">还没有拿东西 · 点上面的四区选料</div></div></div>
    <div class="cta">
      <div class="status"><div class="s1" id="prepStatus1">还差 ${Math.max(0,needCount()-selectedCount())} 样</div><div class="s2" id="prepStatus2">照着订单拿：基酒 · 配料 · 冰 · 杯子</div></div>
      <button class="btn btn-go" id="goBarBtn" disabled>回吧台制作<span class="sub">MAKE IT</span></button>
    </div>
  </section>`;
}

/* =========================================================
   v2：3D 房间里的吧台世界 / 备料世界 / 固定 HUD
   ========================================================= */
function barCustomerV2(o,i){
  const cls = i===0?'cur':(i===1?'wait w1':'wait w2');
  return `<div class="cust ${cls}" data-seat="${i}" id="cust-${i}">
    <span class="cust-shadow"></span>
    ${i===0?`<div class="cust-bubble"><b>${o.name}</b><span>${o.note?`“${o.note}”`:'经典配方'}</span></div>`:''}
    ${paperFigure(animalPaper(o.npc,'happy'))}
    <span class="cust-name">${i===0?(ANIMAL_NAMES[o.npc]||'客人'):''}</span>
  </div>`;
}
function barCounterV2(){
  return `<div class="counter">
    <div class="counter-top">
      <div class="mat"></div>
      <div class="bar-tools">
        <div class="bt bt1">${shakerSVG()}</div>
        <div class="bt bt2">${jiggerSVG()}</div>
        <div class="bt bt3">${glassSVG('rocks',{ratio:0})}</div>
        <div class="bt bt4">${strainerSVG()}</div>
      </div>
      <div class="candle"><div class="wax"></div><div class="flame"></div></div>
      <div class="bowl"><div class="b"></div><div class="fr" style="left:10px;top:-10px;background:#E8B33C"></div><div class="fr" style="left:26px;top:-12px;background:#8CC152"></div><div class="fr" style="left:20px;top:-4px;background:#D96A3B"></div></div>
    </div>
    <div class="counter-lip"></div>
    <div class="counter-front">
      <div class="front-panel p1"></div><div class="front-panel p2"></div><div class="front-panel p3"></div>
      <div class="bar-towel"></div><div class="coasters"></div><div class="foot-rail"></div>
    </div>
  </div>`;
}
function barWorld(){
  const seats = D.seats;
  const cur = seats[0] ? barCustomerV2(seats[0],0) : '';
  const w1 = seats[1] ? barCustomerV2(seats[1],1) : '';
  const w2 = seats[2] ? barCustomerV2(seats[2],2) : '';
  return `<section class="scene bar" data-scene="bar">
    <div class="bar-wall">
      <div class="wall-planks"></div>
      <div class="neon"><span>CRAZY</span><b>BAR</b></div>
      <div class="plant"><i class="leaf"></i><i class="leaf"></i><i class="leaf"></i><i class="leaf"></i><i class="pot"></i></div>
      <div class="wall-note">TONIGHT · ONE BY ONE</div>
    </div>
    <div class="customers">${cur}${w1}${w2}</div>
    ${barCounterV2()}
  </section>`;
}
function prepWorld(){
  return `<section class="scene prep" data-scene="prep">
    <div class="prep-wall"><div class="tiles"></div><div class="prep-neon">BACK · BAR</div></div>
    <div class="prep-zones">
      ${prepSpiritZone()}
      ${prepFridgeZone()}
      <div class="pz-pair">${prepGlassZone()}${prepIceZone()}</div>
    </div>
  </section>`;
}
function serviceHeader(o,making){return `    <div class="topbar">
      <button class="icon-btn" id="${making?'backToBarBtn':'fhHome'}" aria-label="返回">${ICON.arrow}</button>
      <div class="title"><div class="t1">${making||D.screen==='prep'?o.name:`<details class="order-menu"><summary>${o.name} ▾</summary><div class="ticket-rail">${D.seats.map((t,i)=>`<button data-ticket="${i}" aria-pressed="${i===D.active}"><small>${ANIMAL_NAMES[t.npc]}</small><b>${t.name}</b><span>${t.methodName}</span>${t.rushUntil?`<em data-rush="${t.no}"></em>`:''}</button>`).join('')}</div></details>`}</div></div>
      <div class="top-actions"><div class="lv-timer js-timer"><span class="lt-ico">⏱</span><span class="lt-val">01:30</span></div><div class="coin-pill"><span>${scoreLabel()}</span></div><button type="button" class="nav-music" data-music aria-label="音乐设置">♫</button></div>
    </div>
    <section class="compact-recipe">
      <div class="guest-line"><img src="${nightAsset('face-'+o.npc)}" alt="${ANIMAL_NAMES[o.npc]}"><span>${ANIMAL_NAMES[o.npc]} 说：<b>${o.note||'照平常做'}</b></span>${o.rushUntil?`<em data-rush="${o.no}"></em>`:''}</div>
      <div class="recipe-chips">${[...o.ingredients.filter(i=>i.target>0).map(i=>[i.id,i.short]),[o.ice,ICES[o.ice].short],[o.glass,GLASSES[o.glass].short]].map(([id,name])=>`<span class="${D.screen==='prep'&&!making&&[D.pick.spirit,D.pick.ice,D.pick.glass,...D.pick.aux].includes(id)?'collected':''}">${stockArt(id)}${name}</span>`).join('')}</div>
      ${!making&&D.screen==='prep'?`<nav class="prep-orders" aria-label="客人酒单">${D.seats.map((t,i)=>`<button data-ticket="${i}" aria-pressed="${i===D.active}"><small>${ANIMAL_NAMES[t.npc]}</small><b>${t.name}</b></button>`).join('')}</nav>`:''}
    </section>
`;}
function hudHTML(){
  if(D.screen==='cover') return coverScene();
  const o=D.order;
  const ready=isReady();
  const prep=D.screen==='prep';
  let action='', hint='';
  if(D.tasting){
    /* v11.15：交付后先让客人喝完并给出评价，此期间锁住「开始制作」，避免重复做同一杯 */
    action='<button class="fh-btn tasting" id="fhAction" disabled>客人正在品尝…</button>';
    hint=`${(o&&ANIMAL_NAMES[o.npc])||'客人'} 喝了一口 · 正在给反馈`;
  }else if(prep){
    action=`<button class="fh-btn" id="fhAction" ${ready?'':'disabled'}>${ready?'转回吧台 →':'还差材料'}</button>`;
    if(ready) hint='材料齐了，转身去做酒';
    else{
      const left=Math.max(0,needCount()-selectedCount());
      /* v11.10：点空白不再退出放大，改为明确的按钮，避免误触退回选料界面 */
      hint=(D.prepFocus?'点材料放进托盘 · 点柜外空白或左下按钮返回':(S3===canvasBar?'点材料选取，再点放回':'点柜子放大，再点材料'))+` · 还差 <b>${left}</b> 样`;
    }
  }else if(ready){
    action='<button class="fh-btn" id="fhAction">开始制作 →</button>';
    hint='材料齐了 · 低头到吧台，开始调酒';
  }else{
    action='<button class="fh-btn" id="fhAction">转身备料 →</button>';
    hint=`接单 <b>${o.name}</b> · 先去备料墙拿齐材料`;
  }
  return `<div class="fh ${prep&&D.prepFocus?'shelf-focus':''}">
    ${serviceHeader(o,false)}
    ${prep&&!D.prepFocus?`<div class="prep-hot">${[0,1,2,3].map(i=>`<button data-focus="${i}" aria-label="打开${['酒柜','辅料台','冰柜','杯架'][i]}"></button>`).join('')}</div>`:''}
    <div class="fh-bottom">${prep&&D.prepFocus?'<button class="fh-exit" id="fhExitZoom">← 退出放大</button>':''}${action}</div>
  </div>`;
}

/* ===== v2 选关 ===== */
function levelsScene(){
  const cards=LEVELS2.map(L=>{
    const on=L.id<=SAVE.unlocked;
    if(!on && L.id>SAVE.unlocked+1) return '';
    if(!on) return `<div class="lv-card locked"><div class="lv-no">?</div><div class="lv-main"><div class="lv-name">未解锁</div><div class="lv-sub">通关上一关后开启</div></div><div class="lv-cta">LOCKED</div></div>`;
    const best=SAVE.bestScores?.[L.id]||0, goal=shiftGoals[L.id-1];
    const st=[goal,goal+100,goal+200].filter(n=>best>=n).length;
    return `<div class="lv-card on" data-level="${L.id}">
      <div class="lv-no">${L.id}</div>
      <div class="lv-main"><div class="lv-name">${L.name}<small>目标 ${goal} 分 · 最佳 ${best} 分</small></div>
        <div class="lv-stars">${[1,2,3].map(i=>`<i class="${i<=st?'on':''}">★</i>`).join('')}</div></div>
      <div class="lv-cta">开始 →</div>
    </div>`;
  }).join('');
  return `<section class="levels">
    <div class="lv-bg"><div class="lv-glow"></div></div>
    <div class="lv-top"><button class="icon-btn light" id="lvBack">${ICON.arrow}</button>
      <div class="lv-title">选择关卡<span>一分半钟营业挑战</span></div>
      <div class="fh-coin">${ICON.coin}<span>${SAVE.coins}</span></div></div>
    <div class="lv-list">${cards}${(SAVE.bestScores?.[3]||0)>=shiftGoals[2]?`<button class="lv-card on" id="nightStart"><span class="lv-no">∞</span><span class="lv-main"><span class="lv-name">无尽夜班</span><small>最高 ${SAVE.nightBest?.total||0} 分 · 最远第 ${SAVE.nightBest?.round||0} 轮</small></span><span class="lv-cta">开班 →</span></button>`:''}</div>
    <div class="lv-hero">
      <div class="lv-hero-glow"></div>
      <div class="lv-hero-glass">${glassSVG('coupe',{ratio:.86,color:'#E3A74F',garnish:'cherry',foam:false})}</div>
      <div class="lv-hero-cap">LEVEL ${SAVE.unlocked} · ${LEVELS2[SAVE.unlocked-1].name}</div>
      <div class="lv-hero-sub">${LEVELS2[SAVE.unlocked-1].sub}</div>
      <div class="lv-guests">${levelRoster(SAVE.unlocked).slice(0,3).map(k=>`<span><img alt="" src="${nightAsset('face-'+k)}"></span>`).join('')}<em>${levelRoster(SAVE.unlocked).length+' 位常客'}</em></div>
    </div>
    <button class="lv-start" id="lvStart">进入第 ${SAVE.unlocked} 关 →</button>
    <div class="lv-tip">限时 1 分 30 秒 · 第三关按酒款计分 · 达标开启下一关</div>
  </section>`;
}

;
/* =========================================================
   制作流程
   ========================================================= */
const M = {
  active:false, step:0, order:null, queue:[], pours:{}, perfect:0,
  pouring:false, paused:false, current:null, amount:0, raf:0, startedAt:0, dblAt:0,
  ice:false, method:0, methodNeed:0, strained:false, garnish:false,
  serving:false, sy0:0, lastY:0, lastT:0, finish:false
};

const DRINK_COLOR = {
  sour:['#E3A74F','#A96223'], gin:['#DCEFEA','#A9C9C4'],
  mojito:['#CFE39B','#8FB35C'], of:['#C06426','#7A3510']
};
function drinkColors(){ return DRINK_COLOR[M.order.recipeId] || ['#D9A441','#9A5E1E']; }

function openMake(auto){
  const layer = $('#makeLayer');
  if(!layer) return;
  D.autoMake = false;
  M.active = true; M.step = 0; M.order = D.order;
  M.queue = M.order.ingredients.filter(i=>i.target>0).map(i=>{
    if(i.role!=='spirit' || D.pick.spirit===i.id) return {...i};
    const actual=SPIRITS[D.pick.spirit];
    return {...i,id:D.pick.spirit,short:actual.short,name:actual.name,color:actual.liquid};
  });
  if(M.raf) cancelAnimationFrame(M.raf);
  M.pours = {}; M.perfect = 0; M.pouring = false; M.paused = false; M.amount = 0; M.dblAt = 0;
  M.serving = false; M.sy0 = 0; M.hold=null; M.circle=null; M.lastT=-Infinity;
  M.ice = D.pick.ice; M.method = 0; M.methodNeed = M.order.method==='build'?3:8; _lastMag=0;
  M.strained = false; M.garnish = false; M.finish = false;
  layer.classList.add('on');
  renderVessel(true); renderGlass(); renderRail(); setStep(0);
  layer.onclick = onMakeClick;
  layer.onpointerdown = onMakeDown;
  layer.onpointermove = onMakeMove;
  layer.onpointerup = onMakeUp;
  layer.onpointercancel = onMakeUp;
  const redo=$('#redoDrink');
  redo.onclick=()=>{if(M.active){SFX.tick();openMake(false);}};
  layer.ondragstart=e=>e.preventDefault();
  previewIngredient(M.queue[0]);
  SFX.whoosh();
  if(auto) setTimeout(()=>{ if(!M.pouring && !M.paused && M.step===0) beginPour(M.queue[0]); }, 300);
}
function closeMake(){
  const layer = $('#makeLayer');
  if(!layer) return;
  cancelAnimationFrame(M.raf);
  M.pouring = false; M.paused = false; M.active = false;
  layer.classList.remove('on');
  document.documentElement.classList.remove('making');
  SFX.whoosh();
}

/* ---------- 步骤 ---------- */
function setStep(n){
  M.step = n;
  const meter=$('#gauge'); if(meter) meter.hidden=n!==0;
  const layer = $('#makeLayer'); if(!layer) return;
  layer.classList.toggle('ready-to-serve',n===3);
  $$('.steps .st', layer).forEach(el=>{
    const s = +el.dataset.step;
    el.classList.toggle('on', s===n);
    el.classList.toggle('done', s<n);
  });
  const k = $('#stepK'), hint = $('#makeHint'), btn = $('#actBtn');
  const o = M.order;
  const texts = [
    ['STEP 1 / 4','按住倒酒，松手停。','等酒入壶'],
    ['STEP 2 / 4', o.method==='build'?'沿杯身画 3 圈，或点「轻搅」。':o.method==='shake'?'摇动手机 8 下，也可点「摇一下」。':'沿杯身画 8 圈，也可点「搅一下」。',(o.method==='build'?'轻搅 ':o.method==='shake'?'摇一下 ':'搅一下 ')+'0/'+M.methodNeed],
    ['STEP 3 / 4','扣上滤冰器，把酒滤进成品杯；装饰会自动添加。','滤入杯中'],
    ['STEP 4 / 4','轻点桌中央的酒，或向上推出交付。','交给'+ANIMAL_NAMES[o.npc]]
  ][n] || ['','',''];
  if(k) k.textContent = o.method==='build'?(['杯中直调','杯中轻搅','','交付'][n]):texts[0];
  if(hint) hint.textContent = texts[1];
  if(btn){
    btn.textContent = texts[2];
    btn.disabled = n===0;
    btn.classList.toggle('wait', btn.disabled);
  }
  updatePourControls();
  renderRail();
  renderVessel();
}
function renderVessel(initial){
  const w = $('#vesselWrap'); if(!w) return;
  const o = M.order;
  const [c1,c2] = drinkColors();
  if(o.method==='build'){w.innerHTML='';return;}
  if(o.method==='shake'){
    w.innerHTML = shakerSVG({cap: M.step>=1 || M.strained===false && M.step>1});
  } else {
    const total = M.queue.filter(q=>q.unit==='ml').reduce((a,b)=>a+b.target,0) || 1;
    const got = M.queue.filter(q=>q.unit==='ml').reduce((a,b)=>a+(M.pours[b.id]||0),0);
    const ratio = M.strained ? .12 : clamp(.18 + got/total*.6, .18, .86);
    w.innerHTML = `<div class="mix-pitcher"><img alt="" src="${nightAsset('pitcher')}"><div class="mix-level" style="height:${ratio*74}%;background:${c1}"></div>${M.ice&&!M.strained?'<div class="mix-ice">'+iceSVG(M.ice)+'</div>':''}</div>`;
  }
  if(o.method==='stir' && M.step<2) w.querySelector('.mix-pitcher').insertAdjacentHTML('beforeend',mixingSpoon());
  w.classList.remove('shake-anim','stir-anim');
  if(M.step===1){
    w.style.setProperty('--mix-progress',M.method/M.methodNeed);
    if(o.method==='shake')w.insertAdjacentHTML('beforeend','<div class="shaker-frost"></div>');
    else w.querySelector('.mix-ice')?.insertAdjacentHTML('beforeend',stockArt('mint'));
  }
}
function mixingSpoon(){
  return '<span class="mixing-spoon" aria-hidden="true">'+barSpoonSVG()+'</span>';
}
function renderGlass(){
  const w = $('#glassWrap'); if(!w) return;
  const o = M.order;
  const [c1,c2] = drinkColors();
  const poured=M.queue.reduce((sum,i)=>sum+(i.unit==='ml'?(M.pours[i.id]||0):0),0);
  const capacity=M.queue.reduce((sum,i)=>sum+(i.unit==='ml'?i.target:0),0);
  const ratio = o.method==='build'?clamp(poured/capacity*.8,0,.92):M.strained ? (o.glass==='coupe'? .7 : o.glass==='rocks'? .62 : .8) : 0;
  if(o.glass==='shaker' || D.pick.glass==='shaker'){
    w.innerHTML = shakerSVG({cap:true});
    return;
  }
  w.innerHTML = glassSVG(D.pick.glass||o.glass,{
    ratio, color:c1, deep:c2,
    ice: M.strained || o.method==='build' ? M.ice : null,
    garnish: M.garnish ? o.garnish : null,
    foam: M.strained && (M.pours.egg||0)>0,
    fizz: M.strained && o.recipeId==='gin'
  });
  if(o.method==='build' && !M.strained) w.insertAdjacentHTML('beforeend',mixingSpoon());
}

/* ---------- 原料栏 ---------- */
function ingModel(id){
  return stockArt(id);
}
function garnishArt(kind){
  if(kind==='cherry') return `<svg class="model" viewBox="0 0 120 120"><path d="M60 28 Q66 10 82 8" fill="none" stroke="#5C7A3A" stroke-width="3"/>
    <circle cx="58" cy="66" r="30" fill="#C8323C"/><circle cx="50" cy="56" r="9" fill="rgba(255,255,255,.35)"/>
    <circle cx="68" cy="76" r="4" fill="rgba(120,20,30,.4)"/></svg>`;
  if(kind==='lime') return itemSVG('limewedge');
  if(kind==='mint') return itemSVG('mint');
  return `<svg class="model" viewBox="0 0 120 120"><path d="M22 84 Q40 28 92 18 Q96 64 56 86 Q38 94 22 84Z" fill="#E08A2C" stroke="#B4621A" stroke-width="2"/>
    <path d="M32 78 Q54 50 84 30" fill="none" stroke="#F6C272" stroke-width="4" opacity=".7"/></svg>`;
}
function renderRail(){
  const rail = $('#ingRail'); if(!rail) return;
  const o = M.order;
  if(M.step===0){
    rail.innerHTML = M.queue.map(i=>{
      const done = M.pours[i.id]!=null;
      const liquid=i.unit==='ml';
      const short=liquid && done && Math.abs(M.pours[i.id]-i.target)>tol(i);
      const action=liquid?(done?'已倒入':'按住倒入'):(done?'已加入':i.id==='limewedge'?'点按挤入':'点按加入');
      return `<div class="ing-card ${done?'done':''}" data-ing="${i.id}">
        <div class="cap">${ingModel(i.id)}</div>
        <div class="lb">${i.short}</div>
        <div class="need">${action}</div>
      </div>`;
    }).join('');
  } else if(M.step===1){
    rail.innerHTML = `<div class="method-card">
      <div class="mc-ico">${stockArt(o.method==='shake'?'shaker':'jigger')}</div>
      <div class="mc-body"><div class="mc-t">${o.method==='build'?'杯中轻搅':o.method==='shake'?'上下摇匀':'画圈搅拌'}</div>
      <div class="mc-s">${o.method==='build'?'轻搅 3 下':o.method==='shake'?'摇 8 下':'搅 8 圈'} · 已 ${M.method}/${M.methodNeed}</div>
      ${o.method==='shake' && typeof DeviceMotionEvent!=='undefined' && DeviceMotionEvent.requestPermission && !M.motionAsked?'<button id="enableMotion">启用摇手机</button>':''}
      <div class="mc-bar"><i style="width:${Math.min(100,M.method/M.methodNeed*100)}%"></i></div></div>
    </div>`;
  } else if(M.step===2){
    rail.innerHTML = `<div class="method-card"><div class="mc-ico">${stockArt('strainer')}</div><div class="mc-body"><div class="mc-t">滤冰入杯</div>
      <div class="mc-s">滤冰器扣上，酒液滤进 ${GLASSES[o.glass].name}</div></div></div>`;
  } else if(M.step===3){
    rail.innerHTML = `<div class="method-card"><div class="mc-ico">${stockArt(o.glass)}</div><div class="mc-body"><div class="mc-t">端给客人</div>
      <div class="mc-s">按住杯子向上推，或点右边的按钮</div></div></div>`;
  }
}

/* ---------- 倒酒 ---------- */
function updatePourControls(){
  const pause=$('#pauseBtn');if(pause)pause.hidden=true;
}
function previewIngredient(ing){
  M.current=ing; M.amount=M.pours[ing.id]||0;
  const band=$('#gaugeBand'), max=targetMax(ing);
  $('#gauge').hidden=ing.unit!=='ml';
  band.style.left=((ing.target-tol(ing))/max*100)+'%';
  band.style.width=(2*tol(ing)/max*100)+'%';
  band.parentElement.style.setProperty('--target',(ing.target/max*100)+'%');
  updateGauge();
}
function samplePour(now){
  M.amount=Math.min(targetMax(M.current),targetMax(M.current)*Math.max(0,now-M.startedAt)/1500);
}
function startTick(){
  const tick=now=>{
    if(!M.active||!M.pouring)return;
    samplePour(now);updateGauge();
    if(M.amount>=targetMax(M.current)){stopPour(true);return;}
    M.raf=requestAnimationFrame(tick);
  };
  M.raf=requestAnimationFrame(tick);
}
function beginPour(ing){
  if(!M.active || M.step!==0 || M.pouring || M.paused || !ing) return;
  if(ing.unit!=='ml'){
    if(M.pours[ing.id]!=null)return;
    M.pours[ing.id]=ing.target;
    SFX.ice();toast(ing.id==='limewedge'?'青柠已挤入杯中':ing.short+'已加入',700);
    refreshIngredients();
    return;
  }
  delete M.pours[ing.id];
  M.pouring=true;M.paused=false;
  M.startedAt=performance.now();previewIngredient(ing);
  $('#actBtn').disabled=true;
  const rig = $('#pourRig'), b = $('#pourBottle'), gauge = $('#gauge');
  const [c1] = drinkColors();
  if(b) b.innerHTML = ingModel(ing.id);
  if(rig){ rig.style.setProperty('--stream', ing.unit==='ml'?c1:'#ffd98a'); rig.classList.add('on'); }
  if(gauge){
    gauge.classList.add('on');
    const max = targetMax(ing);
    const band = $('#gaugeBand');
    if(band){ band.style.left = ((ing.target - tol(ing))/max*100)+'%'; band.style.width = (tol(ing)*2/max*100)+'%'; }
    updateGauge();
  }
  const stream = $('#stream'); if(stream) stream.classList.add('on','fall');
  SFX.pour();
  startTick();
  updatePourControls();
}
function targetMax(ing){ return ing.tiers[1] / .60; }
function tol(ing){ return ing.unit==='ml'?targetMax(ing)*.06:0; }
function updateGauge(){
  const ing = M.current; if(!ing) return;
  const max = targetMax(ing);
  const f = $('#gaugeFill'), l = $('#gaugeLbl'), v = $('#gaugeVal');
  if(f) f.style.width = (clamp(M.amount,0,max)/max*100)+'%';
  if(l) l.textContent = `${ing.short}`;
  if(v) v.innerHTML = `金线附近松手`;
}
function stopPour(auto){
  if(!M.pouring) return;
  if(!auto)samplePour(performance.now());
  M.hold=null; M.pouring = false; M.paused = false;
  cancelAnimationFrame(M.raf);
  const ing = M.current;
  const amt = M.amount;
  M.pours[ing.id] = amt;
  const ok = Math.abs(amt-ing.target) <= tol(ing);
  if(ok){ SFX.ding(); toast('正好 · 完美刻度'); }
  else SFX.tick();
  const rig = $('#pourRig'); if(rig){ rig.classList.remove('on'); }
  const stream = $('#stream'); if(stream) stream.classList.remove('on','fall');
  refreshIngredients();
}
function refreshIngredients(){
  M.perfect=M.queue.filter(i=>i.unit==='ml' && Math.abs(M.pours[i.id]-i.target)<=tol(i)).length;
  renderVessel();renderGlass();renderRail();
  const next=M.queue.find(i=>M.pours[i.id]==null);
  const btn=$('#actBtn');btn.disabled=!!next;btn.classList.toggle('wait',!!next);
  btn.textContent=next?'继续加料':M.order.method==='build'?'开始轻搅':M.order.method==='shake'?'开始摇和':'开始搅拌';
  if(next)previewIngredient(next);
}
function advancePour(){
  setStep(1);
}
/* ---------- 加冰 / 摇和 / 滤酒 / 装饰 / 交付 ---------- */
function addMethod(n=1){
  if(!M.active || M.step!==1) return;
  const now = performance.now();
  
  M.lastT = now;
  M.method = clamp(M.method+n, 0, M.methodNeed);
  const o = M.order;
  const w = $(o.method==='build'?'#glassWrap':'#vesselWrap');
  if(o.method==='shake'){w.classList.remove('shake-anim');void w.offsetWidth;w.classList.add('shake-anim');}
  else if(!M.circle) w.querySelector('.mixing-spoon')?.animate([{transform:'translateX(-6px) rotate(-13deg)'},{transform:'translate(6px,-3px) rotate(13deg)'},{transform:'translateX(-6px) rotate(-13deg)'}],260);
  if(o.method==='shake') SFX.shake(); else SFX.stir();
  const btn = $('#actBtn');
  if(btn) btn.textContent = (o.method==='build'?'轻搅 ':o.method==='shake'?'摇一下 ':'搅一下 ')+M.method+'/'+M.methodNeed;
  renderRail();
  if(w){
    w.style.setProperty('--mix-progress',String(M.method/M.methodNeed));
    const ice=w.querySelector('.mix-ice');if(ice)ice.style.transform='rotate('+M.method*45+'deg)';
  }
  if(M.method>=M.methodNeed)finishMethod();
}
function finishMethod(){
  if(M.step!==1) return;
  const w = $('#vesselWrap'); if(w) w.classList.remove('shake-anim','stir-anim');
  const o = M.order;
  if(o.method==='build'){M.strained=true;M.garnish=true;renderGlass();setStep(3);SFX.ding();return;}
  toast(o.method==='shake'?'壶身结霜 · 摇好了':'香气出来了 · 搅好了');
  SFX.ding();
  setStep(2);
}
function strain(){
  if(M.step!==2 || $('#makeLayer')?.querySelector('.strain-stream')) return;
  const w = $('#vesselWrap');
  const layer = $('#makeLayer');
  if(w) w.classList.add('tilt');
  const st = document.createElement('div');
  st.className = 'strain-stream';
  st.style.left = '34%'; st.style.top = '46%';
  layer.appendChild(st);
  SFX.pour();
  setTimeout(()=>{
    if(!M.active || layer!==$('#makeLayer')) return;
    M.strained = true;
    renderGlass();
    const g = $('#glassWrap'); if(g){ g.classList.add('fill-pop'); setTimeout(()=>g.classList.remove('fill-pop'),600); }
    if(st) st.remove();
    if(w){ w.classList.remove('tilt'); renderVessel(); }
    M.garnish = true;
    renderGlass();
    toast('装饰已自动添加');
    setStep(3);
  }, 780);
}
function addGarnish(kind){
  if(M.step!==3 || M.garnish) return;
  M.garnish = true;
  const g = $('#glassWrap');
  if(g){ g.classList.add('garnish-pop'); setTimeout(()=>g.classList.remove('garnish-pop'),700); }
  renderGlass();
  SFX.ice();
  const o = M.order;
  toast(kind===o.garnish?'装饰到位':'装饰不太对');
  
}
function serve(){
  if(M.step<3 || M.serving) return;
  M.serving = true;
  /* v11.13：用户要求「交付完马上就是下一名客人」——去掉 800ms 飞杯过渡动画，
     交付判定后直接进入 finishRound()，不再插入任何中间 DOM 动画。 */
  SFX.whoosh();
  finishRound();
}

function onMakeClick(e){
  if(M.step===3 && e.target.closest('#glassWrap')){serve();return;}
  if(e.target.closest('#actBtn')){ handleAct(); return; }

  if(M.step===1 && M.order.method!=='stir' && e.target.closest('#glassWrap,#vesselWrap,.method-card') && !e.target.closest('#enableMotion')){addMethod();return;}
  if(e.target.closest('#glassWrap') && M.step===2){ strain(); return; }
}
function handleAct(){
  if(M.pouring){ stopPour(false); return; }
  if(M.step===0 && M.queue.every(i=>M.pours[i.id]!=null)){advancePour();return;}
  if(M.step===1){ addMethod(1); return; }
  if(M.step===2){ strain(); return; }
  if(M.step>=3){ serve(); return; }
}
function onMakeDown(e){
  if(M.step===1 && M.order.method==='shake' && e.target.closest('#enableMotion')){
    M.motionAsked=true;
    if(typeof DeviceMotionEvent!=='undefined' && DeviceMotionEvent.requestPermission){
      try{DeviceMotionEvent.requestPermission().then(state=>{if(state!=='granted')toast('可以点「摇一下」完成');}).catch(()=>toast('可以点「摇一下」完成'));}catch(err){}
    }
  }
  const card=e.target.closest('#ingRail [data-ing]');
  if(M.step===0 && card && !M.pouring){
    const ing=M.queue.find(i=>i.id===card.dataset.ing);
    e.preventDefault();
    const layer=e.currentTarget;layer.setPointerCapture(e.pointerId);
    beginPour(ing);if(M.pouring)M.hold=e.pointerId;
  }
  if(M.step===1 && M.order.method!=='shake' && e.target.closest(M.order.method==='build'?'#glassWrap':'#vesselWrap')){
    const r=e.target.closest('#glassWrap,#vesselWrap').getBoundingClientRect();
    M.circle={id:e.pointerId,x:r.left+r.width/2,y:r.top+r.height/2,total:0};
    e.currentTarget.setPointerCapture(e.pointerId);trackCircle(e);
  }
  if(M.step===3 && e.target.closest('#glassWrap')){
    M.sy0=e.clientY;
    $('#glassWrap').setPointerCapture(e.pointerId);
  }
}
function trackCircle(e){
  const c=M.circle;if(!c||c.id!==e.pointerId||M.step!==1)return;
  const dx=e.clientX-c.x,dy=e.clientY-c.y;
  if(Math.hypot(dx,dy)<8){c.angle=null;return;}
  const angle=Math.atan2(dy,dx);
  const spoon=$('#makeLayer .mixing-spoon');
  if(spoon)spoon.style.transform='translateX('+6*Math.cos(angle)+'px) rotate('+13*Math.cos(angle)+'deg)';
  if(c.angle!=null){
    const diff=angle-c.angle;
    const delta=Math.atan2(Math.sin(diff),Math.cos(diff));
    if(Math.abs(delta)<Math.PI/2)c.total+=delta;
    if(Math.abs(c.total)>=2*Math.PI-.015){c.total=0;addMethod();}
  }
  c.angle=angle;
}
function onMakeMove(e){
  trackCircle(e);
  if(M.step===3 && M.sy0 && M.sy0-e.clientY>46)serve();
}
function onMakeUp(e){
  if(M.hold===e.pointerId && M.pouring)stopPour(false);
  if(M.circle?.id===e.pointerId)M.circle=null;
  M.sy0=0;
}
/* ---------- 结算 ---------- */
function gradeRound(){
  const o = M.order, p = D.pick;
  const items = []; let minor=0,severe=0,near=0,tasteLine='';
  const sp = o.ingredients.find(i=>i.role==='spirit');
  if(p.spirit !== sp.id){
    severe++; items.push({ok:false,t:`基酒用错 · 客人要 ${SPIRITS[sp.id].name}`});
  } else items.push({ok:true,t:`基酒 · ${SPIRITS[sp.id].name}`});
  if(p.glass !== o.glass){ minor++; items.push({ok:false,t:`杯型不对 · 应该用 ${GLASSES[o.glass].name}`}); }
  else items.push({ok:true,t:`杯型 · ${GLASSES[o.glass].name}`});
  if(M.ice !== o.ice){ minor++; items.push({ok:false,t:`冰型不对 · 应该用 ${ICES[o.ice].name}`}); }
  else items.push({ok:true,t:`冰型 · ${ICES[o.ice].name}`});
  for(const i of o.ingredients.filter(i=>i.target>0)){
    const amt = M.pours[i.role==='spirit'?p.spirit:i.id]||0;
    if(Math.abs(amt-i.target) > tol(i)){
      const normal=i.tiers[1], direction=Math.sign(i.target-normal);
      if(direction && Math.sign(amt-normal)===-direction){
        severe++;tasteLine='我想要'+o.note+'，这杯调反了。';
      }else if(direction && Math.sign(amt-normal)===direction && Math.abs(amt-i.target)<=tol(i)*2.5){
        near++;if(!tasteLine)tasteLine='对，就是这个口味。';
      }else minor++;
      items.push({ok:false,t:`${i.short} ${fmt(amt)}${i.unit} · 目标 ${i.target}${i.unit}`});
    }
  }
  if(items.filter(x=>x.ok).length===3 && minor===0 && severe===0 && near===0){
    items.push({ok:true,t:`全部 ${o.ingredients.filter(i=>i.target>0).length} 样材料刻度精准`});
  }
  const extra = [...p.aux].filter(id=>!o.ingredients.some(i=>i.id===id && i.target>0));
  if(extra.length){ minor += extra.length; items.push({ok:false,t:`多拿了 ${extra.map(id=>AUX[id].short).join('、')}`}); }
  if(!M.garnish){ minor++; items.push({ok:false,t:'忘记装饰'}); }
  const stars = severe ? 1 : minor ? 2 : 3;
  const quality = clamp(100 - severe*45 - minor*8 - near*3, 0, 100);
  const score=quality*(D.level===3?({gin:1,sour:2,mojito:3}[o.recipeId]||1):1);
  const coins = 16 + stars*8 + M.perfect*2;
  return {stars, score, quality, coins, near,tasteLine, minor, severe, perfect:M.perfect, items, name:o.name, en:o.en, no:o.no, seat:o.seat};
}

function finishRound(){
  if(M.finish || !M.active || !checkClock()) return;
  M.finish = true;
  const res = gradeRound();            /* 计分公式零改动，结果只静默暂存 */
  D.streak=!res.near && res.severe===0 && res.minor===0 ? D.streak+1 : 0;
  D.bestStreak=Math.max(D.bestStreak,D.streak);
  res.tip=D.streak>=2 ? Math.min(5,D.streak) : 0;
  res.at=elapsedShift();
  res.rushTip=D.order.rushUntil && rushLeft(D.order)>0 && res.quality>=92 ? 5 : 0;
  res.coins+=res.tip+res.rushTip;
  D.results.push(res);
  D.served++;
  const cur = D.order;
  if(cur) cur.served = true;
  /* v11.14 修复交互障碍：旧版只 remove('.on')，残留的透明制作层仍以
     pointer-events:auto 盖住整屏（#makeRoot>* 的 ID 优先级压过 .make-layer），
     于是第一杯交付后「转身备料」真实点击会落在残留层上 —— 第二杯进不去备料墙。
     这里彻底移除制作层 DOM，并把非 .on 态的命中规则在 base.css 一并修正。 */
  if(typeof closeMake==='function') closeMake(true);
  makeRoot.innerHTML='';
  document.documentElement.classList.remove('making');
  M.active = false; M.pouring = false; M.paused = false;
  overlayEl.classList.remove('on');
  /* v11.15 交付顺序（用户本轮明确要求）：先让客人喝一口 → 表情 + 感叹语 →
     反馈播完再换下一位并贴上新订单。上一版把「贴下一位订单」和反馈同时做，
     玩家一交付就看到订单变了，评价浮层被忽略，观感上等于「没有反馈」。
     反馈期间 D.tasting 锁住「开始制作」，但仍不显示星级 / 分数 / 金币，
     没有「已送达」卡、没有「下一位」按钮、不需要玩家点任何东西。 */
  D.screen='bar';D.tasting=true;D.busy=true;
  camTo(0,2,0);renderWorld();renderHUD();
  const react=showServeReaction(res,cur,()=>{
    D.busy=false;D.tasting=false;
    if(D.timeUp || !checkClock()){showFinal();return;}
    advanceCustomer();renderWorld();renderHUD();
  });
}

function advanceCustomer(){
  const seat = D.order ? D.order.seat : 0;
  if(D.pending.length){
    D.seats[seat] = makeCustomer(D.pending.shift(), seat);
  } else {
    D.seats[seat] = null;
  }
  const next = D.seats.findIndex(o=>o && !o.served);
  if(next>=0) setActive(next);
}

/* 摇手机：仅在摇和步骤生效；按钮仍为降级方案 */
let _lastMag=0;
window.addEventListener('devicemotion',(e)=>{
  if(document.hidden || !M.active || M.step!==1 || !M.order || M.order.method!=='shake') return;
  const a=e.accelerationIncludingGravity; if(!a) return;
  const mag=Math.sqrt((a.x||0)**2+(a.y||0)**2+(a.z||0)**2);
  if(_lastMag && Math.abs(mag-_lastMag)>8 && performance.now()-M.lastT>220)addMethod(1);
  _lastMag=mag;
},{passive:true});

;
/* =========================================================
   疯狂吧台 · v2 第一人称 3D 房间 / 排队
   ========================================================= */
const D = {
  screen:'cover', coins:0, served:0, total:3, level:1, orderNo:0,
  seats:[], pending:[], active:0,
  order:null, pick:null, results:[], busy:false, booted:false,
  /* v11.15 · 营业计时与品尝反馈态 */
  timeLeft:90, timeUp:false, timerId:0, tasting:false,
  prepTab:'spirit', prepFocus:false
};
/* 每关营业时长：默认 1 分 30 秒。?timer=N 仅供自动化验收快速跑完一关，不改变正式玩法。 */
const LEVEL_SECONDS = (()=>{
  const n=parseInt(new URLSearchParams(location.search).get('timer')||'',10);
  return (n>0 && n<=3600) ? n : 90;
})();
const SEAT_NPCS = ['fox','bear','rabbit','panda'];
/* v11.12：补齐现有 4 关的 NPC 名单（不新增关卡、不新增酒品） */
const LEVEL_NPCS={
  1:['fox','bear','rabbit','cat','panda'],
  2:['bison','rabbit','heron','cat','armadillo','fox','rooster','panda','opossum','bear'],
  3:['vulture','fox','moose','bison','badger','cat','frog','heron','goat','rabbit','rooster','bear','armadillo','panda','opossum']
};
LEVEL_NPCS[4]=LEVEL_NPCS[3];
function levelRoster(n){ return LEVEL_NPCS[n]||SEAT_NPCS.slice(0,3); }
const stage = document.getElementById('stage');
const world = document.getElementById('world');
const scene3d = document.getElementById('scene3d');
const prepSheet = document.getElementById('prepSheet');
const ui = document.getElementById('ui');
const makeRoot = document.getElementById('makeRoot');
const fxEl = document.getElementById('fx');
const toastEl = document.getElementById('toast');
const overlayEl = document.getElementById('overlay');

let toastTimer=null;
function toast(t,ms=1500){ toastEl.textContent=t; toastEl.classList.add('on'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toastEl.classList.remove('on'),ms); }
function emptyPick(){ return {spirit:null,aux:new Set(),ice:null,glass:null}; }
/* =========================================================
   v11.15 · 营业计时 + 备料清空（会话层，不触碰 gradeRound / data.js / 解锁公式）
   ========================================================= */
function fmtTimer(s){
  s=Math.max(0,Math.floor(s));
  return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
}
function elapsedShift(){return LEVEL_SECONDS-D.timeLeft;}
function rushLeft(order){return Math.max(0,order.rushUntil-elapsedShift());}
function raceStatus(){
  const points=shiftScore(), goal=currentGoal();
  if(nightRound)return scoreLabel();
  const ghost=SAVE.races?.[D.level];
  if(ghost?.length){
    const prior=ghost.filter(split=>split.at<=elapsedShift()).at(-1)?.points || 0;
    const gap=points-prior;
    return gap===0?'与最佳局持平':(gap>0?'领先最佳局 ':'落后最佳局 ')+Math.abs(gap)+' 分';
  }
  return points<goal?'距通关 '+(goal-points)+' 分':'已达标 · 冲击更高分';
}
function updateRaceUI(){
  document.querySelectorAll('[data-rush]').forEach(el=>{
    const order=D.seats.find(t=>t.no===Number(el.dataset.rush));
    if(!order?.rushUntil) return;
    const left=rushLeft(order);
    el.textContent=left?'快单 '+left+'秒 · +5币':'快单已转普通单';
    el.classList.toggle('last-call',left>0 && left<=10);
  });
  document.querySelectorAll('.race-line').forEach(el=>{
    const text=raceStatus();
    el.textContent=D.timeLeft<=30?'收档冲刺 · '+text:text;
    el.classList.toggle('last-call',D.timeLeft<=30);
  });
}
function updateTimerUI(){
  updateRaceUI();
  const t=fmtTimer(D.timeLeft), urgent=D.timeLeft<=30;
  document.querySelectorAll('.js-timer').forEach(el=>{
    const v=el.querySelector('.lt-val'); if(v) v.textContent=t;
    el.classList.toggle('urgent',urgent);
    el.setAttribute('data-left',String(D.timeLeft));
  });
}
function stopTimer(){ if(D.timerId){ clearInterval(D.timerId); D.timerId=0; } }
const shiftGoals=[120,180,240,300];
function shiftScore(){return D.results.reduce((sum,r)=>sum+r.score,0);}
let nightRound=0, nightTotal=0;
function currentGoal(){return nightRound?Math.min(240+40*(nightRound-1),480):shiftGoals[D.level-1];}
function scoreLabel(){return nightRound?'第 '+nightRound+' 轮 · '+shiftScore()+'/'+currentGoal():shiftScore()+' 分';}
let deadline=0, hiddenAt=null;
function checkClock(){
  if(D.timeUp || !D.timerId) return false;
  const left=Math.max(0,Math.ceil((deadline-(hiddenAt??performance.now()))/1000));
  if(left!==D.timeLeft){
    D.timeLeft=left;updateTimerUI();
    if(left>0 && !document.hidden) remindWaitingGuest();
    if(!document.hidden && left>0 && left<=3) SFX.tick();
  }
  if(left>0) return true;
  D.timeUp=true;
  if(!D.tasting) showFinal();
  return false;
}
function startTimer(){
  stopTimer();
  deadline=performance.now()+LEVEL_SECONDS*1000;
  hiddenAt=document.hidden?performance.now():null;
  D.timeLeft=LEVEL_SECONDS; D.timeUp=false;
  D.timerId=setInterval(checkClock,100);
  updateTimerUI();
}
document.addEventListener('visibilitychange',()=>{
  if(!D.timerId) return;
  if(document.hidden){if(hiddenAt===null) hiddenAt=performance.now();}
  else if(hiddenAt!==null){deadline+=performance.now()-hiddenAt;hiddenAt=null;checkClock();}
});
/* 3D 备料柜的「已选光圈」与 D.pick 同步。旧版只在点材料时刷新，
   交付换人 / 切换关卡时从不刷新 → 上杯的框选会一直留在新一杯、新一关里。 */
function syncPicked(){
  if(typeof S3==='undefined' || !S3.setPicked) return;
  const p=D.pick||emptyPick(), keys=[];
  if(p.spirit) keys.push('spirit:'+p.spirit);
  if(p.aux) p.aux.forEach(id=>keys.push('aux:'+id));
  if(p.ice) keys.push('ice:'+p.ice);
  if(p.glass) keys.push('glass:'+p.glass);
  S3.setPicked(keys);   /* 传空数组时 26 件物件的选材环全部熄灭 */
}
function resetPicks(){
  D.pick=emptyPick();
  if(D.order) D.order.pick=D.pick;
  D.prepTab='spirit'; D.prepFocus=false;
  syncPicked();
}
function makeCustomer(seat){
  let id=LEVELS2[D.level-1-(D.orderNo%D.level)].drink;
  if(nightRound){
    const rotation=['gin','sour','mojito'];
    id=rotation[(D.orderNo+nightRound-1)%3];
    if(D.orderNo>=3 && D.orderNo%3===0 && Math.random()<Math.min(.45,(nightRound-1)*.07))id='mojito';
  }
  const o=makeOrder(id,pick(RECIPES[id].notes));
  o.orderIndex=D.orderNo++; o.no=o.orderIndex+1; o.seat=seat;
  const rushEvery=nightRound>=4?2:3;
  if(o.no%rushEvery===rushEvery-1) o.rushUntil=elapsedShift()+Math.max(28,48-4*(D.level-1));
  const roster=levelRoster(D.level);
  o.npc=roster[o.orderIndex%roster.length]; o.mood='neutral'; o.pick=emptyPick(); o.served=false;
  o.arrived=elapsedShift();o.reminders=0;
  return o;
}
function initLevel(level){
  SaloonGuest.show(null);
  D.level=level;
  if(typeof S3!=='undefined' && S3.setLevel) S3.setLevel(level);
  D.timeLeft=LEVEL_SECONDS;
  D.streak=0; D.bestStreak=0;
  D.total=3; D.served=0; D.results=[]; D.active=0; D.orderNo=0; D.paidOut=false;
  D.tasting=false; D.busy=false; D.timeUp=false;
  /* v11.12：老存档迁移——按已解锁关卡补齐吧台库存 */
  
    SAVE.inventory=['gin','bourbon','rum'].slice(0,Math.max(1,Math.min(3,SAVE.unlocked)));
  D.seats=[makeCustomer(0),makeCustomer(1),makeCustomer(2)];
  D.pending=[]; D.pick=emptyPick(); D.prepTab='spirit'; D.prepFocus=false;
  setActive(0);                       /* 内部 syncPicked() 清掉 3D 里所有旧框选 */
  D.coins=SAVE.coins;
}
let engineLoading=null, entering=false;
function loadEngine(){
  const url=document.documentElement.dataset.engine;
  if(!url || typeof S3!=='undefined')return Promise.resolve();
  if(!engineLoading)engineLoading=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=url;
    script.onload=()=>resolve();
    script.onerror=()=>{script.remove();engineLoading=null;reject(new Error('engine download'));};
    document.head.appendChild(script);
  });
  return engineLoading;
}
async function startLevel(level,round=0,total=0){
  if(entering)return;
  entering=true;
  const screen=D.screen;
  try{
    if(typeof S3==='undefined')toast('正在准备吧台…');
    await loadEngine();
    if(screen!==D.screen)return;
    ensureScene();
    nightRound=round;nightTotal=total;
    overlayEl.classList.remove('on');
    initLevel(level);startTimer();showBar(false);
  }catch(error){console.warn(error);toast('吧台加载失败，请再点一次');}
  finally{entering=false;}
}
function setActive(i){
  const o=D.seats[i]; if(!o){ D.order=null; D.pick=emptyPick(); syncPicked(); return; }
  D.active=i; D.order=o; D.pick=o.pick;
  syncPicked();                       /* 换人 = 换一份全新的空备料 */
}
function needCount(){ const o=D.order; return 1+o.ingredients.filter(i=>i.role!=='spirit'&&i.target>0).length+2; }
function selectedCount(){ return (D.pick.spirit?1:0)+D.pick.aux.size+(D.pick.ice?1:0)+(D.pick.glass?1:0); }
function requiredAux(){ return D.order.ingredients.filter(i=>i.role!=='spirit'&&i.target>0).map(i=>i.id); }
function isReady(){ const o=D.order; if(!o||!D.pick.spirit||!D.pick.ice||!D.pick.glass) return false; return requiredAux().every(id=>D.pick.aux.has(id)); }
/* =========================================================
   v11.14 · 交付评价（纯表现层）
   - 只读 gradeRound() 已算出的 minor / severe，不改计分公式、扣分优先级、星级
   - 客人喝完这一口给「表情 + 感叹语」，不显示星级 / 分数 / 金币
   - 浮层挂在 #fx(pointer-events:none)：不需要按钮、不阻塞「直接开下一杯」
   ========================================================= */
const REACT_GOOD=['Great!','Nice!','Good!','Yum~'];
const REACT_BAD=['Nope!','Hmm…','Ugh!'];
const FEEDBACK_MS=1500;               /* 反馈停留时长：看得清，又不拖慢开下一杯 */
let reactTimer=0, reactWorldTimer=0;
function serveMood(res){ return (res.minor===0&&res.severe===0)?'happy':(res.severe?'angry':'sad'); }
function serveLine(res){
  const i=Math.max(0,(res.no||1)-1);
  const arr=(res.minor===0&&res.severe===0)?REACT_GOOD:REACT_BAD;
  return arr[i%arr.length];
}
function showServeReaction(res,order,onDone){
  const good=res.minor===0&&res.severe===0;
  const mood=serveMood(res), line=res.tasteLine||serveLine(res);
  const npc=(order&&order.npc)||'fox';
  /* v11.15：先让客人真的举杯喝一口，再当场变脸；反馈播完才换下一位，
     避免「评价还没看清，订单已经换成别人」导致玩家以为没有反馈。 */
  SaloonGuest.taste(order);
  const old=fxEl.querySelector('.npc-react'); if(old) old.remove();
  clearTimeout(reactTimer); clearTimeout(reactWorldTimer);
  const el=document.createElement('div');
  el.className='npc-react'+(good?'':' bad')+' on';
  el.dataset.mood=mood; el.dataset.good=good?'1':'0'; el.dataset.line=line;
  el.dataset.served=String(D.served);
  el.innerHTML=
    `<div class="nr-tx"><span class="nr-who">${ANIMAL_NAMES[npc]||'客人'} 喝了一口</span>`+
    `<span class="nr-line">${line} · +${res.score} 分</span>`+
    `<span class="nr-sub">${res.rushTip?'快单达成 · +5 币　':''}${good?(res.tip ? '连续完美 '+D.streak+' 杯 · 小费 +'+res.tip : '正合口味 · 满意'):(res.items.find(item=>!item.ok)?.t || '不是我要的味道')}</span></div>`;
  fxEl.appendChild(el);
  reactTimer=setTimeout(()=>{ el.classList.remove('on'); setTimeout(()=>el.remove(),320); },FEEDBACK_MS);
  reactWorldTimer=setTimeout(()=>{ if(typeof onDone==='function') onDone(); },FEEDBACK_MS+120);
  return {good,mood,line};
}

/* ---------- camera ---------- */
const cam={yaw:0,pitch:0,roll:0};
let camRaf=0, camToken=0;
function applyCam(){
  const a=((cam.yaw%360)+360)%360; const prepSide=a>90&&a<270;
  stage.classList.toggle('prepview',prepSide);
  if(typeof S3!=='undefined') S3.setCam(cam.yaw,cam.pitch,cam.roll);
}
function camTo(yaw,pitch,dur=800,opt={}){
  cancelAnimationFrame(camRaf);
  const token=++camToken;
  const y0=cam.yaw,p0=cam.pitch,rollMax=opt.roll||0;
  if(document.documentElement.classList.contains('still')||dur<=0){ world.classList.remove('turning'); cam.yaw=yaw;cam.pitch=pitch;cam.roll=0;applyCam();return Promise.resolve(); }
  const t0=performance.now();
  world.classList.toggle('turning', Math.abs(yaw-y0)>40);
  return new Promise(res=>{
    const step=(t)=>{
      if(token!==camToken) return;
      let k=Math.min(1,(t-t0)/dur); const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
      cam.yaw=y0+(yaw-y0)*e; cam.pitch=p0+(pitch-p0)*e;
      cam.roll=rollMax*Math.sin(k*Math.PI);
      applyCam();
      if(k<1) camRaf=requestAnimationFrame(step);
      else { cam.roll=0; applyCam(); world.classList.remove('turning'); res(); }
    };
    camRaf=requestAnimationFrame(step);
  });
}

/* ---------- render ---------- */
function renderWorld(){
  SaloonGuest.show(D.screen==='bar'?D.order:null);
  if(typeof S3!=='undefined'){ S3.setSeats([],-1); S3.render(); }
}

function focusItems(){
  const t=D.prepTab;
  if(t==='spirit') return spiritPool().map(k=>({k,kind:'spirit',n:SPIRITS[k].name,ico:bottleSVG(k)}));
  if(t==='aux') return ['lemon','lime','syrup','tonic','egg','mint','limewedge'].map(k=>({k,kind:'aux',n:AUX[k].name,ico:['egg','mint','limewedge','sugar'].includes(k)?itemSVG(k):bottleSVG(k)}));
  if(t==='ice') return ['big','spear','crushed'].map(k=>({k,kind:'ice',n:ICES[k].name,ico:iceSVG(k)}));
  return ['rocks','collins','highball','coupe'].map(k=>({k,kind:'glass',n:GLASSES[k].name,ico:k==='shaker'?shakerSVG({cap:true}):glassSVG(k,{ratio:0})}));
}
function renderFocusPanel(){ /* 对话框已移除：选材改为直接点击 3D 建模物件 */ }

function renderHUD(){
  ui.innerHTML=hudHTML();
  if(D.screen==='cover'){ bindCover(); return; }
  bindHUD();
  if(D.screen==='prep' && S3===canvasBar){ renderPrepSheet(); prepSheet.classList.add('on'); }
  else if(prepSheet){ prepSheet.classList.remove('on'); prepSheet.innerHTML=''; }
  updateTimerUI();                 /* HUD 重绘后立刻把计时补回，不会闪成 01:30 */
}
function openSoundSettings(sound){
    overlayEl.innerHTML=`<section class="shift-manual audio-settings" role="dialog" aria-label="声音设置"><h2>声音设置</h2><label><input type="checkbox" id="muteAll"> 全部静音</label>
      <label>音乐音量<input type="range" id="musicLevel" min="0" max="1" step=".01"></label><label>操作音量<input type="range" id="effectsLevel" min="0" max="1" step=".01"></label>
      <button class="btn" id="closeSound">完成</button></section>`;
    overlayEl.classList.add('on');ui.inert=true;
    const music=$('#musicLevel'),effects=$('#effectsLevel'),mute=$('#muteAll');
    music.value=SAVE.musicVolume??.35;effects.value=SAVE.effectsVolume??1;mute.checked=!!SAVE.muted;
    music.oninput=()=>{SAVE.musicVolume=Number(music.value);saveGame();BGM.sync();};
    effects.oninput=()=>{SAVE.effectsVolume=Number(effects.value);saveGame();};
    mute.onchange=()=>{SAVE.muted=mute.checked;saveGame();BGM.start();};
    $('#closeSound').onclick=()=>{overlayEl.classList.remove('on');overlayEl.innerHTML='';ui.inert=false;sound.focus();};
}
document.addEventListener('click',e=>{const button=e.target.closest('[data-music],#soundSwitch');if(button)openSoundSettings(button);});
function bindCover(){
  const guide=document.getElementById('guideBtn');
  if(guide) guide.onclick=()=>{
    overlayEl.innerHTML=`<section class="shift-manual" role="dialog" aria-modal="true" aria-labelledby="manualTitle">
      <small>CRAZY BAR / STAFF BOOK</small><h2 id="manualTitle">调酒手册</h2>
      <ol><li><b>读单备料</b>记下客人的口味，直接点货架上的材料，拿齐基酒、辅料、冰和杯子。</li>
      <li><b>看刻度停手</b>按住材料倒酒，在金线附近松手。按份的材料点一下加入。备好的冰自动加入，接着摇和或搅拌。</li>
      <li><b>滤酒交杯</b>按提示滤入杯中，上滑交付。连续完美出杯，从第二杯开始赚小费。</li></ol>
      <p>快单在标注时间内高质量交付（品质达到 92%），多赚 5 枚金币。重玩可追赶最佳局的出杯进度。一分半钟内交杯才计分，第三关金汤力、威士忌酸、莫吉托满分各为 100、200、300 分。营业总分达到关卡目标即可晋级。</p><button class="btn" id="closeGuide">记住了</button></section>`;
    overlayEl.classList.add('on');
    ui.inert=true;
    const close=document.getElementById('closeGuide');
    close.focus();
    close.onclick=()=>{overlayEl.classList.remove('on'); overlayEl.innerHTML=''; ui.inert=false; guide.focus();};
    close.onkeydown=e=>{if(e.key==='Escape') close.click();};
  };
  const b=document.getElementById('startBtn');
  if(b) b.onclick=()=>{ SFX.unlock(); SFX.ding(); showLevels(); };
}
function bindHUD(){
  ui.querySelectorAll('[data-ticket]').forEach(button=>button.onclick=()=>{
    if(D.busy || D.tasting || D.timeUp) return;
    setActive(Number(button.dataset.ticket));renderWorld();renderHUD();SFX.tick();
  });
  const home=document.getElementById('fhHome');
  document.querySelectorAll('.prep-hot button').forEach(b=>b.onclick=()=>{ if(typeof S3!=='undefined'&&S3.focusTab) S3.focusTab(+b.dataset.focus); });
  /* v11.10：放大态退出只走这两个显式入口，点 3D 空白处不再误触退回 */
  const exitZoom=document.getElementById('fhExitZoom');
  if(exitZoom) exitZoom.onclick=()=>{
    if(D.screen==='prep'&&D.prepFocus){
      D.prepFocus=false; if(typeof S3!=='undefined'&&S3.blurStation) S3.blurStation(); renderHUD();
    }
  };
  if(home) home.onclick=()=>{
    if(D.busy) return;
    if(D.screen==='prep'){ goPrepToBar(false); return; }
    showLevels();
  };
  const act=document.getElementById('fhAction');
  if(act) act.onclick=()=>{
    if(D.busy) return;
    if(D.screen==='prep'){ if(!isReady()){toast('材料还没拿齐');SFX.sad();return;} goPrepToBar(); }
    else if(isReady()) startMake();
    else goBarToPrep();
  };
}
function bindPrepPicks(){ /* 旧备料墙已由 prepSheet 取代 */ }
function togglePick(key){
  const [type,id]=key.split(':');
  if(type==='spirit') D.pick.spirit=D.pick.spirit===id?null:id;
  else if(type==='aux'){ D.pick.aux.has(id)?D.pick.aux.delete(id):D.pick.aux.add(id); }
  else if(type==='ice') D.pick.ice=D.pick.ice===id?null:id;
  else if(type==='glass') D.pick.glass=D.pick.glass===id?null:id;
  SFX.pick(); refreshPicks();
  toast(isPicked(key)?'收进托盘':'放回去了',900);  /* v11.7：3D 直点选材的轻反馈 */
}

function spiritPool(){
  /* v11.12：基酒以「NPC 赠送 → 吧台库存」为准，老存档退回按关卡推导 */
  const all=['gin','bourbon','rum'];
  if(Array.isArray(SAVE.inventory) && SAVE.inventory.length){
    const got=all.filter(id=>SAVE.inventory.includes(id));
    if(got.length) return got;
  }
  return all.slice(0, Math.max(1, Math.min(3, D.level)));
}
function prepItems(tab){
  if(tab==='spirit') return spiritPool().map(id=>({key:'spirit:'+id,id,art:bottleSVG(id),name:SPIRITS[id].name}));
  if(tab==='aux') return Object.keys(AUX).map(id=>{
    const a=AUX[id]; const art=(id==='egg'||id==='mint'||id==='sugar'||id==='limewedge')?itemSVG(id):bottleSVG(id);
    return {key:'aux:'+id,id,art,name:a.name};
  });
  if(tab==='ice') return Object.keys(ICES).map(id=>({key:'ice:'+id,id,art:iceSVG(id),name:ICES[id].name}));
  return ['rocks','collins','highball','coupe'].map(id=>({key:'glass:'+id,id,art:id==='shaker'?shakerSVG({cap:true}):glassSVG(id,{ratio:0}),name:GLASSES[id].short}));
}
function isPicked(key){
  const [t,id]=key.split(':');
  if(t==='spirit') return D.pick.spirit===id;
  if(t==='aux') return D.pick.aux.has(id);
  if(t==='ice') return D.pick.ice===id;
  return D.pick.glass===id;
}
function renderPrepSheet(){
  const stock=[['spirit','基酒'],['aux','辅料'],['ice','冰'],['glass','杯具']];
  prepSheet.innerHTML=stock.map(([group,label])=>`<section><h3>${label}</h3><div class="flat-stock">${prepItems(group).map(it=>`<button data-pick="${it.key}" aria-pressed="${isPicked(it.key)}"><span>${stockArt(it.id)}</span>${it.name}</button>`).join('')}</div></section>`).join('');
  prepSheet.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>togglePick(b.dataset.pick));
}

function refreshPicks(){
  const uiHtml=hudHTML(); ui.innerHTML=uiHtml; bindHUD();
  if(D.screen==='prep' && S3===canvasBar) renderPrepSheet();
  syncPicked();
  updateTimerUI();
}

/* ---------- screens ---------- */
async function showCover(){
  stopTimer(); D.tasting=false;
  SaloonGuest.show(null);
  D.screen='cover'; overlayEl.classList.remove('on'); makeRoot.innerHTML=''; closeMake(true);
  world.classList.remove('hidden'); if(prepSheet){prepSheet.classList.remove('on');prepSheet.innerHTML='';}
  if(!D.seats.length) initLevel(SAVE.unlocked);
  if(typeof S3!=='undefined'){ S3.setSeats([],-1); S3.setCam(0,8,0); S3.render(); }
  ui.innerHTML=liveCoverHTML(); bindCover();
}
async function showBar(fromPrep){
  D.screen='bar'; world.classList.remove('hidden');
  renderWorld(); renderHUD();
  await camTo(0,6,700,{roll:1.2});
}
async function goBarToPrep(){
  if(D.busy) return; D.busy=true;
  D.screen='prep'; D.prepFocus=false; if(typeof S3!=='undefined'&&S3.blurStation) S3.blurStation(); renderWorld(); renderHUD();
  await camTo(180,-3,0);
  D.busy=false;
}
async function goPrepToBar(make=true){
  if(D.busy) return; D.busy=true;
  D.prepFocus=false; if(typeof S3!=='undefined'&&S3.blurStation) S3.blurStation();
  D.screen='bar'; renderWorld(); renderHUD();
  await camTo(0,2,0);
  D.busy=false;
  if(make) startMake();
}
function startMake(){
  if(D.busy) return;
  D.busy=true;
  if(typeof S3!=='undefined'){ S3.setSeats([],-1); S3.render(); }
  camTo(0,-18,200,{roll:1}).then(()=>{ D.busy=false; openMake(false); });
}
async function fadeTo(screen,after){
  if(screen==='bar'){
    D.screen='bar'; renderWorld(); renderHUD();
    await camTo(0,2,650,{roll:1});
    if(after) after();
  }else if(screen==='cover'){ showCover(); }
}

/* ---------- make integration ---------- */
const _openMake=openMake;
openMake=function(auto){
  makeRoot.innerHTML=makeLayerHTML();
  _openMake(auto);
  /* v11.11：制作层自带 topbar / steps / 工单 / 底部操作条，
     再叠一层吧台 HUD 会造成顶部标题、订单条、工单三重重影（用户反馈）。
     制作态隐藏 HUD，信息不丢失：备注、配方、目标刻度都在工单里。 */
  document.documentElement.classList.add('making');
  const back=document.getElementById('backToBarBtn');
  if(back) back.onclick=()=>{ closeMake();renderWorld(); if(typeof S3!=='undefined'){ S3.setSeats([],-1); S3.render(); } camTo(0,10,600); };
  updateTimerUI();                  /* 制作层也有右上角计时，打开即刻同步 */
};
function closeMake(silent){
  const layer=document.getElementById('makeLayer');
  if(layer){ layer.classList.remove('on'); }
  document.documentElement.classList.remove('making');
  M.active=false; M.pouring=false; if(typeof M!=='undefined') M.paused=false;
  if(!silent) setTimeout(()=>{ if(!M.active) makeRoot.innerHTML=''; },400);
}
function advanceCustomer(){
  const cur=D.order;
  const rest=D.seats.filter(o=>o && o!==cur);
  /* v11.15：计时营业中源源不断来客 —— 每交付一杯立刻补一位新客人（3 席不空），
     打烊后不再补位，服务完在场客人即关末结算。 */
  if(!D.timeUp){
    while(rest.length<3 && D.pending.length) rest.push(makeCustomer(D.pending.shift(), rest.length));
    while(rest.length<3) rest.push(makeCustomer(rest.length));
  }
  D.seats=rest;
  D.seats.forEach((o,i)=>{ if(o) o.seat=i; });   /* 座位号与 3D 座位重排后保持一致，表情不贴错人 */
  if(!D.seats.length){ D.order=null; D.pick=emptyPick(); syncPicked(); return; }
  setActive(0);                     /* 新客自带空备料，syncPicked 清掉上杯的 3D 框选 */
}
function showFinal(){
  if(D.paidOut) return;
  SaloonGuest.show(null);
  D.paidOut=true; D.timeUp=true; D.screen='result'; stopTimer();
  clearTimeout(reactWorldTimer); clearTimeout(reactTimer); fxEl.replaceChildren();
  cancelAnimationFrame(camRaf); ++camToken;
  closeMake(true); makeRoot.replaceChildren(); ui.replaceChildren(); prepSheet.classList.remove('on');
  const points=shiftScore(), goal=currentGoal(), passed=points>=goal;
  const medals=[goal,goal+100,goal+200].filter(target=>points>=target).length;
  const earned=D.results.reduce((sum,r)=>sum+r.coins,0);
  SAVE.coins+=earned;
  if(nightRound){
    nightTotal+=points;
    const best=SAVE.nightBest||{};
    SAVE.nightBest={round:Math.max(best.round||0,nightRound),total:Math.max(best.total||0,nightTotal)};
    saveGame();
    overlayEl.innerHTML=`<section class="modal result-card"><div class="result-kicker">无尽夜班 · 第 ${nightRound} 轮</div><div class="result-title">${passed?'本轮达标':'打烊了'}</div><p>本轮 ${points} / ${goal} 分 · 共交付 ${D.served} 杯</p><p>本次夜班 ${nightTotal} 分 · 历史最高 ${SAVE.nightBest.total} 分</p><div class="result-actions"><button class="btn" id="nightNext">${passed?'进入第 '+(nightRound+1)+' 轮':'再开一班'}</button><button class="btn" id="shiftExit">选关</button></div></section>`;
    overlayEl.classList.add('on');
    $('#nightNext').onclick=()=>startLevel(3,passed?nightRound+1:1,passed?nightTotal:0);
    $('#shiftExit').onclick=showLevels;
    return;
  }
  SAVE.bestScores??={};
  const previous=SAVE.bestScores[D.level]||0;
  SAVE.races??={};
  if(points>0 && (points>previous || (points===previous && !SAVE.races[D.level]))){
    let cumulative=0;
    SAVE.races[D.level]=D.results.map(r=>({at:r.at,points:(cumulative+=r.score)}));
  }
  SAVE.bestScores[D.level]=Math.max(points,SAVE.bestScores[D.level]||0);
  const next=passed && D.level<LEVELS2.length;
  if(next){
    SAVE.unlocked=Math.max(SAVE.unlocked,D.level+1);
    const gift=LEVELS2[D.level-1].unlock;
    if(!SAVE.inventory.includes(gift)) SAVE.inventory.push(gift);
  }
  saveGame();
  overlayEl.innerHTML=`<section class="modal result-card"><div class="result-kicker">第 ${D.level} 关 · 已收档</div>
    <div class="result-title">${points} 分</div><div class="result-sub">${passed?'达成营业目标':'距离通关还差 '+(goal-points)+' 分'} · 目标 ${goal} 分</div>
    <div class="stars">${[1,2,3].map(i=>`<span class="star ${i<=medals?'on':''}">★</span>`).join('')}</div>
    <p>交付 ${D.served} 杯 · 完美 ${D.results.filter(r=>r.score===100).length} 杯 · 最佳 ${SAVE.bestScores[D.level]} 分</p>
    <p class="race-recap">${points>previous?'个人新高 · 提升 '+(points-previous)+' 分':previous?'个人纪录 '+previous+' 分':'首次营业'} · 快单 ${D.results.filter(r=>r.rushTip).length} 杯 · 最长完美连击 ${D.bestStreak}</p>
    <div class="shift-receipts">${D.results.map(r=>`<div class="dish-line"><span>#${r.no} ${r.name}</span><b>+${r.score} 分</b></div>`).join('')}</div>
    <div class="result-actions"><button class="btn" id="finalBtn">${next?'下一关':passed?'再挑战一次':'重新营业'}</button><button class="btn" id="shiftExit">选关</button></div></section>`;
  overlayEl.classList.add('on');
  document.getElementById('finalBtn').onclick=()=>{overlayEl.classList.remove('on');startLevel(next?D.level+1:D.level);};
  document.getElementById('shiftExit').onclick=showLevels;
}
function showLevels(){
  prepSheet.classList.remove("on"); clearTimeout(reactWorldTimer); fxEl.replaceChildren();
  stopTimer(); D.tasting=false;
  SaloonGuest.show(null);
  D.screen='levels'; world.classList.add('hidden'); overlayEl.classList.remove('on');
  makeRoot.innerHTML=''; closeMake(true);
  nightRound=0;nightTotal=0;
  ui.innerHTML=levelsScene();
  if($("#nightStart"))$("#nightStart").onclick=()=>startLevel(3,1);
  loadEngine().catch(()=>{});
  const back=document.getElementById('lvBack'); if(back) back.onclick=()=>showCover();
  const st=document.getElementById('lvStart'); if(st) st.onclick=()=>{ SFX.ding(); startLevel(SAVE.unlocked); };
  document.querySelectorAll('.lv-card.on[data-level]').forEach(el=>{
    el.onclick=()=>{ SFX.unlock(); SFX.ding(); startLevel(+el.dataset.level); };
  });
}
/* ---------- boot ---------- */
let sceneReady=false;
function ensureScene(){
  if(sceneReady)return;
  try{ S3.init(); S3.resize?.(); }
  catch(error){
    console.warn('使用轻量画面',error.message);
    S3=canvasBar;
    document.documentElement.classList.add('canvas-bar');
    S3.init();
  }
  if(typeof S3!=='undefined' && S3.setPickHandler) S3.setPickHandler(i=>{
    if(D.screen!=='prep') return;
    D.prepTab=['spirit','aux','ice','glass'][i]; D.prepFocus=true; S3.focusStation(i); renderHUD(); SFX.tick();
  });
  if(typeof S3!=='undefined' && S3.setItemPickHandler) S3.setItemPickHandler(k=>{
    if(D.screen!=='prep' || !k) return;
    togglePick(k);
  });
  if(typeof S3!=='undefined' && S3.setBlurHandler) S3.setBlurHandler(()=>{
    D.prepFocus=false; renderHUD();
  });
  sceneReady=true;
}
async function boot(){
  if(D.booted) return; D.booted=true; fitView();
  initLevel(1);
  const q=new URLSearchParams(location.search);
  if(q.get('still')) document.documentElement.classList.add('still');
  const shot=q.get('shot');
  if(shot && shot!=='levels'){await loadEngine();ensureScene();}
  try{
  if(shot==='bar'){ showBar(); }
  else if(shot==='prep'){ D.screen='prep'; D.prepFocus=false; world.classList.remove('hidden'); renderWorld(); renderHUD(); if(typeof S3!=='undefined'&&S3.blurStation) S3.blurStation(); cam.yaw=180;cam.pitch=4;applyCam(); }
  else if(shot==='prepfocus'){ D.screen='prep'; D.prepFocus=true; world.classList.remove('hidden'); renderWorld(); renderHUD(); cam.yaw=180;cam.pitch=2;applyCam(); if(typeof S3!=='undefined'&&S3.focusStation) S3.focusStation(0); }
  else if(shot==='prepfull'||shot==='make'){
    const o=D.order; D.pick.spirit=o.ingredients.find(i=>i.role==='spirit').id;
    o.ingredients.filter(i=>i.role!=='spirit'&&i.target>0).forEach(i=>D.pick.aux.add(i.id));
    D.pick.ice=o.ice; D.pick.glass=o.glass;
    if(shot==='make'){showBar();startMake();}
    else{D.screen='prep'; world.classList.remove('hidden'); renderWorld(); renderHUD(); cam.yaw=180;cam.pitch=4;applyCam();}
  }
  else if(shot==='levels'){ showLevels(); }
  else if(shot==='turn'){ D.screen='bar'; world.classList.remove('hidden'); renderWorld(); renderHUD(); cam.yaw=70;cam.pitch=0;applyCam(); }
  else if(shot==='turn110'){ D.screen='bar'; world.classList.remove('hidden'); renderWorld(); renderHUD(); cam.yaw=110;cam.pitch=0;applyCam(); }
  else if(shot==='turn150'){ D.screen='bar'; world.classList.remove('hidden'); renderWorld(); renderHUD(); cam.yaw=150;cam.pitch=0;applyCam(); }
  else { showCover(); }
  }catch(e){ const d=document.getElementById('err'); if(d){d.style.display='block';d.textContent='BOOT '+e.message+'\n'+e.stack;} }
  if(location.pathname.endsWith('/dev.html') && q.has('save') && typeof S3!=='undefined'){
    setTimeout(()=>{ try{ fetch('http://127.0.0.1:8850/save?name='+encodeURIComponent(q.get('save')),{method:'POST',headers:{'Content-Type':'text/plain'},body:S3.snapshot()}); }catch(e){} },1400);
  }
  if(window.ResizeObserver)new ResizeObserver(fitView).observe($('#playArea'));
  window.addEventListener('resize',fitView);
  window.visualViewport?.addEventListener('resize',fitView);
}
function fitView(){
  const area=document.getElementById('playArea');
  const w=area.clientWidth,h=area.clientHeight;
  const s=Math.min(w/480,h/940);
  if(!s)return;
  const portrait=w<=h;
  stage.style.width=(portrait?w/s:480)+'px';
  stage.style.height=(portrait?h/s:940)+'px';
  document.documentElement.style.setProperty('--s',String(s));
  if(typeof S3!=='undefined')S3.resize?.();
  document.documentElement.style.setProperty('--appH',h+'px');
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden && M.active && M.pouring && !M.paused) pausePour();
});
boot();

SFX.preload();
BGM.start();
for(const event of ['pointerdown','touchend','click','keydown','WeixinJSBridgeReady']){
  document.addEventListener(event,()=>SFX.unlock(),{capture:true,passive:true});
}
