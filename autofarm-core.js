/* hoanganh Auto Farm: independent deterministic movement and upgrade scoring.
   Pure utilities: safe to test without the game or extension runtime. */
const HAF=(()=>{
 'use strict';
 const KEY='ha_autofarm_v1_config',REPORT_KEY='ha_autofarm_v1_status';
 const DEFAULT=Object.freeze({pattern:'adaptive',moveMs:1050,swapSkills:true,skillMs:2800,
   autoBuild:true,pokemon:0,buildStyle:'best',autoPick:true,priority:'balanced',autoReplay:true,maxMinutes:0,maxRuns:0});
 const keys=Object.freeze({w:['w','KeyW',87],a:['a','KeyA',65],s:['s','KeyS',83],d:['d','KeyD',68],e:['e','KeyE',69],f:['f','KeyF',70],v:['v','KeyV',86],n:['n','KeyN',78],
   '1':['1','Digit1',49],'2':['2','Digit2',50],'3':['3','Digit3',51],'4':['4','Digit4',52],'5':['5','Digit5',53],'6':['6','Digit6',54],'7':['7','Digit7',55],'8':['8','Digit8',56],'9':['9','Digit9',57]});
 const plans=Object.freeze({
  orbit:[['w'],['w','d'],['d'],['s','d'],['s'],['s','a'],['a'],['w','a']],
  zigzag:[['w','d'],['w','d'],['s','d'],['s','d'],['w','a'],['w','a'],['s','a'],['s','a']],
  sweep:[['d'],['d'],['s'],['a'],['a'],['w']]
 });
 function clamp(n,min,max,defaultValue){const x=Number(n);return Number.isFinite(x)?Math.max(min,Math.min(max,Math.round(x))):defaultValue}
 function amount(value){if(typeof value==='number')return Number.isFinite(value)&&value>=0?Math.min(1e12,Math.floor(value)):null;const text=String(value??'').trim().toLowerCase().replace(/\s/g,'');if(!text)return 0;const m=text.match(/^(\d+(?:[.,]\d+)?)([km])$/);if(m){const n=Number(m[1].replace(',','.'))*(m[2]==='k'?1000:1e6);return Number.isFinite(n)?Math.min(1e12,Math.floor(n)):null}if(!/^(?:\d+|\d{1,3}(?:[,.]\d{3})+)$/.test(text))return null;return Math.min(1e12,Number(text.replace(/[,.]/g,'')))}
 function sanitize(raw={}){raw=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const tagKinds=['coin','ticket','ticket10','chest','rift','wall','hazard','heal','altar','xp','ignore'];
  const tags=Object.fromEntries(Object.entries(raw.tags&&typeof raw.tags==='object'?raw.tags:{}).filter(([k,v])=>/^\d+x\d+:[0-9a-f]+$/.test(k)&&tagKinds.includes(v)).slice(0,200));
  const customBuilds=Object.fromEntries(Object.entries(raw.customBuilds||{}).filter(([k,v])=>/^\d{1,5}$/.test(k)&&Array.isArray(v)&&v.length===4&&new Set(v).size===4&&v.every(x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(x))).slice(0,1200));
  return {preferredItem:typeof raw.preferredItem==='string'&&/^[a-z]{1,32}$/.test(raw.preferredItem)?raw.preferredItem:'',customBuilds,keepAwake:raw.keepAwake===true,tmPolicy:'auto',seekEvents:raw.seekEvents!==false,autoSpecialCards:raw.autoSpecialCards!==false,goals:Object.fromEntries(['coins','tickets','gems','candy'].map(k=>[k,amount(raw.goals?.[k])??0])),useOwnedTms:false,prepareBuild:false,completionSound:raw.completionSound!==false,riftMode:raw.riftMode==='balanced'?'balanced':'force',autoOrbs:raw.autoOrbs!==false,autoZMove:raw.autoZMove!==false,autoReroll:raw.autoReroll!==false,farmGoal:raw.farmGoal==='survival'?'survival':'coins',seekChests:raw.seekChests!==false,seekRifts:raw.seekRifts!==false,seekBosses:raw.seekBosses!==false,collectLoot:raw.collectLoot!==false,autoItems:raw.autoItems!==false,rerollBudget:clamp(raw.rerollBudget,0,10,0),retreatHp:clamp(raw.retreatHp,20,70,45),bossHp:clamp(raw.bossHp,40,100,75),bossLevel:clamp(raw.bossLevel,1,50,12),combatRange:clamp(raw.combatRange,40,220,130),overlay:raw.overlay===true,tags,autoBuild:true,pokemon:clamp(raw.pokemon,0,20000,0),buildStyle:['best','melee','ranged'].includes(raw.buildStyle)?raw.buildStyle:'best',pattern:(raw.pattern==='adaptive'||Object.hasOwn(plans,raw.pattern))?raw.pattern:DEFAULT.pattern,
   moveMs:clamp(raw.moveMs,400,3500,DEFAULT.moveMs),swapSkills:raw.swapSkills===undefined?DEFAULT.swapSkills:raw.swapSkills===true,
   skillMs:clamp(raw.skillMs,1000,15000,DEFAULT.skillMs),autoPick:raw.autoPick===undefined?DEFAULT.autoPick:raw.autoPick===true,
   priority:['balanced','attack','survival','resources'].includes(raw.priority)?raw.priority:DEFAULT.priority,
   autoReplay:raw.autoReplay===undefined?DEFAULT.autoReplay:raw.autoReplay===true,maxMinutes:clamp(raw.maxMinutes,0,1440,DEFAULT.maxMinutes),maxRuns:clamp(raw.maxRuns,0,10000,DEFAULT.maxRuns)} }
 function step(pattern,index){const plan=plans[pattern]||plans.orbit;return [...plan[((index%plan.length)+plan.length)%plan.length]]}
 const weights={balanced:[2,2,2,2],attack:[6,0,-1,0],survival:[0,6,0,1],resources:[1,0,6,1]};
 function score(text,priority='balanced'){
  const t=String(text||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const w=weights[priority]||weights.balanced;
  const atk=/(attack|damage|crit|cooldown|dps|speed of attack|power|sat thuong|tan cong|toc danh|physical|special|evol|upgrade move)/.test(t);
  const hp=/(health|hp\b|defen|shield|heal|regen|surviv|armor|dodge|healing|blood|mau|hoi phuc|phong thu)/.test(t);
  const loot=/(experience|\bxp\b|exp gain|amulet coin|lucky egg|fortune|luck|coin|gold|pickup|magnet|resource|loot|xu\b|kinh nghiem|nhat)/.test(t);
  const any=/(upgrade|level|bonus|evolve|boost|tang|nang cap)/.test(t);
  return w[0]*(atk?1:0)+w[1]*(hp?1:0)+w[2]*(loot?1:0)+w[3]*(any?1:0);
 }
 function select(cards,priority){let best=-Infinity,index=0;cards.forEach((c,i)=>{const s=score(c,priority);if(s>best){best=s;index=i}});return index}
 return Object.freeze({KEY,REPORT_KEY,DEFAULT,keys,step,sanitize,amount,score,select});
})();
